const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const languages = ['ar', 'de', 'es', 'fr', 'hi', 'id', 'pt', 'tr', 'ur'];

const languageNames = {
    en: { name: 'English', flagCode: 'us' },
    ar: { name: 'العربية', flagCode: 'sa' },
    de: { name: 'Deutsch', flagCode: 'de' },
    es: { name: 'Español', flagCode: 'es' },
    fr: { name: 'Français', flagCode: 'fr' },
    hi: { name: 'हिन्दी', flagCode: 'in' },
    id: { name: 'Bahasa Indonesia', flagCode: 'id' },
    pt: { name: 'Português', flagCode: 'pt' },
    tr: { name: 'Türkçe', flagCode: 'tr' },
    ur: { name: 'اردو', flagCode: 'pk' }
};

// Load existing translations
let existingTranslations = {};
try {
    const scriptContent = fs.readFileSync(path.join(__dirname, 'translate_all_languages.js'), 'utf8');
    const match = scriptContent.match(/const translations = ({[\s\S]+?});/);
    if (match) {
        existingTranslations = eval(`(${match[1]})`);
    }
} catch (e) {
    console.error("Could not load existing translations", e);
}

const getFilesToLocalize = (dir, baseDir = '') => {
    let results = [];
    const list = fs.readdirSync(dir);
    
    for (const file of list) {
        const filePath = path.join(dir, file);
        const relativePath = path.join(baseDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory()) {
            if (['node_modules', 'images', 'js', 'css', 'locales', '.git', 'sitemap'].includes(file) && baseDir === '') continue;
            if (languages.includes(file) && baseDir === '') continue;
            
            results = results.concat(getFilesToLocalize(filePath, relativePath));
        } else {
            if (file.endsWith('.html')) {
                results.push(relativePath);
            }
        }
    }
    
    return results;
};

// Check if a URL is relative (e.g. stylesheet or script path)
const isRelativeUrl = (url) => {
    if (!url) return false;
    if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//') || url.startsWith('data:') || url.startsWith('javascript:')) {
        return false;
    }
    return true;
};

const isTranslatable = (node) => {
    if (node.parentElement && ['CODE', 'PRE', 'SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT'].includes(node.parentElement.tagName)) return false;
    return true;
};

// Fix the English source files first to make sure they don't have "undefined" URLs on disk
function fixEnglishSourceFiles(files) {
    console.log("--- Fixing 'undefined' metadata in English source files ---");
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        let html = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Simple string replacements for metadata
        const fileUrlPath = file.replace(/\\/g, '/').replace('index.html', '');
        const correctUrl = `https://pngtofavicon.com/${fileUrlPath}`;
        
        if (html.includes('href="undefined"')) {
            html = html.replace(/href="undefined"/g, `href="${correctUrl}"`);
            modified = true;
        }
        if (html.includes('content="undefined"')) {
            html = html.replace(/content="undefined"/g, `content="${correctUrl}"`);
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(filePath, html, 'utf8');
            console.log(`Fixed metadata in: ${file}`);
        }
    });
}

function generateHreflangTags(relativePath, doc) {
    const fileUrlPath = relativePath.replace(/\\/g, '/').replace('index.html', '');
    
    // Remove existing hreflang tags to avoid duplicates
    const existing = doc.querySelectorAll('link[rel="alternate"][hreflang]');
    existing.forEach(el => el.remove());
    
    // x-default and English
    const xDefault = doc.createElement('link');
    xDefault.setAttribute('rel', 'alternate');
    xDefault.setAttribute('hreflang', 'x-default');
    xDefault.setAttribute('href', `https://pngtofavicon.com/${fileUrlPath}`);
    doc.head.appendChild(xDefault);
    
    const enTag = doc.createElement('link');
    enTag.setAttribute('rel', 'alternate');
    enTag.setAttribute('hreflang', 'en');
    enTag.setAttribute('href', `https://pngtofavicon.com/${fileUrlPath}`);
    doc.head.appendChild(enTag);
    
    // Localized hreflangs
    languages.forEach(lang => {
        const tag = doc.createElement('link');
        tag.setAttribute('rel', 'alternate');
        tag.setAttribute('hreflang', lang);
        tag.setAttribute('href', `https://pngtofavicon.com/${lang}/${fileUrlPath}`);
        doc.head.appendChild(tag);
    });
}

