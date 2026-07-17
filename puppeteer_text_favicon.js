const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  
  const fileUrl = 'file://' + path.join(__dirname, 'text-to-favicon', 'index.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'text-to-favicon-screenshot.png', fullPage: true });
  
  await browser.close();
})();
