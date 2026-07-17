const fs = require('fs');
const path = require('path');

const mainFile = path.join(__dirname, 'index.html');
const mainHtml = fs.readFileSync(mainFile, 'utf8');

// Use RegEx to reliably extract the sections
const useCasesRegex = /(?:[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--     USE CASES SECTION          -->\r?\n[ \t]*<!-- ============================== -->)[\s\S]*?(?=[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--     WHAT'S INCLUDED SECTION    -->)/;
const useCasesHtml = mainHtml.match(useCasesRegex)?.[0];

const testimonialsRegex = /(?:[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--       TESTIMONIALS SECTION     -->\r?\n[ \t]*<!-- ============================== -->)[\s\S]*?(?=[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--          FAQ SECTION           -->)/;
const testimonialsHtml = mainHtml.match(testimonialsRegex)?.[0];

const bottomCtaRegex = /(?:[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--         BOTTOM CTA             -->\r?\n[ \t]*<!-- ============================== -->)[\s\S]*?(?=[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--       OTHER TOOLS SECTION      -->)/;
let bottomCtaHtml = mainHtml.match(bottomCtaRegex)?.[0];
if (!bottomCtaHtml) {
    const bottomCtaRegex2 = /(?:[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--         BOTTOM CTA             -->\r?\n[ \t]*<!-- ============================== -->)[\s\S]*?(?=[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--            FOOTER              -->)/;
    bottomCtaHtml = mainHtml.match(bottomCtaRegex2)?.[0];
}

const footerRegex = /(?:[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--            FOOTER              -->\r?\n[ \t]*<!-- ============================== -->)[\s\S]*?(?=<\/body>)/;
let footerHtml = mainHtml.match(footerRegex)?.[0];
if (footerHtml) {
    // Trim before JS Scripts if present
    const jsScriptsIndex = footerHtml.indexOf('\n  <!-- FAQPage Structured Data -->');
    if (jsScriptsIndex !== -1) {
        footerHtml = footerHtml.substring(0, jsScriptsIndex);
    }
}


console.log({
    hasUseCases: !!useCasesHtml,
    hasTestimonials: !!testimonialsHtml,
    hasBottomCta: !!bottomCtaHtml,
    hasFooter: !!footerHtml
});

if (!useCasesHtml || !testimonialsHtml || !bottomCtaHtml || !footerHtml) {
    console.log("Failed to extract one or more sections. Exiting.");
    process.exit(1);
}

const dirs = ['ar', 'de', 'es', 'fr', 'hi', 'id', 'pt', 'tr', 'ur'];

dirs.forEach(dir => {
    const filePath = path.join(__dirname, dir, 'index.html');
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Use Cases
    if (!content.includes('id="use-cases"')) {
        const whatsIncludedStartRegex = /[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--     WHAT'S INCLUDED SECTION    -->/;
        content = content.replace(whatsIncludedStartRegex, useCasesHtml + '\n$&');
        modified = true;
    }

    // 2. Testimonials
    if (!content.includes('id="testimonials"')) {
        const faqStartRegex = /[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--          FAQ SECTION           -->/;
        content = content.replace(faqStartRegex, testimonialsHtml + '\n$&');
        modified = true;
    }

    // 3. Bottom CTA
    if (!content.includes('bottom-cta')) {
        const otherToolsStartRegex = /[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--       OTHER TOOLS SECTION      -->/;
        if (otherToolsStartRegex.test(content)) {
            content = content.replace(otherToolsStartRegex, bottomCtaHtml + '\n$&');
        } else {
            const footerStartRegex = /[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--            FOOTER              -->/;
            content = content.replace(footerStartRegex, bottomCtaHtml + '\n$&');
        }
        modified = true;
    }

    // 4. Footer Replace
    const oldFooterRegex = /(?:[ \t]*<!-- ============================== -->\r?\n[ \t]*<!--            FOOTER              -->\r?\n[ \t]*<!-- ============================== -->)[\s\S]*?(?=<\/body>|<!-- FAQPage Structured Data -->)/;
    if (oldFooterRegex.test(content)) {
        content = content.replace(oldFooterRegex, footerHtml + '\n  ');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${dir}/index.html`);
    } else {
        console.log(`No changes needed for ${dir}/index.html`);
    }
});
