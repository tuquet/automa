const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Set viewport to a desktop size
  await page.setViewport({ width: 1280, height: 800 });

  // Navigate to localhost:3000
  console.log("Navigating to http://localhost:3000 ...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Take a screenshot
  console.log("Taking screenshot...");
  await page.screenshot({ path: 'screenshot.png' });
  
  // Log heights of interesting elements
  const heights = await page.evaluate(() => {
    const getH = (id) => {
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect().height : null;
    };
    return {
      workspaceLayoutV2: getH('workspace-layout-v2'),
      workbenchTop: getH('workbench.top'),
      workspaceLayoutH2: getH('workspace-layout-h2'),
      sidebarPanel: getH('workbench.parts.sidebar.panel'),
      editorPanel: getH('workbench.parts.editor'),
      terminalPanel: getH('workbench.parts.panel'),
      restOfWorkspaceDiv: document.querySelector('.flex-1.min-w-0.overflow-hidden.flex.pb-6')?.getBoundingClientRect().height,
      mainContainer: getH('workbench.main.container')
    };
  });
  
  console.log("Heights:", heights);

  await browser.close();
})();
