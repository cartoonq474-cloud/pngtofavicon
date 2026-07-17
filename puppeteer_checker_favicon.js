const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 2800 });
  
  const fileUrl = 'file://' + path.join(__dirname, 'favicon-checker', 'index.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'favicon-checker-screenshot.png', fullPage: true });
  
  await browser.close();
})();
