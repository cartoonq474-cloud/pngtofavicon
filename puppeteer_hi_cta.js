const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  
  const fileUrl = 'file://' + path.join(__dirname, 'hi', 'index.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  const ctaElement = await page.$('.bottom-cta');
  if (ctaElement) {
    await ctaElement.screenshot({ path: 'hi-bottom-cta-translated.png' });
  }
  
  await browser.close();
})();
