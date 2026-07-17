const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const indexPath = path.join(__dirname, 'index.html');
const textFaviconPath = path.join(__dirname, 'text-to-favicon', 'index.html');

// Read the files
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const textFaviconHtml = fs.readFileSync(textFaviconPath, 'utf8');

const mainDom = new JSDOM(indexHtml);
const mainDoc = mainDom.window.document;

const textDom = new JSDOM(textFaviconHtml);
const textDoc = textDom.window.document;

// 1. Extract sections from main index.html
const testimonialsNode = mainDoc.getElementById('testimonials');
const whatsIncludedNode = mainDoc.getElementById('whats-included');
const otherToolsNode = mainDoc.getElementById('other-tools');
const bottomCtaNode = mainDoc.querySelector('.bottom-cta');

// 2. Build the Tool UI string
const toolHtml = `
    <!-- ============================== -->
    <!--       MAIN TOOL SECTION        -->
    <!-- ============================== -->
    <section class="section" id="tool">
      <div class="container">
        <div class="tool-grid" style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 2rem;">
          
          <!-- Left Column: Controls -->
          <div class="card" style="padding: 2rem;">
            <h2 style="margin-bottom: 1.5rem; font-size: 1.5rem;">Favicon Settings</h2>
            
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label for="textInput" style="display:block; margin-bottom: 0.5rem; font-weight: 600;">Text / Initials</label>
              <input type="text" id="textInput" value="PF" maxlength="3" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-card); color: var(--text-color); font-size: 1rem;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
              <div class="form-group">
                <label for="fontSelect" style="display:block; margin-bottom: 0.5rem; font-weight: 600;">Font Family</label>
                <select id="fontSelect" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-card); color: var(--text-color);">
                  <option value="Inter">Inter</option>
                  <option value="'Space Grotesk'">Space Grotesk</option>
                  <option value="'Playfair Display'">Playfair Display</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Outfit">Outfit</option>
                  <option value="'JetBrains Mono'">JetBrains Mono</option>
                  <option value="'Roboto Mono'">Roboto Mono</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                </select>
              </div>
              <div class="form-group">
                <label for="fontWeightSelect" style="display:block; margin-bottom: 0.5rem; font-weight: 600;">Font Weight</label>
                <select id="fontWeightSelect" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-card); color: var(--text-color);">
                  <option value="400">Regular</option>
                  <option value="500">Medium</option>
                  <option value="600" selected>Semi-Bold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extra Bold</option>
                  <option value="900">Black</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label for="fontSizeInput" style="display:block; margin-bottom: 0.5rem; font-weight: 600;">Font Size: <span id="fontSizeVal">55</span>%</label>
              <input type="range" id="fontSizeInput" min="20" max="100" value="55" style="width: 100%; accent-color: var(--primary-color);">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
              <div class="form-group">
                <label for="colorText" style="display:block; margin-bottom: 0.5rem; font-weight: 600;">Text Color</label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input type="color" id="colorText" value="#ffffff" style="width: 40px; height: 40px; border: none; cursor: pointer; background: transparent; padding: 0;">
                  <span id="colorTextVal" style="font-family: monospace;">#ffffff</span>
                </div>
              </div>
              <div class="form-group">
                <label for="colorBg" style="display:block; margin-bottom: 0.5rem; font-weight: 600;">Background</label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input type="color" id="colorBg" value="#8b5cf6" style="width: 40px; height: 40px; border: none; cursor: pointer; background: transparent; padding: 0;">
                  <span id="colorBgVal" style="font-family: monospace;">#8b5cf6</span>
                </div>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500;">
                <input type="checkbox" id="transparentBg" style="width: 18px; height: 18px; accent-color: var(--primary-color);">
                <span>Transparent Background</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-top: 0.75rem; font-weight: 500;">
                <input type="checkbox" id="includeManifest" checked style="width: 18px; height: 18px; accent-color: var(--primary-color);">
                <span>Include site.webmanifest (PWA)</span>
              </label>
            </div>

            <div class="form-group">
              <label for="shapeSelect" style="display:block; margin-bottom: 0.5rem; font-weight: 600;">Background Shape</label>
              <select id="shapeSelect" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-card); color: var(--text-color);">
                <option value="square">Square</option>
                <option value="rounded" selected>Rounded Square</option>
                <option value="circle">Circle</option>
              </select>
            </div>
          </div>

          <!-- Right Column: Output -->
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- Main Canvas Preview -->
            <div class="card text-center" style="padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 250px;">
              <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Live Preview</h3>
              <div style="background-image: linear-gradient(45deg, #111 25%, transparent 25%, transparent 75%, #111 75%, #111), linear-gradient(45deg, #111 25%, transparent 25%, transparent 75%, #111 75%, #111); background-size: 20px 20px; background-position: 0 0, 10px 10px; padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                 <canvas id="mainPreviewCanvas" width="256" height="256" style="width: 128px; height: 128px; display: block; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);"></canvas>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="card" style="padding: 1.5rem;">
              <button id="downloadAllBtn" class="btn btn-primary" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 0.75rem; padding: 1.25rem; font-size: 1.1rem; border-radius: 8px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Favicon Pack (ZIP)
              </button>
              <div id="progressBar" class="hidden" style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 1rem; overflow: hidden;">
                <div class="fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #8b5cf6, #06d6a0); transition: width 0.3s ease;"></div>
              </div>
            </div>

            <!-- HTML Code Snippet -->
            <div class="card" style="padding: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.1rem; margin: 0;">HTML Code</h3>
                <button class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 6px; background: rgba(255,255,255,0.1);" onclick="navigator.clipboard.writeText(document.getElementById('htmlCode').textContent); window.showToastNotification('Code copied!', 'success');">Copy</button>
              </div>
              <pre style="background: rgba(0,0,0,0.4); padding: 1.25rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.1); color: #a5b4fc;"><code id="htmlCode"></code></pre>
            </div>
            
            <!-- Generated Sizes Grid -->
            <div class="card" style="padding: 1.5rem;">
              <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">Included Formats</h3>
              <div id="previewGrid" class="preview-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem;">
                 <!-- Injected by JS -->
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
`;

