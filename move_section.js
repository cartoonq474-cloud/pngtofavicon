const fs = require('fs');

const file = 'index.html';
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
  
  content = content.replace(insertRegex, sectionContent + '\n$&');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log("Section moved successfully!");
} else {
  console.log("Could not find the section.");
}
