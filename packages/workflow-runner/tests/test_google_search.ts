import puppeteer from 'puppeteer-core';
import { WorkflowEngine } from '../src/engine/WorkflowEngine.js';
import { IBrowserAdapter, TabInfo, TabMessagePayload, TabMessageOptions } from '../src/adapters/IBrowserAdapter.js';

class PuppeteerBrowserAdapter implements IBrowserAdapter {
  browser: any = null;
  page: any = null;

  async launch() {
    console.log('[Puppeteer] Launching Chrome...');
    this.browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: false,
      defaultViewport: null
    });
  }

  async getActiveTab(): Promise<TabInfo | null> {
    return { id: 1 };
  }

  async createTab(options: { url: string; active?: boolean }): Promise<TabInfo> {
    console.log(`[Adapter] Creating tab with URL: ${options.url}`);
    if (!this.page) {
      const pages = await this.browser.pages();
      this.page = pages[0] || await this.browser.newPage();
    }
    await this.page.goto(options.url, { waitUntil: 'networkidle2' });
    return { id: 1 };
  }

  async sendMessageToTab(tabId: number, message: TabMessagePayload, options?: TabMessageOptions): Promise<any> {
    console.log(`[Adapter] Sending message to tab: ${message.label || message.name}`);
    
    if (message.label === 'forms' || message.name === 'forms') {
      console.log(`[Puppeteer] Typing "${message.data?.value}" into ${message.data?.selector}`);
      await this.page.type(message.data?.selector, message.data?.value, { delay: 100 });
      return { status: 'success' };
    }
    
    if (message.label === 'event-click' || message.name === 'event-click') {
      console.log(`[Puppeteer] Clicking element ${message.data?.selector}`);
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {}),
        this.page.click(message.data?.selector)
      ]);
      return { status: 'success' };
    }
    
    return { status: 'ignored' };
  }

  async updateTab() { return { id: 1 }; }
  async removeTab() {}
  async close() {
    if (this.browser) await this.browser.close();
  }
}

// Custom block handlers mapped to the Adapter
async function newTabBlock(this: any, { id, data }: any) {
  await this.browserAdapter.createTab({ url: data.url });
  return { nextBlockId: this.getBlockConnections(id) };
}

async function formsBlock(this: any, { id, data }: any) {
  await this.browserAdapter.sendMessageToTab(1, {
    label: 'forms',
    data: { selector: data.selector, value: data.value }
  });
  return { nextBlockId: this.getBlockConnections(id) };
}

async function clickBlock(this: any, { id, data }: any) {
  await this.browserAdapter.sendMessageToTab(1, {
    label: 'event-click',
    data: { selector: data.selector }
  });
  return { nextBlockId: this.getBlockConnections(id) };
}

async function triggerBlock(this: any, block: any) {
  return { nextBlockId: this.getBlockConnections(block.id) };
}

async function runGoogleSearch() {
  const adapter = new PuppeteerBrowserAdapter();
  await adapter.launch();

  const engine = new WorkflowEngine({
    browserAdapter: adapter,
    options: { debugMode: true }
  });

  engine.registerBlocksHandler({
    'trigger': triggerBlock,
    'new-tab': newTabBlock,
    'forms': formsBlock,
    'event-click': clickBlock
  });

  const searchWorkflow = {
    id: 'google-search-workflow',
    name: 'Google Search Test',
    drawflow: {
      nodes: [
        { id: '1', label: 'trigger', data: {} },
        { id: '2', label: 'new-tab', data: { url: 'https://www.google.com' } },
        { id: '3', label: 'forms', data: { selector: 'textarea[name="q"]', value: 'Automa Extension GitHub' } },
        { id: '4', label: 'event-click', data: { selector: 'input[name="btnK"]' } }
      ],
      edges: [
        { source: '1', target: '2' },
        { source: '2', target: '3' },
        { source: '3', target: '4' }
      ]
    }
  };

  console.log('Starting Google Search Workflow via Core Engine...');
  
  engine.on('block:execute', ({ block }) => {
    console.log(`[Engine] Executing Block: ${block.label} (${block.id})`);
  });

  engine.init(searchWorkflow);
  
  return new Promise((resolve) => {
    engine.on('workflow:done', async (event) => {
      console.log('Workflow finished with status:', event.status);
      console.log('Test successful! Browser will close in 3 seconds...');
      setTimeout(async () => {
        await adapter.close();
        resolve(event);
      }, 3000);
    });
    engine.on('workflow:error', (err) => {
      console.error('Workflow ERROR:', err);
    });
    engine.execute();
  });
}

runGoogleSearch().catch(console.error);