function injectLanguageDropdown(relativePath, doc, targetLang) {
    const navLinks = doc.getElementById('navLinks');
    if (!navLinks) return;
    
    // Remove existing language dropdown wrapper if any
    const existing = navLinks.querySelector('.lang-dropdown-wrapper');
    if (existing) existing.remove();
    
    const wrapper = doc.createElement('li');
    wrapper.className = 'lang-dropdown-wrapper';
    
    const currentInfo = languageNames[targetLang] || { name: 'English', flagCode: 'us' };
    
    let menuItemsHtml = '';
    const fileUrlPath = relativePath.replace(/\\/g, '/').replace('index.html', '');
    
    const allLangs = ['en', ...languages];
    allLangs.forEach(lang => {
        let href = '';
        if (lang === 'en') {
            href = '/' + fileUrlPath;
        } else {
            href = '/' + lang + '/' + fileUrlPath;
        }
        
        const langInfo = languageNames[lang];
        const isActive = lang === targetLang ? 'active' : '';
        menuItemsHtml += `
            <a href="${href}" class="lang-dropdown-item ${isActive}">
                <img src="https://flagcdn.com/w40/${langInfo.flagCode}.png" srcset="https://flagcdn.com/w80/${langInfo.flagCode}.png 2x" width="20" height="20" alt="${langInfo.name} flag" class="flag-icon">
                <span>${langInfo.name}</span>
            </a>
        `;
    });
    
    wrapper.innerHTML = `
        <div class="lang-dropdown">
            <a href="#" class="lang-dropdown-trigger" role="button" aria-haspopup="true" aria-expanded="false" aria-label="Select Language">
                <div class="lang-dropdown-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                    </svg>
                </div>
                <div class="lang-dropdown-label">
                    <span>Language</span>
                    <span>${currentInfo.name}</span>
                </div>
                <svg class="lang-dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </a>
            <div class="lang-dropdown-menu">
                ${menuItemsHtml}
            </div>
        </div>
    `;
    
    navLinks.appendChild(wrapper);
}

