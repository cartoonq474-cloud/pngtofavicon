const fs = require('fs');
const path = require('path');

const mainHtml = fs.readFileSync('index.html', 'utf8');

// Extract the exact "What's Included" section from index.html
const startRegex = /[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--     WHAT'S INCLUDED SECTION    -->\r?\n[ \t]*<!-- ============================== -->/;
const endRegex = /[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--       TESTIMONIALS SECTION     -->/;

let match1 = mainHtml.match(startRegex);
let match2 = mainHtml.match(endRegex);

if (!match1 || !match2) {
    console.error("Could not find start/end markers in index.html");
    process.exit(1);
}

let sectionHtml = mainHtml.substring(match1.index, match2.index);

const dirs = ['ar', 'de', 'es', 'fr', 'hi', 'id', 'pt', 'tr', 'ur'];

dirs.forEach(dir => {
    let filePath = path.join(__dirname, dir, 'index.html');
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        let oldStartMatch = content.match(startRegex);
        // In localized files, the next section might be TESTIMONIALS (because we synced it)
        // or USE CASES (wait, Use cases is BEFORE Whats included)
        let oldEndMatch = content.match(endRegex);
        
        if (oldStartMatch && oldEndMatch) {
            let before = content.substring(0, oldStartMatch.index);
            let after = content.substring(oldEndMatch.index);
            fs.writeFileSync(filePath, before + sectionHtml + after, 'utf8');
            console.log(`Synced structure to ${dir}/index.html`);
        } else {
            console.log(`Could not find old section in ${dir}/index.html`);
        }
    }
});
