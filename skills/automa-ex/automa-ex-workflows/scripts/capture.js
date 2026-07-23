/**
 * Puppeteer HTML & DOM Capture Script
 * Location: .agents/skills/automa/scripts/capture.js
 *
 * Usage:
 *   node capture.js <url> [outputHtmlPath] [screenshotPath] [waitForSelector] [timeoutMs]
 */

const path = require("path");
const fs = require("fs");

let puppeteer;
try {
  puppeteer = require("puppeteer");
} catch (e) {
  console.error("Error: 'puppeteer' module not found.");
  console.error("Please run 'npm install puppeteer' in the scripts directory.");
  process.exit(1);
}

(async () => {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Error: URL argument is required.");
    console.error(
      "Usage: node capture.js <url> [outputHtmlPath] [screenshotPath] [waitForSelector] [timeoutMs]",
    );
    process.exit(1);
  }

  const targetUrl = args[0];
  const outputHtmlPath = args[1] ? path.resolve(args[1]) : null;
  const screenshotPath = args[2] ? path.resolve(args[2]) : null;
  const waitForSelector = args[3] || null;
  const timeoutMs = args[4] ? parseInt(args[4], 10) : 10000;

  console.log(`[Capture] Launching browser for: ${targetUrl}`);

  let browser;
  let exitCode = 0;
  try {
    const launchOptions = {
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
      ],
    };

    // Use PUPPETEER_EXECUTABLE_PATH if defined, otherwise let Puppeteer use its bundled browser
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Set a common User-Agent to avoid simple bot detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    console.log(`[Capture] Navigating to page...`);
    await page.goto(targetUrl, {
      waitUntil: "networkidle2",
      timeout: timeoutMs,
    });

    if (waitForSelector) {
      console.log(`[Capture] Waiting for selector: ${waitForSelector}`);
      await page.waitForSelector(waitForSelector, { timeout: timeoutMs });
    } else {
      // Small delay to allow any client-side hydration/rendering to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Capture HTML/DOM
    const htmlContent = await page.content();

    if (outputHtmlPath) {
      // Ensure directory exists
      const dir = path.dirname(outputHtmlPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputHtmlPath, htmlContent, "utf8");
      console.log(`[Capture] HTML successfully saved to: ${outputHtmlPath}`);
    } else {
      // Print HTML to stdout if no output file path is provided
      console.log(htmlContent);
    }

    // Capture screenshot if requested
    if (screenshotPath) {
      const dir = path.dirname(screenshotPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`[Capture] Screenshot saved to: ${screenshotPath}`);
    }

    console.log("[Capture] Complete successfully.");
    exitCode = 0;
  } catch (error) {
    console.error(
      "[Capture] Error occurred during HTML capture:",
      error.message,
    );
    exitCode = 2;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  process.exit(exitCode);
})();
