const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// The regex matches the broken TESTIMONIALS SECTION
const sectionRegex = /    <!-- ============================== -->\s*<!--       TESTIMONIALS SECTION     -->\s*<!-- ============================== -->\s*<section class="section" id="testimonials">[\s\S]*?<\/section>\s*/;

content = content.replace(sectionRegex, '');
fs.writeFileSync('index.html', content);
console.log('Bad Testimonials HTML removed.');
