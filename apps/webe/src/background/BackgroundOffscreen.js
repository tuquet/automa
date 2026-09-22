/* eslint-disable class-methods-use-this */
import { IS_FIREFOX } from '@/common/utils/constant';
import { sleep } from '@/utils/helper';
import { MessageListener } from '@/utils/message';
import Browser from 'webextension-polyfill';

const OFFSCREEN_URL = Browser.runtime.getURL('/offscreen.html');

class BackgroundOffscreen {
  /** @type {BackgroundOffscreen} */
  static #_instance;

  /**
   * OffscreenService singleton
   * @returns {BackgroundOffscreen}
   */
  static get instance() {
    if (!this.#_instance) {
      this.#_instance = new BackgroundOffscreen();
    }

    return this.#_instance;
  }

  /** @type {MessageListener} */
  #messageListener;

  constructor() {
    this.#messageListener = new MessageListener('offscreen');

    this.on = this.#messageListener.on;
  }

  /**
   *
   * @returns {Promise<boolean>}
   */
  async #ensureDocument() {
    if (IS_FIREFOX) return;

    const isOpened = await this.isOpened();
    if (isOpened) return;

    try {
      await chrome.offscreen.createDocument({
        url: OFFSCREEN_URL,
        reasons: [
          chrome.offscreen.Reason.BLOBS,
          chrome.offscreen.Reason.CLIPBOARD,
          chrome.offscreen.Reason.IFRAME_SCRIPTING,
        ],
        justification: 'For running the workflow',
      });
      await sleep(300);
    } catch (err) {
      if (!String(err).includes('single offscreen document')) {
        console.warn('[BackgroundOffscreen] createDocument warning:', err);
      }
    }
  }

  /**
   *
   * @returns {Promise<boolean>}
   */
  async isOpened() {
    if (IS_FIREFOX) return false;

    if (chrome.offscreen?.hasDocument) {
      try {
        return await chrome.offscreen.hasDocument();
      } catch (e) {
        // Ignored
      }
    }

    try {
      const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
      });

      return Boolean(contexts && contexts.length);
    } catch (e) {
      return false;
    }
  }

  /**
   *
   * @param {string} name
   * @param {*} data
   * @returns {Promise<*>}
   */
  async sendMessage(name, data, retries = 5) {
    let lastError = null;
    for (let i = 0; i < retries; i += 1) {
      await this.#ensureDocument();
      try {
        return await this.#messageListener.sendMessage(name, data);
      } catch (err) {
        lastError = err;
        if (
          i === retries - 1 ||
          !String(err).includes('Receiving end does not exist')
        ) {
          throw err;
        }
        await sleep(300);
      }
    }
    throw lastError || new Error('Failed to send message to offscreen');
  }
}

export default BackgroundOffscreen;
