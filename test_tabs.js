const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const mainJs = fs.readFileSync('js/main.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });

// Polyfill offsetHeight since jsdom doesn't have it
Object.defineProperty(dom.window.HTMLElement.prototype, 'offsetHeight', {
  get: function() { return 100; }
});

// Inject main.js
const script = dom.window.document.createElement("script");
script.textContent = mainJs;
dom.window.document.body.appendChild(script);

// Wait a bit for DOMContentLoaded (JSDOM fires it automatically when parsing is done, but we injected script after)
// Actually we can just manually dispatch it
dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

setTimeout(() => {
  const document = dom.window.document;
  const tabs = document.querySelectorAll('.faq-tab-btn');
  console.log("Found tabs:", tabs.length);
  
  const featuresTab = Array.from(tabs).find(t => t.textContent.includes('Features'));
  console.log("Clicking features tab...");
  
  featuresTab.click();
  
  const featuresGroup = document.getElementById('faq-features');
  console.log("Features group active?", featuresGroup.classList.contains('active'));
  console.log("Features group display:", featuresGroup.style.display);
  
  const gettingStartedGroup = document.getElementById('faq-getting-started');
  console.log("Getting Started group active?", gettingStartedGroup.classList.contains('active'));
  console.log("Getting Started group display:", gettingStartedGroup.style.display);

  if (dom.window.errors && dom.window.errors.length) {
    console.error("Errors found:", dom.window.errors);
  }
}, 500);
