const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 2800 });
  
  const fileUrl = 'file://' + path.join(__dirname, 'emoji-to-favicon', 'index.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'emoji-to-favicon-screenshot.png', fullPage: true });
  
  await browser.close();
})();
