const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1800 });
  
  const fileUrl = 'file://' + path.join(__dirname, 'tutorials', 'how-to-add-favicon', 'index.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'tutorial-screenshot.png', fullPage: true });
  
  await browser.close();
})();
