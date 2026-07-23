const fs = require('fs');
const path = require('path');

const getHtmlFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory()) {
            if (['node_modules', 'images', 'js', 'css', 'locales', '.git'].includes(file)) continue;
            // Skip localized directories
            if (['ar', 'de', 'es', 'fr', 'hi', 'id', 'pt', 'tr', 'ur'].includes(file)) continue;
            
            results = results.concat(getHtmlFiles(filePath));
        } else {
            if (file.endsWith('.html')) {
                results.push(filePath);
            }
        }
    }
    return results;
};

const files = getHtmlFiles(__dirname);
console.log(`Injecting favicon links into ${files.length} HTML files...`);

files.forEach(file => {
    let html = fs.readFileSync(file, 'utf8');
    
    // Skip if already has favicon tags
    if (html.includes('href="/favicon.ico"') || html.includes('href="/favicon-32x32.png"') || html.includes('Favicon Links -->')) {
        return;
    }
    
    // Find the relative path depth to determine the correct path to root
    const relative = path.relative(__dirname, file);
    const depth = relative.split(path.sep).length - 1;
    
    // Since root is the base, standard href should use absolute paths beginning with /
    // which makes them work on any subpage level without depth tracking!
    // Absolute paths like /favicon.ico and /site.webmanifest are standard for favicons
    const favtags = `\n  <!-- Favicon Links -->\n  <link rel="icon" type="image/x-icon" href="/favicon.ico">\n  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\n  <link rel="manifest" href="/site.webmanifest">`;
    
    // Find the stylesheet link tag to insert after
    const match = html.match(/<link rel="stylesheet"[^>]+>/);
    if (match) {
        html = html.replace(match[0], `${match[0]}${favtags}`);
        fs.writeFileSync(file, html, 'utf8');
        console.log(`Injected favicon tags into: ${relative}`);
    }
});
