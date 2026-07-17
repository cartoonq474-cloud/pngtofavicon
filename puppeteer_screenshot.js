const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  const filePath = `file:///${path.resolve(__dirname, 'index.html').replace(/\\/g, '/')}`;
  
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  
  const element = await page.$('#use-cases');
  await element.screenshot({ path: 'use-cases-section.png' });
  
  await browser.close();
})();
