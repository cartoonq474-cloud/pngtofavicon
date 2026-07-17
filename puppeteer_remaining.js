const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1800 });
  
  const urls = [
    { name: 'what-is-a-favicon-fixed', path: path.join(__dirname, 'tutorials', 'what-is-a-favicon', 'index.html') },
    { name: 'favicon-sizes-fixed', path: path.join(__dirname, 'tutorials', 'favicon-sizes', 'index.html') }
  ];

  for (const item of urls) {
      await page.goto('file://' + item.path, { waitUntil: 'networkidle0' });
      await page.screenshot({ path: `${item.name}.png`, fullPage: true });
  }
  
  await browser.close();
})();
