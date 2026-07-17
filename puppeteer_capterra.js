const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  const filePath = `file:///${path.resolve(__dirname, 'preview_capterra.html').replace(/\\/g, '/')}`;
  
  await page.goto(filePath);
  
  await page.screenshot({ path: 'capterra-test.png' });
  await browser.close();
})();
