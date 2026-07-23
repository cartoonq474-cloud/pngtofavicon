const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const inputImgPath = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b351871f-7de5-4312-960a-75e1436f365b\\.user_uploaded\\media__1784778475344.png';
const outputDir = __dirname;

async function run() {
    if (!fs.existsSync(inputImgPath)) {
        console.error('Source image not found at: ' + inputImgPath);
        process.exit(1);
    }
    
    const srcBase64 = fs.readFileSync(inputImgPath, { encoding: 'base64' });
    const srcDataUrl = `data:image/png;base64,${srcBase64}`;
    
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    const sizes = [16, 32, 48, 180, 192, 512];
    const results = {};
    
    console.log('Resizing images...');
    for (const size of sizes) {
        const pngBase64 = await page.evaluate((dataUrl, s) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = s;
                    canvas.height = s;
                    const ctx = canvas.getContext('2d');
                    
                    // Enable high-quality image smoothing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    ctx.drawImage(img, 0, 0, s, s);
                    
                    const data = canvas.toDataURL('image/png');
                    resolve(data.split(',')[1]);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = dataUrl;
            });
        }, srcDataUrl, size);
        
        results[size] = Buffer.from(pngBase64, 'base64');
    }
    
    await browser.close();
    
    // Save PNG files
    fs.writeFileSync(path.join(outputDir, 'favicon-16x16.png'), results[16]);
    fs.writeFileSync(path.join(outputDir, 'favicon-32x32.png'), results[32]);
    fs.writeFileSync(path.join(outputDir, 'apple-touch-icon.png'), results[180]);
    fs.writeFileSync(path.join(outputDir, 'android-chrome-192x192.png'), results[192]);
    fs.writeFileSync(path.join(outputDir, 'android-chrome-512x512.png'), results[512]);
    console.log('Saved PNG icons.');
    
    // Build ICO container from 16x16, 32x32, 48x48
    console.log('Generating favicon.ico...');
    const icoBuffer = buildIco([results[16], results[32], results[48]], [16, 32, 48]);
    fs.writeFileSync(path.join(outputDir, 'favicon.ico'), icoBuffer);
    console.log('Successfully generated favicon.ico!');
}

function buildIco(pngBuffers, sizes) {
    const headerSize = 6;
    const directorySize = 16 * pngBuffers.length;
    let dataOffset = headerSize + directorySize;
    
    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0, 0); // Reserved
    header.writeUInt16LE(1, 2); // Type (1 for ICO)
    header.writeUInt16LE(pngBuffers.length, 4); // Image Count
    
    const directories = [];
    const dataBlocks = [];
    
    for (let i = 0; i < pngBuffers.length; i++) {
        const size = sizes[i];
        const pngBuffer = pngBuffers[i];
        const imageSize = pngBuffer.length;
        
        const dir = Buffer.alloc(16);
        dir.writeUInt8(size >= 256 ? 0 : size, 0); // Width
        dir.writeUInt8(size >= 256 ? 0 : size, 1); // Height
        dir.writeUInt8(0, 2); // Color palette count (0 if no palette)
        dir.writeUInt8(0, 3); // Reserved
        dir.writeUInt16LE(1, 4); // Color planes
        dir.writeUInt16LE(32, 6); // Bits per pixel
        dir.writeUInt32LE(imageSize, 8); // Size of image data
        dir.writeUInt32LE(dataOffset, 12); // Offset to image data
        
        directories.push(dir);
        dataBlocks.push(pngBuffer);
        
        dataOffset += imageSize;
    }
    
    return Buffer.concat([header, ...directories, ...dataBlocks]);
}

run().catch(console.error);
