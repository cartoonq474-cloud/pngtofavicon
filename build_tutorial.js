const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const indexPath = path.join(__dirname, 'index.html');
const tutorialPath = path.join(__dirname, 'tutorials', 'how-to-add-favicon', 'index.html');

// Read files
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const tutorialHtml = fs.readFileSync(tutorialPath, 'utf8');

const mainDoc = new JSDOM(indexHtml).window.document;
const tutDom = new JSDOM(tutorialHtml);
const tutDoc = tutDom.window.document;

// 1. Fix JS Script Path
const scriptTags = tutDoc.querySelectorAll('script');
scriptTags.forEach(script => {
    if (script.getAttribute('src') === '../js/main.js?v=3.3') {
        script.setAttribute('src', '../../js/main.js?v=3.3');
    }
});

// 2. Extract sections and footer from main index.html
const bottomCtaNode = mainDoc.querySelector('.bottom-cta')?.cloneNode(true);
const otherToolsNode = mainDoc.getElementById('other-tools')?.cloneNode(true);
const homepageFooter = mainDoc.querySelector('footer')?.cloneNode(true);

if (!bottomCtaNode || !otherToolsNode || !homepageFooter) {
    console.error("Missing some global sections in index.html");
    process.exit(1);
}

// Ensure the bottom CTA has section class, and other tools has section-alt
bottomCtaNode.classList.add('section');
bottomCtaNode.classList.remove('section-alt');
otherToolsNode.classList.add('section', 'section-alt');

// 3. Inject Missing Sections
const mainElement = tutDoc.querySelector('main');
mainElement.appendChild(bottomCtaNode);
mainElement.appendChild(otherToolsNode);

// 4. Replace Footer
const oldFooter = tutDoc.querySelector('footer');
if (oldFooter) {
    // We need to update the logo link inside the footer to match the depth if it's relative, 
    // but the homepage footer uses href="/" for home, which is fine!
    oldFooter.replaceWith(homepageFooter);
}

// 5. Fix logo SVG in header just in case (tut doc header)
const headerSvg = tutDoc.querySelector('header svg');
if (headerSvg) {
    const rect = headerSvg.querySelector('rect[fill="url(#grad)"]');
    if (rect) {
        // It's correct in header
    }
}

// Ensure footer logo is correct in the injected footer (homepage footer is already correct!)
// Just verify it uses #grad or #grad2 correctly.
const footerSvg = homepageFooter.querySelector('.footer-brand svg');
if (footerSvg) {
    const defs = footerSvg.querySelector('defs linearGradient');
    if (defs) {
        defs.id = "grad2"; // Make sure it doesn't clash with header #grad
    }
    const rect = footerSvg.querySelector('rect[fill^="url"]');
    if (rect) {
        rect.setAttribute('fill', 'url(#grad2)');
    }
}

// Save file
fs.writeFileSync(tutorialPath, tutDom.serialize(), 'utf8');
console.log('Successfully rebuilt tutorials/how-to-add-favicon/index.html');
