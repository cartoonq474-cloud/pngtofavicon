const fs = require('fs');
const path = require('path');

const domain = 'https://pngtofavicon.com';
const languages = ['ar', 'de', 'es', 'fr', 'hi', 'id', 'pt', 'tr', 'ur'];

const getFiles = (dir, baseDir = '') => {
    let results = [];
    const list = fs.readdirSync(dir);
    
    for (const file of list) {
        const filePath = path.join(dir, file);
        const relativePath = path.join(baseDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory()) {
            if (['node_modules', 'images', 'js', 'css', 'locales', '.git', 'sitemap'].includes(file) && baseDir === '') continue;
            if (languages.includes(file) && baseDir === '') continue;
            
            results = results.concat(getFiles(filePath, relativePath));
        } else {
            if (file.endsWith('.html') && file !== 'preview_capterra.html') {
                results.push(relativePath);
            }
        }
    }
    
    return results;
};

function getUrlPath(file) {
    let urlPath = file.replace(/\\/g, '/');
    if (urlPath === 'index.html') {
        return '';
    }
    if (urlPath.endsWith('index.html')) {
        return urlPath.slice(0, -10); // Remove 'index.html'
    }
    return urlPath;
}

function getPriority(urlPath) {
    if (urlPath === '') return '1.0';
    if (['text-to-favicon/', 'emoji-to-favicon/', 'favicon-checker/'].includes(urlPath)) return '0.9';
    if (urlPath.startsWith('tutorials/') && urlPath !== 'tutorials/') return '0.8';
    if (urlPath.startsWith('blog/') && urlPath !== 'blog/') return '0.8';
    if (['about/', 'contact/', 'privacy/', 'terms/', 'cookie-policy/'].includes(urlPath)) return '0.5';
    return '0.7';
}

function getChangeFreq(urlPath) {
    if (urlPath === '') return 'daily';
    if (urlPath.startsWith('blog/')) return 'weekly';
    if (['about/', 'contact/', 'privacy/', 'terms/', 'cookie-policy/'].includes(urlPath)) return 'monthly';
    return 'weekly';
}

function run() {
    const files = getFiles(__dirname);
    console.log(`Found ${files.length} pages to map.`);
    
    const today = new Date().toISOString().split('T')[0];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n';
    
    // We want to generate URL entries for English, plus each localized language
    const allLangs = ['en', ...languages];
    
    files.forEach(file => {
        const urlPath = getUrlPath(file);
        const priority = getPriority(urlPath);
        const changeFreq = getChangeFreq(urlPath);
        
        allLangs.forEach(lang => {
            let loc = '';
            if (lang === 'en') {
                loc = `${domain}/${urlPath}`;
            } else {
                loc = `${domain}/${lang}/${urlPath}`;
            }
            
            xml += '  <url>\n';
            xml += `    <loc>${loc}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += `    <changefreq>${changeFreq}</changefreq>\n`;
            xml += `    <priority>${priority}</priority>\n`;
            
            // Generate cross-reference links
            // x-default is English
            xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${domain}/${urlPath}" />\n`;
            xml += `    <xhtml:link rel="alternate" hreflang="en" href="${domain}/${urlPath}" />\n`;
            
            languages.forEach(l => {
                xml += `    <xhtml:link rel="alternate" hreflang="${l}" href="${domain}/${l}/${urlPath}" />\n`;
            });
            
            xml += '  </url>\n\n';
        });
    });
    
    xml += '</urlset>\n';
    
    fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), xml, 'utf8');
    console.log('Successfully generated sitemap.xml!');
}

run();