async function localizePage(relativePath, targetLang) {
    const srcPath = path.join(__dirname, relativePath);
    const destPath = path.join(__dirname, targetLang, relativePath);
    
    // Ensure dest directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    const html = fs.readFileSync(srcPath, 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // 1. Update lang attribute
    doc.documentElement.setAttribute('lang', targetLang);
    
    // 2. Update canonical and OG URLs
    const updateUrl = (url) => {
        if (!url) return url;
        if (url.includes('pngtofavicon.com')) {
            const urlObj = new URL(url);
            if (!languages.some(l => urlObj.pathname.startsWith(`/${l}/`))) {
                urlObj.pathname = `/${targetLang}${urlObj.pathname}`;
            }
            return urlObj.toString();
        }
        return url;
    };
    
    const canonical = doc.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', updateUrl(canonical.getAttribute('href')));
    
    const ogUrl = doc.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', updateUrl(ogUrl.getAttribute('content')));
    
    const twitterUrl = doc.querySelector('meta[property="twitter:url"]');
    if (twitterUrl) twitterUrl.setAttribute('content', updateUrl(twitterUrl.getAttribute('content')));
    
    // 3. Shift relative asset paths (prepend ../ to find root assets)
    // Stylesheets
    doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (isRelativeUrl(href)) {
            link.setAttribute('href', '../' + href);
        }
    });
    
    // Scripts
    doc.querySelectorAll('script[src]').forEach(script => {
        const src = script.getAttribute('src');
        if (isRelativeUrl(src)) {
            script.setAttribute('src', '../' + src);
        }
    });
    
    // Images
    doc.querySelectorAll('img[src]').forEach(img => {
        const src = img.getAttribute('src');
        if (isRelativeUrl(src)) {
            img.setAttribute('src', '../' + src);
        }
    });
    
    // Source tags (e.g. responsive images)
    doc.querySelectorAll('source[srcset]').forEach(source => {
        const srcset = source.getAttribute('srcset');
        if (isRelativeUrl(srcset)) {
            source.setAttribute('srcset', '../' + srcset);
        }
    });

    // 4. Update absolute internal hrefs
    doc.querySelectorAll('a[href]').forEach(link => {
        let href = link.getAttribute('href');
        if (href.startsWith('/') && !href.startsWith('//')) {
            const firstSeg = href.split('/')[1];
            if (!languages.includes(firstSeg)) {
                link.setAttribute('href', `/${targetLang}${href}`);
            }
        }
    });

    // 5. Update language switcher paths in the footer
    const langSelector = doc.getElementById('languageBar');
    if (langSelector) {
        const langLinks = langSelector.querySelectorAll('a.lang-badge');
        let currentAbsPath = relativePath.replace(/\\/g, '/').replace('index.html', '');
        langLinks.forEach(ll => {
            const l = ll.getAttribute('lang');
            if (l === 'en') {
                ll.setAttribute('href', `/${currentAbsPath}`);
            } else {
                ll.setAttribute('href', `/${l}/${currentAbsPath}`);
            }
            if (l === targetLang) {
                ll.classList.add('active');
            } else {
                ll.classList.remove('active');
            }
        });
    }

    // 6. Generate alternate hreflang tags
    generateHreflangTags(relativePath, doc);

    // 7. Inject Language Dropdown in Header Navbar
    injectLanguageDropdown(relativePath, doc, targetLang);

    // 8. Translate UI Elements using static translations dictionary
    const dict = existingTranslations[targetLang] || {};

    // Translate Head elements (title and meta tags)
    if (doc.title && dict[doc.title.trim()]) {
        doc.title = dict[doc.title.trim()];
    }
    doc.querySelectorAll('meta[name="description"], meta[name="keywords"], meta[property="og:title"], meta[property="og:description"], meta[property="twitter:title"], meta[property="twitter:description"]').forEach(meta => {
        const content = meta.getAttribute('content');
        if (content && dict[content.trim()]) {
            meta.setAttribute('content', dict[content.trim()]);
        }
    });

    // Translate specific attributes (aria-label, placeholder, alt, title)
    doc.querySelectorAll('[aria-label], [placeholder], [alt], [title]').forEach(el => {
        ['aria-label', 'placeholder', 'alt', 'title'].forEach(attr => {
            const val = el.getAttribute(attr);
            if (val && dict[val.trim()]) {
                el.setAttribute(attr, dict[val.trim()]);
            }
        });
    });

    // Translate JSON-LD scripts (structured schema data)
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
            const data = JSON.parse(script.textContent);
            
            const translateObject = (obj) => {
                if (typeof obj === 'string') {
                    const trimmed = obj.trim();
                    if (dict[trimmed]) {
                        return dict[trimmed];
                    }
                    return obj;
                } else if (Array.isArray(obj)) {
                    return obj.map(translateObject);
                } else if (typeof obj === 'object' && obj !== null) {
                    const newObj = {};
                    for (const key in obj) {
                        newObj[key] = translateObject(obj[key]);
                    }
                    return newObj;
                }
                return obj;
            };
            
            const translatedData = translateObject(data);
            script.textContent = JSON.stringify(translatedData, null, 2);
        } catch (e) {
            console.error("Error translating JSON-LD script", e);
        }
    });

    const treeWalker = doc.createTreeWalker(doc.body, dom.window.NodeFilter.SHOW_TEXT);
    let currentNode;
    while (currentNode = treeWalker.nextNode()) {
        if (isTranslatable(currentNode)) {
            const originalText = currentNode.nodeValue;
            const trimmedText = originalText.trim();
            if (dict[trimmedText]) {
                const leadingSpace = originalText.match(/^\s*/)[0];
                const trailingSpace = originalText.match(/\s*$/)[0];
                currentNode.nodeValue = leadingSpace + dict[trimmedText] + trailingSpace;
            }
        }
    }
    
    // Save file
    fs.writeFileSync(destPath, dom.serialize(), 'utf8');
}

async function run() {
    const files = getFilesToLocalize(__dirname);
    console.log(`Found ${files.length} HTML files to localize.`);
    
    // First, fix the English source files metadata
    fixEnglishSourceFiles(files);
    
    // Then generate the hreflang alternate tags and inject language switcher into English pages
    console.log("--- Generating hreflangs and dropdowns for English source files ---");
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        const html = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        generateHreflangTags(file, doc);
        injectLanguageDropdown(file, doc, 'en');
        fs.writeFileSync(filePath, dom.serialize(), 'utf8');
    });

    // Now generate the localized versions for all target languages
    for (const lang of languages) {
        console.log(`\n--- Starting localization for ${lang} ---`);
        for (const file of files) {
            console.log(`Localizing ${file} to ${lang}...`);
            await localizePage(file, lang);
        }
    }
    console.log("\n*** Multilingual Build Complete! ***");
}

run().catch(console.error);
