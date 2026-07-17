const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  const filePath = `file:///${path.resolve(__dirname, 'index.html').replace(/\\/g, '/')}`;
  
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  
  // Scroll to bottom to capture the flow of bottom-cta -> other-tools -> footer
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  
  // wait a bit for any scroll animations
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await page.screenshot({ path: 'bottom-layout-screenshot.png', fullPage: false });
  
  await browser.close();
})();
