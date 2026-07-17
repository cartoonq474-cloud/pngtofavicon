const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const indexPath = path.join(__dirname, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const mainDoc = new JSDOM(indexHtml).window.document;

// Extract sections and footer from main index.html
const bottomCtaNode = mainDoc.querySelector('.bottom-cta')?.cloneNode(true);
const otherToolsNode = mainDoc.getElementById('other-tools')?.cloneNode(true);
const homepageFooter = mainDoc.querySelector('footer')?.cloneNode(true);

if (!bottomCtaNode || !otherToolsNode || !homepageFooter) {
    console.error("Missing some global sections in index.html");
    process.exit(1);
}

bottomCtaNode.classList.add('section');
bottomCtaNode.classList.remove('section-alt');
otherToolsNode.classList.add('section', 'section-alt');

const footerSvg = homepageFooter.querySelector('.footer-brand svg');
if (footerSvg) {
    const defs = footerSvg.querySelector('defs linearGradient');
    if (defs) {
        defs.id = "grad2"; 
    }
    const rect = footerSvg.querySelector('rect[fill^="url"]');
    if (rect) {
        rect.setAttribute('fill', 'url(#grad2)');
    }
}

const tutorialPath = path.join(__dirname, 'tutorials', 'favicon-best-practices', 'index.html');

console.log(`Fixing ${tutorialPath}...`);

if (fs.existsSync(tutorialPath)) {
    const tutorialHtml = fs.readFileSync(tutorialPath, 'utf8');
    const tutDom = new JSDOM(tutorialHtml);
    const tutDoc = tutDom.window.document;

    // 1. Fix JS & CSS Paths (from ../ to ../../)
    const scriptTags = tutDoc.querySelectorAll('script');
    scriptTags.forEach(script => {
        const src = script.getAttribute('src');
        if (src && src.startsWith('../js/')) {
            script.setAttribute('src', src.replace('../js/', '../../js/'));
        }
    });

    const linkTags = tutDoc.querySelectorAll('link[rel="stylesheet"]');
    linkTags.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('../styles.css')) {
            link.setAttribute('href', href.replace('../styles.css', '../../styles.css'));
        }
    });

    // 2. Inject Missing Sections
    const mainElement = tutDoc.querySelector('main');
    if (!tutDoc.querySelector('.bottom-cta')) {
        mainElement.appendChild(bottomCtaNode.cloneNode(true));
    }
    if (!tutDoc.getElementById('other-tools')) {
        mainElement.appendChild(otherToolsNode.cloneNode(true));
    }

    // 3. Replace Footer
    const oldFooter = tutDoc.querySelector('footer');
    if (oldFooter) {
        oldFooter.replaceWith(homepageFooter.cloneNode(true));
    }

    // Save file
    fs.writeFileSync(tutorialPath, tutDom.serialize(), 'utf8');
    console.log(`Successfully rebuilt ${tutorialPath}`);
} else {
    console.error(`File not found: ${tutorialPath}`);
}
