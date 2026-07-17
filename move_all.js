const fs = require('fs');
const path = require('path');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // The regex matches the OTHER TOOLS SECTION including its preceding and trailing spaces/newlines
  const sectionRegex = /    <!-- ============================== -->\s*<!--       OTHER TOOLS SECTION      -->\s*<!-- ============================== -->\s*<section class="section" id="other-tools">[\s\S]*?<\/section>\s*/;

  const match = content.match(sectionRegex);

  if (match) {
    const sectionContent = match[0];
    
    // Remove it from its current position
    content = content.replace(sectionRegex, '');
    
    // Find the insertion point: just before BOTTOM CTA
    const insertRegex = /    <!-- ============================== -->\s*<!--         BOTTOM CTA             -->/;
    
    // Check if the file has BOTTOM CTA. If not, maybe just before footer.
    if (insertRegex.test(content)) {
        content = content.replace(insertRegex, sectionContent + '\n$&');
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Moved successfully in ${file}`);
    } else {
        const footerRegex = /  <!-- ============================== -->\s*<!--            FOOTER              -->/;
        if(footerRegex.test(content)) {
            content = content.replace(footerRegex, sectionContent + '\n$&');
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Moved successfully in ${file} (before footer)`);
        } else {
            console.log(`Could not find insertion point in ${file}`);
        }
    }
  } else {
    // If it's not found, maybe it's already moved or not present
  }
}

function findHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                findHtmlFiles(fullPath);
            }
        } else if (file === 'index.html') {
            processFile(fullPath);
        }
    }
}

findHtmlFiles(__dirname);
