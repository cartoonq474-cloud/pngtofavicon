const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

const oldCapterraLogo = '<svg viewBox="0 0 24 24" fill="#00c389"><path d="M12 0L1.6 6v12L12 24l10.4-6V6L12 0zm0 21.6l-8.3-4.8V7.2L12 2.4l8.3 4.8v9.6l-8.3 4.8z"/></svg>';

const newCapterraLogo = '<svg viewBox="5 15 85 85"><polygon points="10,50 55,30 55,50" fill="#F39B2A" /><polygon points="10,50 55,50 35,65" fill="#E34E4C" /><polygon points="35,65 55,50 55,95" fill="#015383" /><polygon points="55,30 85,20 55,95" fill="#65C3E8" /></svg>';

content = content.split(oldCapterraLogo).join(newCapterraLogo);

fs.writeFileSync('index.html', content);
console.log('Capterra logo updated.');
