import browser from 'webextension-polyfill';
import { isXPath, sleep, getActiveTab } from '@/utils/helper';

const isMV2 = browser.runtime.getManifest().manifest_version === 2;

function isStandaloneMode() {
  return (
    typeof window !== 'undefined' &&
    (window.__IS_STANDALONE_STUDIO__ ||
      !browser.tabs ||
      typeof browser.tabs.query !== 'function' ||
      !browser.tabs.sendMessage)
  );
}

function validateSelectorSyntax(selector, isXpath) {
  try {
    if (isXpath) {
      if (typeof document !== 'undefined' && document.createExpression) {
        document.createExpression(selector, null);
      }
    } else if (typeof document !== 'undefined') {
      document.createDocumentFragment().querySelector(selector);
    }
    return true;
  } catch (_) {
    return false;
  }
}

async function makeDashboardFocus() {
  if (isStandaloneMode()) return;
  try {
    const [currentTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (currentTab?.windowId) {
      await browser.windows.update(currentTab.windowId, {
        focused: true,
      });
    }
  } catch (_) {
    // Ignored
  }
}

export async function initElementSelector(tab = null) {
  if (isStandaloneMode()) return;

  let activeTab = tab;
  if (!tab) {
    activeTab = await getActiveTab();
  }
  if (!activeTab?.id) return;

  try {
    const result = await browser.tabs.sendMessage(activeTab.id, {
      type: 'automa-element-selector',
    });

    if (!result) {
      if (isMV2) {
        await browser.tabs.executeScript(activeTab.id, {
          allFrames: true,
          runAt: 'document_start',
          file: './elementSelector.bundle.js',
        });
      } else {
        await browser.scripting.executeScript({
          target: {
            allFrames: true,
            tabId: activeTab.id,
          },
          files: ['./elementSelector.bundle.js'],
        });
      }
    }

    await browser.tabs.update(activeTab.id, { active: true });
    await browser.windows.update(activeTab.windowId, { focused: true });
  } catch (_) {
    // Ignored
  }
}

async function verifySelector(data) {
  if (isStandaloneMode()) {
    const isXpath = isXPath(data.selector);
    const isValid = validateSelectorSyntax(data.selector, isXpath);
    return { notFound: !isValid, isValid, standalone: true };
  }

  try {
    const activeTab = await getActiveTab();
    if (!activeTab?.id) {
      return { notFound: true };
    }

    if (!data.findBy) {
      data.findBy = isXPath(data.selector) ? 'xpath' : 'cssSelector';
    }

    await browser.tabs.update(activeTab.id, { active: true });
    await browser.windows.update(activeTab.windowId, { focused: true });

    const result = await browser.tabs.sendMessage(
      activeTab.id,
      {
        data,
        isBlock: true,
        label: 'verify-selector',
      },
      { frameId: 0 }
    );

    return result || { notFound: true };
  } catch (error) {
    console.error(error);
    await sleep(500);
    return { notFound: true };
  } finally {
    await makeDashboardFocus();
  }
}

async function selectElement(name) {
  if (isStandaloneMode()) {
    // In Standalone Web Studio, prompt or return helper info
    const input = window.prompt(
      'Standalone Studio: Enter CSS Selector or XPath for this element:'
    );
    return input ? input.trim() : null;
  }

  const tab = await getActiveTab();
  if (!tab?.id) return null;

  await initElementSelector(tab);

  const port = await browser.tabs.connect(tab.id, { name });
  const getSelector = () => {
    return new Promise((resolve, reject) => {
      port.onDisconnect.addListener(() => {
        reject(new Error('Port closed'));
      });
      port.onMessage.addListener(async (message) => {
        try {
          makeDashboardFocus();
        } catch (error) {
          console.error(error);
        } finally {
          resolve(message);
        }
      });
    });
  };

  const selector = await getSelector();
  return selector;
}

export default {
  selectElement,
  verifySelector,
};
