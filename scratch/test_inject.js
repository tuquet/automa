const fs = require('fs');
const puppeteer = require('puppeteer-core');

(async () => {
    const extPath = 'd:\\\\Repository\\\\automa-ecosystem\\\\automa-cli\\\\extensions\\\\automa-ex';
    const browser = await puppeteer.launch({
        executablePath: 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
        headless: false,
        args: [
            `--disable-extensions-except=${extPath}`,
            `--load-extension=${extPath}`
        ]
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    const targets = await browser.targets();
    const extTarget = targets.find(t => t.url().startsWith('chrome-extension://') && t.type() === 'service_worker');
    const extId = extTarget.url().split('/')[2];
    
    const page = await browser.newPage();
    await page.goto(`chrome-extension://${extId}/execute.html`, { waitUntil: 'domcontentloaded' });
    
    const wfData = JSON.parse(fs.readFileSync('d:\\\\Repository\\\\automa-ecosystem\\\\automa-vault\\\\demo\\\\google-messi.automa.json', 'utf8'));
    
    const injected = await page.evaluate(async (wfStr) => {
        return new Promise((resolve) => {
            const wf = JSON.parse(wfStr);
            chrome.storage.local.get('workflows', (result) => {
                let workflows = result.workflows || {};
                if (Array.isArray(workflows)) {
                    const obj = {};
                    workflows.forEach(w => { if (w && w.id) obj[w.id] = w; });
                    workflows = obj;
                }
                workflows[wf.id] = wf;
                chrome.storage.local.set({ workflows, isFirstTime: false }, () => {
                    chrome.storage.local.get('workflows', (res2) => {
                        resolve(res2.workflows);
                    });
                });
            });
        });
    }, JSON.stringify(wfData));
    
    console.log('Injected workflows keys:', Object.keys(injected));
    console.log('Injected workflow drawflow exists?', injected[wfData.id].drawflow ? 'yes' : 'no');
    
    await browser.close();
})();
