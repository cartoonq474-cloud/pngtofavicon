const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  const filePath = 'file://' + path.join(__dirname, 'es', 'text-to-favicon', 'index.html');
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  
  // Screenshot closed state (top area only)
  await page.screenshot({ path: 'es-dropdown-closed.png', clip: { x: 0, y: 0, width: 1280, height: 350 } });
  
  // Click trigger
  await page.click('.lang-dropdown-trigger');
  await new Promise(r => setTimeout(r, 300));
  
  // Screenshot open state (top area only)
  await page.screenshot({ path: 'es-dropdown-open.png', clip: { x: 0, y: 0, width: 1280, height: 350 } });
  
  await browser.close();
})();
