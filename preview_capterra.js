const fs = require('fs');

const svg = `
<svg width="200" height="200" viewBox="0 0 100 100" style="background:white;">
  <!-- Orange -->
  <polygon points="10,50 55,30 55,50" fill="#F39B2A" />
  <!-- Red -->
  <polygon points="10,50 55,50 35,65" fill="#E34E4C" />
  <!-- Dark Blue -->
  <polygon points="35,65 55,50 55,95" fill="#015383" />
  <!-- Light Blue -->
  <polygon points="55,30 85,20 55,95" fill="#65C3E8" />
</svg>
`;

const html = `<html><body>${svg}</body></html>`;
fs.writeFileSync('preview_capterra.html', html);
console.log("Preview generated.");
