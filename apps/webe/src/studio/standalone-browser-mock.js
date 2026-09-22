/**
 * Robust Standalone Browser API & webextension-polyfill Mock
 * Uses a Recursive Proxy to safely handle any Chrome/Browser API path without crashing.
 */

import { emitIpcMessage } from './adapters/host-bridge';
import { useStudioStore } from './stores/useStudioStore';
import pinia from '../lib/pinia';

function getStore() {
  try {
    return useStudioStore(pinia);
  } catch (_) {
    return null;
  }
}

const storageArea = {
  get: (keys, cb) => {
    const res = {};
    const keyList = Array.isArray(keys)
      ? keys
      : typeof keys === 'string'
      ? [keys]
      : Object.keys(keys || {});

    const store = getStore();
    keyList.forEach((key) => {
      if (key === 'workflows') {
        const wf = store?.currentWorkflow;
        res.workflows = wf ? { [wf.id || 'default']: wf } : {};
      } else if (key === 'isFirstTime') {
        res.isFirstTime = false;
      } else {
        res[key] = null;
      }
    });

    if (typeof cb === 'function') cb(res);
    return Promise.resolve(res);
  },
  set: (items, cb) => {
    if (items && typeof items === 'object') {
      if (items.workflows) {
        const wfs = items.workflows;
        const store = getStore();
        if (store) {
          const targetId = store.currentWorkflow?.id;
          if (targetId && wfs[targetId]) {
            store.updateWorkflowDetails(wfs[targetId]);
            emitIpcMessage('workflow-changed', store.currentWorkflow);
          } else {
            const firstKey = Object.keys(wfs)[0];
            if (firstKey) {
              store.updateWorkflowDetails(wfs[firstKey]);
              emitIpcMessage('workflow-changed', store.currentWorkflow);
            }
          }
        }
      }
    }
    if (typeof cb === 'function') cb();
    return Promise.resolve();
  },
  remove: (keys, cb) => {
    if (typeof cb === 'function') cb();
    return Promise.resolve();
  },
  clear: (cb) => {
    if (typeof cb === 'function') cb();
    return Promise.resolve();
  },
};

function createMockProxy(name = '') {
  const dummyFn = function (...args) {
    const lastArg = args[args.length - 1];
    if (typeof lastArg === 'function') {
      lastArg({});
    }
    return Promise.resolve({});
  };

  dummyFn.addListener = () => {};
  dummyFn.removeListener = () => {};
  dummyFn.hasListener = () => false;
  dummyFn.hasListeners = () => false;

  return new Proxy(dummyFn, {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return undefined;
      }
      if (
        prop === Symbol.toPrimitive ||
        prop === 'toString' ||
        prop === 'valueOf'
      ) {
        return () => `[MockBrowser ${name}]`;
      }
      if (prop in target) {
        return target[prop];
      }
      return createMockProxy(name ? `${name}.${String(prop)}` : String(prop));
    },
  });
}

const mockBrowser = new Proxy(
  {
    runtime: {
      id: 'automa-standalone-studio',
      sendMessage: (_data, cb) => {
        if (typeof cb === 'function') cb({});
        return Promise.resolve({});
      },
      onMessage: {
        addListener: () => {},
        removeListener: () => {},
        hasListener: () => false,
      },
      getManifest: () => ({ version: '1.0.0', name: 'Automa Studio' }),
      getURL: (path) => path || '',
    },
    storage: {
      local: storageArea,
      sync: storageArea,
      managed: storageArea,
      onChanged: {
        addListener: () => {},
        removeListener: () => {},
      },
    },
    tabs: {
      query: () => Promise.resolve([]),
      create: () => Promise.resolve({ id: 1 }),
      update: () => Promise.resolve({ id: 1 }),
      remove: () => Promise.resolve(),
      sendMessage: (_id, _data, cb) => {
        if (typeof cb === 'function') cb({});
        return Promise.resolve({});
      },
      onRemoved: { addListener: () => {}, removeListener: () => {} },
      onUpdated: { addListener: () => {}, removeListener: () => {} },
    },
    windows: {
      getCurrent: () => Promise.resolve({ id: 1 }),
      create: () => Promise.resolve({ id: 1 }),
      getAll: () => Promise.resolve([{ id: 1 }]),
      onRemoved: { addListener: () => {}, removeListener: () => {} },
    },
  },
  {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      return createMockProxy(String(prop));
    },
  }
);

if (typeof window !== 'undefined') {
  window.chrome = mockBrowser;
  window.browser = mockBrowser;
}

export default mockBrowser;
