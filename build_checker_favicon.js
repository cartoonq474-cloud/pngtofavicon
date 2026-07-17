const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const indexPath = path.join(__dirname, 'index.html');
const checkerPath = path.join(__dirname, 'favicon-checker', 'index.html');

// Read files
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const checkerHtml = fs.readFileSync(checkerPath, 'utf8');

const mainDoc = new JSDOM(indexHtml).window.document;
const checkerDom = new JSDOM(checkerHtml);
const checkerDoc = checkerDom.window.document;

// 1. Update "How it works" section
const howToNode = checkerDoc.getElementById('how-to-generate');
if (howToNode) {
    howToNode.innerHTML = `
      <div class="container text-center">
        <h2 class="section-title" style="margin-bottom: 1rem;">How Favicon Validation Works</h2>
        <p class="section-subtitle" style="margin-bottom: 3rem;">Follow these simple steps to audit your website's favicons</p>
        
        <div class="steps" style="grid-template-columns: repeat(4, 1fr);">
          <div class="step glass-card animate-on-scroll" id="step-1">
            <div class="step-icon-circle step-icon-1" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div class="step-number-badge">1</div>
            <h3>Input Website URL</h3>
            <p>Paste the full HTTP or HTTPS address of the website you wish to analyze.</p>
          </div>
          
          <div class="step glass-card animate-on-scroll animate-delay-1" id="step-2">
            <div class="step-icon-circle step-icon-2" style="background: rgba(6, 214, 160, 0.1); color: #06d6a0;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div class="step-number-badge">2</div>
            <h3>Source Fetch & Parse</h3>
            <p>Our client-side engine retrieves the page source and inspects the head headers for matching links.</p>
          </div>
          
          <div class="step glass-card animate-on-scroll animate-delay-2" id="step-3">
            <div class="step-icon-circle step-icon-3" style="background: rgba(236, 72, 153, 0.1); color: #ec4899;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div class="step-number-badge">3</div>
            <h3>File Validation</h3>
            <p>Checks if favicon.ico, apple-touch-icon, and manifest files are correctly installed and reachable.</p>
          </div>

          <div class="step glass-card animate-on-scroll animate-delay-3" id="step-4">
            <div class="step-icon-circle step-icon-4" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div class="step-number-badge">4</div>
            <h3>Get Report Card</h3>
            <p>Instantly get status checks on fallback files, retina-display configurations, and actionable recommendations.</p>
          </div>
        </div>

        <div class="steps-badge-container">
          <div class="steps-badge">
            <span class="badge-dot"></span>
            100% Free &amp; secure developer assets
          </div>
        </div>
      </div>
    `;
}

// 2. Extract global sections from main index.html
const featuresNode = mainDoc.getElementById('why-choose-features')?.cloneNode(true);
const useCasesNode = mainDoc.getElementById('use-cases')?.cloneNode(true);
const comparisonNode = mainDoc.getElementById('why-pngtofavicon')?.cloneNode(true);
const whatsIncludedNode = mainDoc.getElementById('whats-included')?.cloneNode(true);
const testimonialsNode = mainDoc.getElementById('testimonials')?.cloneNode(true);
const bottomCtaNode = mainDoc.querySelector('.bottom-cta')?.cloneNode(true);
const otherToolsNode = mainDoc.getElementById('other-tools')?.cloneNode(true);

// Modify texts for favicon-checker
const featuresTitle = featuresNode.querySelector('h2');
if (featuresTitle) featuresTitle.textContent = "Why Audit Favicons Here?";
const feature1P = featuresNode.querySelector('.feature-card:nth-child(1) p');
if (feature1P) feature1P.textContent = "Get instant audit results without waiting in line.";

const useCasesSubtitle = useCasesNode.querySelector('.section-subtitle');
if (useCasesSubtitle) useCasesSubtitle.textContent = "Ensure your web projects have the perfect favicon setup.";
const webDevP = useCasesNode.querySelector('.use-case-card:nth-child(1) p');
if (webDevP) webDevP.textContent = "Instantly audit all required favicon sizes for your web projects.";

const compTitle = comparisonNode.querySelector('h2');
if (compTitle) compTitle.textContent = "Favicon Checker vs Other Tools";

// Re-inject these sections into favicon-checker
const faqNode = checkerDoc.getElementById('faq');

// Insert between how-to-generate and faq:
// how-to-generate (already section-alt)
// features (section)
// use-cases (section-alt)
// comparison (section)
// whats-included (section-alt)
// testimonials (section)
// faq (section-alt)

featuresNode.classList.remove('section-alt');
useCasesNode.classList.add('section-alt');
comparisonNode.classList.remove('section-alt');
whatsIncludedNode.classList.add('section-alt');
testimonialsNode.classList.remove('section-alt');
faqNode.classList.add('section-alt');

howToNode.parentNode.insertBefore(featuresNode, faqNode);
howToNode.parentNode.insertBefore(useCasesNode, faqNode);
howToNode.parentNode.insertBefore(comparisonNode, faqNode);
howToNode.parentNode.insertBefore(whatsIncludedNode, faqNode);
howToNode.parentNode.insertBefore(testimonialsNode, faqNode);

// Insert after faq:
bottomCtaNode.classList.remove('section-alt');
otherToolsNode.classList.add('section-alt'); 

const mainElement = checkerDoc.querySelector('main');
mainElement.appendChild(bottomCtaNode);
mainElement.appendChild(otherToolsNode);

// Save file
fs.writeFileSync(checkerPath, checkerDom.serialize(), 'utf8');
console.log('Successfully rebuilt favicon-checker/index.html');
