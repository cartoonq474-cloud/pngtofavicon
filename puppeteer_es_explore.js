const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  
  const fileUrl = 'file://' + path.join(__dirname, 'es', 'index.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  const exploreElement = await page.$('#other-tools');
  if (exploreElement) {
    await exploreElement.screenshot({ path: 'es-explore-tools-translated.png' });
  }
  
  await browser.close();
})();
