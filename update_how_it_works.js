const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const textFaviconPath = path.join(__dirname, 'text-to-favicon', 'index.html');
const html = fs.readFileSync(textFaviconPath, 'utf8');

const dom = new JSDOM(html);
const document = dom.window.document;

const howToGenerateSection = document.getElementById('how-to-generate');
if (howToGenerateSection) {
    howToGenerateSection.innerHTML = `
      <div class="container text-center">
        <h2 class="section-title" style="margin-bottom: 1rem;">How this text to Favicon tools works</h2>
        <p class="section-subtitle" style="margin-bottom: 3rem;">100% Client-Side. Private, Fast, and Secure.</p>
        
        <div class="steps" style="grid-template-columns: repeat(4, 1fr);">
          <div class="step glass-card animate-on-scroll" id="step-1">
            <div class="step-icon-circle step-icon-1" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <div class="step-number-badge">1</div>
            <h3>Real-Time Canvas Rendering</h3>
            <p>The tool uses HTML5 Canvas to instantly draw backgrounds and mathematical typography in real-time, straight in your browser.</p>
          </div>
          
          <div class="step glass-card animate-on-scroll animate-delay-1" id="step-2">
            <div class="step-icon-circle step-icon-2" style="background: rgba(6, 214, 160, 0.1); color: #06d6a0;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </div>
            <div class="step-number-badge">2</div>
            <h3>Binary ICO Construction</h3>
            <p>Instead of server tools, the script manually stitches raw PNG byte arrays into perfectly compliant ICO binary structures.</p>
          </div>
          
          <div class="step glass-card animate-on-scroll animate-delay-2" id="step-3">
            <div class="step-icon-circle step-icon-3" style="background: rgba(236, 72, 153, 0.1); color: #ec4899;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <div class="step-number-badge">3</div>
            <h3>ZIP Packaging</h3>
            <p>Multiple sizes and dynamic webmanifest files are packaged directly in memory using client-side JSZip.</p>
          </div>

          <div class="step glass-card animate-on-scroll animate-delay-3" id="step-4">
            <div class="step-icon-circle step-icon-4" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div class="step-number-badge">4</div>
            <h3>Client-Side Download</h3>
            <p>The bundle is converted to a Blob URL for instant, secure downloads without any server interaction or privacy risks.</p>
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
    
    fs.writeFileSync(textFaviconPath, dom.serialize(), 'utf8');
    console.log("Successfully updated the How It Works section.");
} else {
    console.error("Could not find #how-to-generate section.");
}
