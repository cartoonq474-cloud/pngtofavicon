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

// Extract sections from main index.html
const featuresNode = mainDoc.getElementById('why-choose-features');
const useCasesNode = mainDoc.getElementById('use-cases');
const comparisonNode = mainDoc.getElementById('why-pngtofavicon');

if (!featuresNode || !useCasesNode || !comparisonNode) {
    console.error("Could not find all sections in index.html");
    process.exit(1);
}

// Clone them
const featuresClone = featuresNode.cloneNode(true);
const useCasesClone = useCasesNode.cloneNode(true);
const comparisonClone = comparisonNode.cloneNode(true);

// 1. Modify Features section
const featuresTitle = featuresClone.querySelector('h2');
if (featuresTitle) featuresTitle.textContent = "Why Generate Text Favicons Here?";
// Remove section-alt if it exists to alternate colors, wait, let's keep it as is.
featuresClone.classList.remove('section-alt'); // Ensure it's white bg

// 2. Modify Use Cases section
const useCasesSubtitle = useCasesClone.querySelector('.section-subtitle');
if (useCasesSubtitle) useCasesSubtitle.textContent = "Discover how our text to favicon tool works across different scenarios";

const webDevP = useCasesClone.querySelector('.use-case-card:nth-child(1) p');
if (webDevP) webDevP.textContent = "Instantly generate all required favicon sizes for your web projects from simple text.";

useCasesClone.classList.add('section-alt'); // Alternate bg

// 3. Modify Comparison Table section
const compTitle = comparisonClone.querySelector('h2');
if (compTitle) compTitle.textContent = "Text Favicon Generator vs Other Tools";
comparisonClone.classList.remove('section-alt');

// Find insertion point in text-to-favicon
const howToGenerate = textDoc.getElementById('how-to-generate');
if (!howToGenerate) {
    console.error("Could not find #how-to-generate in text-to-favicon");
    process.exit(1);
}

// Insert in order:
// how-to-generate (already section-alt)
// features (section)
// use-cases (section-alt)
// comparison (section)
// testimonials (section-alt) ... wait, we need to adjust alternating classes

howToGenerate.parentNode.insertBefore(comparisonClone, howToGenerate.nextSibling);
howToGenerate.parentNode.insertBefore(useCasesClone, howToGenerate.nextSibling);
howToGenerate.parentNode.insertBefore(featuresClone, howToGenerate.nextSibling);

// Fix alternating classes for remaining sections
const testimonials = textDoc.getElementById('testimonials');
if (testimonials) testimonials.classList.add('section-alt');

const whatsIncluded = textDoc.getElementById('whats-included');
if (whatsIncluded) whatsIncluded.classList.remove('section-alt');

const faq = textDoc.getElementById('faq');
if (faq) faq.classList.add('section-alt');

// Write the result
fs.writeFileSync(textFaviconPath, textDom.serialize(), 'utf8');
console.log('Successfully injected the 3 missing sections into text-to-favicon/index.html');
