const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1600 });
  
  const fileUrl = 'file://' + path.join(__dirname, 'hi', 'index.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  // Wait a moment for animations
  await new Promise(r => setTimeout(r, 500));
  
  await page.screenshot({ path: 'hi-fully-translated.png', fullPage: true });
  
  await browser.close();
})();
