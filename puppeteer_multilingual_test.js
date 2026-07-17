const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1800 });
  
  const urls = [
    { name: 'es-homepage-test', path: path.join(__dirname, 'es', 'index.html') },
    { name: 'es-text-to-favicon-test', path: path.join(__dirname, 'es', 'text-to-favicon', 'index.html') },
    { name: 'es-favicon-best-practices-test', path: path.join(__dirname, 'es', 'tutorials', 'favicon-best-practices', 'index.html') }
  ];

  for (const item of urls) {
      await page.goto('file://' + item.path, { waitUntil: 'networkidle0' });
      await page.screenshot({ path: `${item.name}.png`, fullPage: true });
  }
  
  await browser.close();
})();