const tempDiv = textDoc.createElement('div');
tempDiv.innerHTML = toolHtml;
const toolNode = tempDiv.firstElementChild;

// Style fix for media query layout (desktop vs mobile)
const styleTag = textDoc.createElement('style');
styleTag.innerHTML = `
  @media (max-width: 768px) {
    .tool-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;
textDoc.head.appendChild(styleTag);

// 3. Inject the Tool UI
const hero = textDoc.getElementById('hero');
hero.parentNode.insertBefore(toolNode, hero.nextSibling);

// 4. Inject global sections
const howToGenerate = textDoc.getElementById('how-to-generate');
if (testimonialsNode) howToGenerate.parentNode.insertBefore(testimonialsNode.cloneNode(true), howToGenerate.nextSibling);

const testimonialsInText = textDoc.getElementById('testimonials');
if (whatsIncludedNode && testimonialsInText) testimonialsInText.parentNode.insertBefore(whatsIncludedNode.cloneNode(true), testimonialsInText.nextSibling);

const faq = textDoc.getElementById('faq');
if (bottomCtaNode && faq) faq.parentNode.insertBefore(bottomCtaNode.cloneNode(true), faq.nextSibling);

const footer = textDoc.querySelector('footer');
if (otherToolsNode && footer) {
  // Before footer, insert otherTools
  footer.parentNode.insertBefore(otherToolsNode.cloneNode(true), footer);
}

// Write the result
fs.writeFileSync(textFaviconPath, textDom.serialize(), 'utf8');
console.log('Successfully injected all missing sections into text-to-favicon/index.html');
