import { sendMessage } from '@/utils/message';
import BackgroundWorkflowUtils from '@/background/BackgroundWorkflowUtils';
import WorkflowEngine from '@/workflowEngine/WorkflowEngine';
import { workerSse, appendJobLog, finishJob } from '@automa/types/api';

const DAEMON_BASE_URL = 'http://127.0.0.1:8765';

let isWorkerDaemonInitialized = false;
let isOffscreenDaemonInitialized = false;

export default function (context, message) {
  if (context === 'background') {
    initWorkerDaemon(message);
  } else if (context === 'offscreen') {
    initOffscreenDaemon(message);
  }
}

function initOffscreenDaemon(messageListener) {
  if (isOffscreenDaemonInitialized) return;
  isOffscreenDaemonInitialized = true;

  console.log('[Automa Core] Initializing offscreen monkey-patches...');

  const originalAddLogHistory = WorkflowEngine.prototype.addLogHistory;
  WorkflowEngine.prototype.addLogHistory = function (detail) {
    originalAddLogHistory.call(this, detail);

    if (this.options?.isDaemonJob && this.options?.jobId) {
      sendMessage(
        'daemon:log',
        {
          jobId: this.options.jobId,
          data: { type: 'log', logs: [detail] },
        },
        'background'
      ).catch(console.error);
    }
  };

  const originalDispatchEvent = WorkflowEngine.prototype.dispatchEvent;
  WorkflowEngine.prototype.dispatchEvent = function (name, params) {
    originalDispatchEvent.call(this, name, params);

    if (
      this.options?.isDaemonJob &&
      this.options?.jobId &&
      name === 'destroyed'
    ) {
      sendMessage(
        'daemon:finish',
        {
          jobId: this.options.jobId,
        },
        'background'
      ).catch(console.error);
    }
  };
}

let currentDaemonBaseUrl = DAEMON_BASE_URL;

async function initWorkerDaemon(message) {
  if (isWorkerDaemonInitialized) return;
  isWorkerDaemonInitialized = true;

  console.log('[Automa Core Worker] Initializing SSE connection...');

  async function connect() {
    let browserId = 'daemon_worker';
    let daemonBaseUrl = DAEMON_BASE_URL;
    try {
      const configRes = await fetch(chrome.runtime.getURL('daemon.json'));
      if (configRes.ok) {
        const config = await configRes.json();
        if (config.browserId) browserId = config.browserId;
        if (config.baseUrl) {
          daemonBaseUrl = config.baseUrl;
        } else if (config.port) {
          daemonBaseUrl = `http://127.0.0.1:${config.port}`;
        }
        currentDaemonBaseUrl = daemonBaseUrl;
      }
    } catch (_) {
      // Ignored
    }

    try {
      const { stream } = await workerSse({
        baseUrl: daemonBaseUrl,
        query: { browserId },
      });
      console.log(
        `[Automa Core Worker] Connected to Automa Core (Browser: ${browserId}).`
      );

      for await (const event of stream) {
        let payload;
        if (typeof event === 'string') {
          try {
            payload = JSON.parse(event);
          } catch (_) {
            // Ignored
          }
        } else if (event && event.data) {
          try {
            payload =
              typeof event.data === 'string'
                ? JSON.parse(event.data)
                : event.data;
          } catch (_) {
            // Ignored
          }
        } else {
          payload = event;
        }

        if (payload && payload.jobId && payload.workflowData) {
          console.log(`[Automa Daemon Worker] Received Job ${payload.jobId}`);

          const triggerNode =
            payload.workflowData.drawflow?.nodes?.find(
              (n) => n.label === 'trigger' || n.type === 'trigger'
            ) ||
            payload.workflowData.nodes?.find(
              (n) => n.label === 'trigger' || n.type === 'trigger'
            );
          const defaultVars = {};
          if (triggerNode?.data?.parameters) {
            triggerNode.data.parameters.forEach((param) => {
              if (param.name && param.defaultValue !== undefined) {
                defaultVars[param.name] = param.defaultValue;
              }
            });
          }
          const mergedVars = {
            ...defaultVars,
            ...(payload.options?.variables || {}),
          };

          console.log(
            `[Automa Daemon Worker] Invoking executeWorkflow for ${payload.jobId}...`
          );
          BackgroundWorkflowUtils.instance
            .executeWorkflow(payload.workflowData, {
              jobId: payload.jobId,
              isDaemonJob: true,
              checkParams: false,
              data: {
                variables: mergedVars,
              },
            })
            .then(() => {
              console.log(
                `[Automa Daemon Worker] executeWorkflow FINISHED for ${payload.jobId}`
              );
            })
            .catch((err) => {
              console.error(
                '[Automa Daemon Worker] executeWorkflow error:',
                err
              );
              appendJobLog({
                baseUrl: currentDaemonBaseUrl,
                path: { job_id: payload.jobId },
                body: {
                  type: 'error',
                  message: `executeWorkflow failed: ${String(err)}`,
                },
              }).catch(console.error);
            });
        }
      }

      console.debug(
        '[Automa Daemon Worker] Connection closed. Reconnecting in 5s...'
      );
      setTimeout(connect, 5000);
    } catch (e) {
      console.debug(
        '[Automa Daemon Worker] Connection error. Reconnecting in 5s...',
        e
      );
      setTimeout(connect, 5000);
    }
  }

  connect();

  if (message && typeof message.on === 'function') {
    message.on('daemon:log', async (payload) => {
      try {
        await appendJobLog({
          baseUrl: currentDaemonBaseUrl,
          path: { job_id: payload.jobId },
          body: payload.data,
        });
      } catch (e) {
        console.error('[Automa Daemon] Failed to push log', e);
      }
    });

    message.on('daemon:finish', async (payload) => {
      try {
        await finishJob({
          baseUrl: currentDaemonBaseUrl,
          path: { job_id: payload.jobId },
        });
      } catch (e) {
        console.error('[Automa Daemon] Failed to finish job', e);
      }
    });
  }

  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (
        msg?.name === 'background--daemon:log' ||
        msg?.name === 'daemon:log'
      ) {
        const payload = msg.body || msg.payload || msg.data;
        if (payload?.jobId) {
          appendJobLog({
            baseUrl: currentDaemonBaseUrl,
            path: { job_id: payload.jobId },
            body: payload.data,
          }).catch(console.error);
        }
      } else if (
        msg?.name === 'background--daemon:finish' ||
        msg?.name === 'daemon:finish'
      ) {
        const payload = msg.body || msg.payload || msg.data;
        if (payload?.jobId) {
          finishJob({
            baseUrl: currentDaemonBaseUrl,
            path: { job_id: payload.jobId },
          }).catch(console.error);
        }
      }
    });
  }
}
