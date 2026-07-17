const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  const filePath = `file:///${path.resolve(__dirname, 'es/index.html').replace(/\\/g, '/')}`;
  
  await page.goto(filePath);
  
  await page.waitForSelector('#use-cases');
  const element = await page.$('#use-cases');
  await element.screenshot({ path: 'es-use-cases-translated.png' });
  await browser.close();
})();
