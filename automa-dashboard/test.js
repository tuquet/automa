const puppeteer = require('puppeteer');
const fs = require('fs');

const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; width: 100%; }
    .v-group { display: flex; flex-direction: column; height: 100%; width: 100%; }
    .panel-top { display: flex; flex: 70 1 0px; background: red; }
    .panel-bottom { display: flex; flex: 30 1 0px; background: blue; }
    .inner-div { max-height: 100%; max-width: 100%; flex-grow: 1; overflow: auto; background: rgba(0,255,0,0.5); }
    .h-group { display: flex; flex-direction: row; height: 100%; width: 100%; background: yellow; }
  </style>
</head>
<body>
  <div class="v-group">
    <!-- Top Panel -->
    <div class="panel-top">
      <!-- Panel inner div -->
      <div class="inner-div">
        <!-- Horizontal Group inside Top Panel -->
        <div class="h-group">
           <div style="flex: 20 1 0px; background: pink;">Sidebar</div>
           <div style="flex: 80 1 0px; background: cyan;">Editor</div>
        </div>
      </div>
    </div>
    <!-- Bottom Panel -->
    <div class="panel-bottom">
      <div class="inner-div">Terminal</div>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync('test.html', html);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html);
  
  const hGroupHeight = await page.evaluate(() => {
    return document.querySelector('.h-group').getBoundingClientRect().height;
  });
  
  const innerDivHeight = await page.evaluate(() => {
    return document.querySelector('.inner-div').getBoundingClientRect().height;
  });

  const panelTopHeight = await page.evaluate(() => {
    return document.querySelector('.panel-top').getBoundingClientRect().height;
  });

  console.log({ hGroupHeight, innerDivHeight, panelTopHeight });

  // Test 2: make inner-div a flex container
  await page.evaluate(() => {
    document.querySelector('.inner-div').style.display = 'flex';
    document.querySelector('.inner-div').style.flexDirection = 'column';
  });

  const hGroupHeight2 = await page.evaluate(() => {
    return document.querySelector('.h-group').getBoundingClientRect().height;
  });
  
  console.log("After flex-col on inner-div:", { hGroupHeight2 });

  await browser.close();
})();
