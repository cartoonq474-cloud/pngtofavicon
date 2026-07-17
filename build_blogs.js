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

const blogsToFix = [
    path.join(__dirname, 'blog', 'favicon-seo-guide', 'index.html'),
    path.join(__dirname, 'blog', 'png-vs-ico-vs-svg-favicons', 'index.html')
];

blogsToFix.forEach(blogPath => {
    console.log(`Fixing ${blogPath}...`);
    
    if (!fs.existsSync(blogPath)) {
        console.warn(`File not found: ${blogPath}`);
        return;
    }

    const blogHtml = fs.readFileSync(blogPath, 'utf8');
    const blogDom = new JSDOM(blogHtml);
    const blogDoc = blogDom.window.document;

    // 1. Fix JS & CSS Paths (from ../ to ../../)
    const scriptTags = blogDoc.querySelectorAll('script');
    scriptTags.forEach(script => {
        const src = script.getAttribute('src');
        if (src && src.startsWith('../js/')) {
            script.setAttribute('src', src.replace('../js/', '../../js/'));
        }
    });

    const linkTags = blogDoc.querySelectorAll('link[rel="stylesheet"]');
    linkTags.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('../styles.css')) {
            link.setAttribute('href', href.replace('../styles.css', '../../styles.css'));
        }
    });

    // 2. Fix Canonical Link if it's the SEO guide
    if (blogPath.includes('favicon-seo-guide')) {
        const canonical = blogDoc.querySelector('link[rel="canonical"]');
        if (canonical && canonical.getAttribute('href').includes('2026')) {
            canonical.setAttribute('href', canonical.getAttribute('href').replace('-2026/', '/'));
        }
        
        // Fix OG URLs too
        const ogUrl = blogDoc.querySelector('meta[property="og:url"]');
        if (ogUrl && ogUrl.getAttribute('content').includes('2026')) {
            ogUrl.setAttribute('content', ogUrl.getAttribute('content').replace('-2026/', '/'));
        }
        
        const twUrl = blogDoc.querySelector('meta[property="twitter:url"]');
        if (twUrl && twUrl.getAttribute('content').includes('2026')) {
            twUrl.setAttribute('content', twUrl.getAttribute('content').replace('-2026/', '/'));
        }

        // Also fix the breadcrumb JSON-LD
        const scripts = blogDoc.querySelectorAll('script[type="application/ld+json"]');
        scripts.forEach(s => {
            if (s.textContent.includes('2026')) {
                s.textContent = s.textContent.replace(/-2026\//g, '/');
            }
        });
    }

    // 3. Inject Missing Sections
    const mainElement = blogDoc.querySelector('main');
    if (!blogDoc.querySelector('.bottom-cta')) {
        mainElement.appendChild(bottomCtaNode.cloneNode(true));
    }
    if (!blogDoc.getElementById('other-tools')) {
        mainElement.appendChild(otherToolsNode.cloneNode(true));
    }

    // 4. Replace Footer
    const oldFooter = blogDoc.querySelector('footer');
    if (oldFooter) {
        oldFooter.replaceWith(homepageFooter.cloneNode(true));
    }

    // Save file
    fs.writeFileSync(blogPath, blogDom.serialize(), 'utf8');
    console.log(`Successfully rebuilt ${blogPath}`);
});
