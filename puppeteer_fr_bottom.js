const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  
  const fileUrl = 'file://' + path.join(__dirname, 'fr', 'index.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  // Scroll to bottom to ensure lazy-loaded elements are visible if any
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  // We want to capture the bottom of the page (Bottom CTA + Explore Tools + Footer)
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.screenshot({ 
    path: 'fr-bottom-layout-fixed.png',
    clip: {
      x: 0,
      y: Math.max(0, bodyHeight - 1200), // capture bottom 1200px
      width: 1280,
      height: 1200
    }
  });
  
  await browser.close();
})();
