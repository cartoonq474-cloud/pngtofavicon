const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const indexPath = path.join(__dirname, 'index.html');
const textFaviconPath = path.join(__dirname, 'text-to-favicon', 'index.html');
const emojiFaviconPath = path.join(__dirname, 'emoji-to-favicon', 'index.html');

// Read files
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const textFaviconHtml = fs.readFileSync(textFaviconPath, 'utf8');
const emojiFaviconHtml = fs.readFileSync(emojiFaviconPath, 'utf8');

const mainDoc = new JSDOM(indexHtml).window.document;
const textDoc = new JSDOM(textFaviconHtml).window.document;
const emojiDom = new JSDOM(emojiFaviconHtml);
const emojiDoc = emojiDom.window.document;

// 1. Replace "How it works" section
const textHowToNode = textDoc.getElementById('how-to-generate');
const emojiHowToNode = emojiDoc.getElementById('how-to-generate');

if (textHowToNode && emojiHowToNode) {
    const newHowTo = textHowToNode.cloneNode(true);
    const h2 = newHowTo.querySelector('h2');
    if (h2) h2.textContent = "How this Emoji to Favicon tool works";
    
    // In step 1, change "mathematical typography" to "native system emojis"
    const step1P = newHowTo.querySelector('#step-1 p');
    if (step1P) step1P.innerHTML = "The tool uses HTML5 Canvas to instantly draw backgrounds and native system emojis in real-time, straight in your browser.";
    
    emojiHowToNode.replaceWith(newHowTo);
} else {
    console.error("Missing how-to-generate section in text-to-favicon or emoji-to-favicon");
}

// 2. Extract global sections from main index.html
const featuresNode = mainDoc.getElementById('why-choose-features')?.cloneNode(true);
const useCasesNode = mainDoc.getElementById('use-cases')?.cloneNode(true);
const comparisonNode = mainDoc.getElementById('why-pngtofavicon')?.cloneNode(true);
const whatsIncludedNode = mainDoc.getElementById('whats-included')?.cloneNode(true);
const testimonialsNode = mainDoc.getElementById('testimonials')?.cloneNode(true);
const bottomCtaNode = mainDoc.querySelector('.bottom-cta')?.cloneNode(true);
const otherToolsNode = mainDoc.getElementById('other-tools')?.cloneNode(true);

if (!featuresNode || !useCasesNode || !comparisonNode || !whatsIncludedNode || !testimonialsNode || !bottomCtaNode || !otherToolsNode) {
    console.error("Missing some global sections in index.html");
    process.exit(1);
}

// Modify texts for emoji tool
const featuresTitle = featuresNode.querySelector('h2');
if (featuresTitle) featuresTitle.textContent = "Why Generate Emoji Favicons Here?";

const useCasesSubtitle = useCasesNode.querySelector('.section-subtitle');
if (useCasesSubtitle) useCasesSubtitle.textContent = "Discover how our emoji to favicon tool works across different scenarios";
const webDevP = useCasesNode.querySelector('.use-case-card:nth-child(1) p');
if (webDevP) webDevP.textContent = "Instantly generate all required favicon sizes for your web projects from a simple emoji.";

const compTitle = comparisonNode.querySelector('h2');
if (compTitle) compTitle.textContent = "Emoji Favicon Generator vs Other Tools";

// Re-inject these sections into emoji-to-favicon
const howToNodeNew = emojiDoc.getElementById('how-to-generate');
const faqNode = emojiDoc.getElementById('faq');

if (!howToNodeNew || !faqNode) {
    console.error("Missing insertion points in emoji-to-favicon");
    process.exit(1);
}

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

howToNodeNew.parentNode.insertBefore(featuresNode, faqNode);
howToNodeNew.parentNode.insertBefore(useCasesNode, faqNode);
howToNodeNew.parentNode.insertBefore(comparisonNode, faqNode);
howToNodeNew.parentNode.insertBefore(whatsIncludedNode, faqNode);
howToNodeNew.parentNode.insertBefore(testimonialsNode, faqNode);

// Insert after faq:
// bottom-cta (section)
// other-tools (section-alt) - wait, bottom-cta isn't section-alt. But other-tools in text-to is not alt. Let's match homepage. 
bottomCtaNode.classList.remove('section-alt');
otherToolsNode.classList.add('section-alt'); // actually, let's just make it not alt, or whatever it is in index.html. Wait, in index.html bottom-cta doesn't have section-alt. other-tools has no section-alt either. Let's just remove section-alt from both just in case, or leave as is.

const mainElement = emojiDoc.querySelector('main');
mainElement.appendChild(bottomCtaNode);
mainElement.appendChild(otherToolsNode);

// Save file
fs.writeFileSync(emojiFaviconPath, emojiDom.serialize(), 'utf8');
console.log('Successfully rebuilt emoji-to-favicon/index.html');
