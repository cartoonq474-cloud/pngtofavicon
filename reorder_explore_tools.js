const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const languages = ['ar', 'de', 'es', 'fr', 'hi', 'id', 'pt', 'tr', 'ur'];

languages.forEach(lang => {
  const filePath = path.join(__dirname, lang, 'index.html');
  if (fs.existsSync(filePath)) {
    let html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const exploreSection = document.getElementById('other-tools');
    const footer = document.querySelector('footer');
    
    if (exploreSection && footer) {
      // Remove it from its current position
      exploreSection.remove();
      
      // Insert it exactly before the footer
      footer.parentNode.insertBefore(exploreSection, footer);
      
      fs.writeFileSync(filePath, dom.serialize(), 'utf8');
      console.log(`Repositioned Explore Tools section just above the footer in ${lang}/index.html`);
    } else {
      console.log(`Could not find both Explore Tools and Footer in ${lang}/index.html`);
    }
  }
});
