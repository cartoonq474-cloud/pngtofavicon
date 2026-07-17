const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1800 });
  
  const urls = [
    { name: 'favicon-seo-guide-fixed', path: path.join(__dirname, 'blog', 'favicon-seo-guide', 'index.html') },
    { name: 'png-vs-ico-fixed', path: path.join(__dirname, 'blog', 'png-vs-ico-vs-svg-favicons', 'index.html') }
  ];

  for (const item of urls) {
      await page.goto('file://' + item.path, { waitUntil: 'networkidle0' });
      await page.screenshot({ path: `${item.name}.png`, fullPage: true });
  }
  
  await browser.close();
})();
