const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Navigate to local file
  const filePath = `file:///${path.resolve(__dirname, 'index.html').replace(/\\/g, '/')}`;
  console.log(`Navigating to ${filePath}`);
  
  // Catch console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser Error: ${msg.text()}`);
    }
  });
  page.on('pageerror', error => {
    console.error(`Browser Page Error: ${error.message}`);
  });

  await page.goto(filePath, { waitUntil: 'networkidle0' });
  console.log("Page loaded successfully.");

  // Check initial state
  console.log("Checking initial FAQ state...");
  let activeTab = await page.$eval('.faq-tab-btn.active', el => el.textContent);
  let activeGroup = await page.$eval('.faq-group.active', el => el.id);
  console.log(`- Active Tab: ${activeTab}`);
  console.log(`- Active Group ID: ${activeGroup}`);

  // Take initial screenshot
  await page.screenshot({ path: 'faq_initial.png', fullPage: true });

  // Click 'Features' tab
  console.log("\\nClicking 'Features' tab...");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.faq-tab-btn'));
    const featuresTab = tabs.find(t => t.textContent.includes('Features'));
    if (featuresTab) featuresTab.click();
  });
  await new Promise(r => setTimeout(r, 500)); // wait for transition
  
  activeTab = await page.$eval('.faq-tab-btn.active', el => el.textContent);
  activeGroup = await page.$eval('.faq-group.active', el => el.id);
  let groupDisplay = await page.$eval('#faq-features', el => getComputedStyle(el).display);
  
  console.log(`- Active Tab is now: ${activeTab}`);
  console.log(`- Active Group ID is now: ${activeGroup}`);
  console.log(`- Display of faq-features is: ${groupDisplay}`);
  
  await page.screenshot({ path: 'faq_features.png', fullPage: true });

  // Click 'Technology' tab
  console.log("\\nClicking 'Technology' tab...");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.faq-tab-btn'));
    const techTab = tabs.find(t => t.textContent.includes('Technology'));
    if (techTab) techTab.click();
  });
  await new Promise(r => setTimeout(r, 500)); // wait for transition
  
  activeTab = await page.$eval('.faq-tab-btn.active', el => el.textContent);
  activeGroup = await page.$eval('.faq-group.active', el => el.id);
  groupDisplay = await page.$eval('#faq-technology', el => getComputedStyle(el).display);
  
  console.log(`- Active Tab is now: ${activeTab}`);
  console.log(`- Active Group ID is now: ${activeGroup}`);
  console.log(`- Display of faq-technology is: ${groupDisplay}`);
  
  // Click 'About Us' tab
  console.log("\\nClicking 'About Us' tab...");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.faq-tab-btn'));
    const aboutTab = tabs.find(t => t.textContent.includes('About Us'));
    if (aboutTab) aboutTab.click();
  });
  await new Promise(r => setTimeout(r, 500)); // wait for transition
  
  activeTab = await page.$eval('.faq-tab-btn.active', el => el.textContent);
  activeGroup = await page.$eval('.faq-group.active', el => el.id);
  groupDisplay = await page.$eval('#faq-about-us', el => getComputedStyle(el).display);
  
  console.log(`- Active Tab is now: ${activeTab}`);
  console.log(`- Active Group ID is now: ${activeGroup}`);
  console.log(`- Display of faq-about-us is: ${groupDisplay}`);

  await browser.close();
  console.log("\\nTest completed successfully!");
})();
