/**
 * text-generator.js — Text to Favicon Engine
 * 100% Client-Side canvas text rendering and package creation.
 */
(function () {
  'use strict';

  // Constants
  const FAVICON_SIZES = [
    { name: 'favicon-16x16.png', size: 16, label: '16×16', desc: 'Browser tabs' },
    { name: 'favicon-32x32.png', size: 32, label: '32×32', desc: 'HiDPI tabs' },
    { name: 'favicon-48x48.png', size: 48, label: '48×48', desc: 'Windows desktop' },
    { name: 'apple-touch-icon.png', size: 180, label: '180×180', desc: 'Apple Touch Icon' },
    { name: 'android-chrome-192x192.png', size: 192, label: '192×192', desc: 'Android home screen' },
    { name: 'android-chrome-512x512.png', size: 512, label: '512×512', desc: 'PWA install icon' },
  ];

  const ICO_SIZES = [16, 32, 48];

  // DOM Elements
  var DOM = {
    textVal: document.getElementById('textVal'),
    fontFamily: document.getElementById('fontFamily'),
    textColor: document.getElementById('textColor'),
    bgColor: document.getElementById('bgColor'),
    transparentBg: document.getElementById('transparentBg'),
    bgShape: document.getElementById('bgShape'),
    fontSize: document.getElementById('fontSize'),
    fontSizeVal: document.getElementById('fontSizeVal'),
    fontWeight: document.getElementById('fontWeight'),
    fontItalic: document.getElementById('fontItalic'),
    includeManifest: document.getElementById('includeManifest'),
    previewGrid: document.getElementById('previewGrid'),
    downloadAllBtn: document.getElementById('downloadAllBtn'),
    progressBar: document.getElementById('progressBar'),
    htmlCode: document.getElementById('htmlCode'),
  };

  // State
  var state = {
    text: 'PF',
    font: 'Space Grotesk',
    textColor: '#8b5cf6',
    bgColor: '#ffffff',
    isTransparent: false,
    shape: 'rounded',
    fontSizePercent: 65,
    weight: '700',
    isItalic: false,
    includeManifest: true,
  };

  // Initialize
  init();

  function init() {
    if (!DOM.textVal) return; // Guard for other pages

    setupEventListeners();
    readStateFromUI();
    generateAll();
  }

  function setupEventListeners() {
    var inputs = [
      DOM.textVal, DOM.fontFamily, DOM.textColor, DOM.bgColor,
      DOM.transparentBg, DOM.bgShape, DOM.fontSize, DOM.fontWeight,
      DOM.fontItalic, DOM.includeManifest
    ];

    inputs.forEach(function (input) {
      if (!input) return;
      var eventType = (input.type === 'text' || input.type === 'range') ? 'input' : 'change';
      input.addEventListener(eventType, function () {
        readStateFromUI();
        generateAll();
      });
    });

    if (DOM.downloadAllBtn) {
      DOM.downloadAllBtn.addEventListener('click', function () {
        triggerZipDownload();
      });
    }
  }

  function readStateFromUI() {
    state.text = DOM.textVal.value.trim() || 'P';
    state.font = DOM.fontFamily.value;
    state.textColor = DOM.textColor.value;
    state.bgColor = DOM.bgColor.value;
    state.isTransparent = DOM.transparentBg.checked;
    state.shape = DOM.bgShape.value;
    state.fontSizePercent = parseInt(DOM.fontSize.value, 10);
    state.weight = DOM.fontWeight.value;
    state.isItalic = DOM.fontItalic.checked;
    state.includeManifest = DOM.includeManifest.checked;

    // Update range UI value display
    if (DOM.fontSizeVal) {
      DOM.fontSizeVal.textContent = state.fontSizePercent + '%';
    }

    // Toggle transparency visual state for color picker
    if (DOM.transparentBg.checked) {
      DOM.bgColor.setAttribute('disabled', 'disabled');
      DOM.bgColor.style.opacity = '0.5';
    } else {
      DOM.bgColor.removeAttribute('disabled');
      DOM.bgColor.style.opacity = '1';
    }
  }

  /**
   * Render text onto a canvas of a specific size.
   * @param {number} size
   * @returns {HTMLCanvasElement}
   */
  function renderCanvas(size) {
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    // 1. Draw Background
    if (!state.isTransparent) {
      ctx.fillStyle = state.bgColor;
      if (state.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (state.shape === 'rounded') {
        var radius = size * 0.2; // 20% Apple-style rounded corner
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(size - radius, 0);
        ctx.quadraticCurveTo(size, 0, size, radius);
        ctx.lineTo(size, size - radius);
        ctx.quadraticCurveTo(size, size, size - radius, size);
        ctx.lineTo(radius, size);
        ctx.quadraticCurveTo(0, size, 0, size - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        // square
        ctx.fillRect(0, 0, size, size);
      }
    }

    // 2. Draw Text
    ctx.fillStyle = state.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Smooth font scaling
    var fontSizePx = Math.floor(size * (state.fontSizePercent / 100));
    var fontStyleStr = (state.isItalic ? 'italic ' : '') + state.weight + ' ' + fontSizePx + 'px "' + state.font + '", sans-serif';
    ctx.font = fontStyleStr;

    // Draw text centered. Minor vertical adjustment for better font rendering baseline.
    var yOffset = size * 0.02; // Tiny shift down to center glyph cap-heights visually
    ctx.fillText(state.text, size / 2, size / 2 + yOffset);

    return canvas;
  }

  /**
   * Update the live preview grid and copyable HTML code snippet.
   */
  function generateAll() {
    if (!DOM.previewGrid) return;
    DOM.previewGrid.innerHTML = '';

    FAVICON_SIZES.forEach(function (item) {
      var canvas = renderCanvas(item.size);
      
      var previewItem = document.createElement('div');
      previewItem.className = 'preview-item animate-fade-in';

      var wrapper = document.createElement('div');
      wrapper.className = 'preview-icon-wrapper';

      var img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.alt = item.label;
      img.title = item.desc;

      wrapper.appendChild(img);
      
      var label = document.createElement('span');
      label.className = 'size-label';
      label.textContent = item.label;

      var desc = document.createElement('span');
      desc.className = 'size-desc';
      desc.textContent = item.desc;

      previewItem.appendChild(wrapper);
      previewItem.appendChild(label);
      previewItem.appendChild(desc);
      DOM.previewGrid.appendChild(previewItem);
    });

    // Update HTML snippet
    if (DOM.htmlCode) {
      var code = [];
      code.push('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">');
      code.push('<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">');
      code.push('<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">');
      code.push('<link rel="icon" type="image/x-icon" href="/favicon.ico">');
      if (state.includeManifest) {
        code.push('<link rel="manifest" href="/site.webmanifest">');
      }
      DOM.htmlCode.textContent = code.join('\n');
    }
  }

  /**
   * Package files and trigger download
   */
  async function triggerZipDownload() {
    if (typeof JSZip === 'undefined') {
      showToast('Downloading components... JSZip is missing. Please reload the page.', 'error');
      return;
    }

    setLoading(true);

    try {
      var zip = new JSZip();

      // 1. Generate ICO fallback (16, 32, 48)
      var icoBlob = await generateICOBinary(ICO_SIZES);
      zip.file('favicon.ico', icoBlob);

      // 2. Generate PNG sizes
      for (var i = 0; i < FAVICON_SIZES.length; i++) {
        var item = FAVICON_SIZES[i];
        var canvas = renderCanvas(item.size);
        var pngBlob = await canvasToBlob(canvas);
        zip.file(item.name, pngBlob);
      }

      // 3. Generate site.webmanifest
      if (state.includeManifest) {
        var manifestObj = {
          name: 'Favicon Package',
          short_name: 'Favicon',
          icons: [
            { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
          ],
          theme_color: state.isTransparent ? '#8b5cf6' : state.bgColor,
          background_color: state.isTransparent ? '#0a0e1a' : state.bgColor,
          display: 'standalone'
        };
        zip.file('site.webmanifest', JSON.stringify(manifestObj, null, 2));
      }

      // 4. Generate zip file async
      var zipBlob = await zip.generateAsync({ type: 'blob' }, function (metadata) {
        updateProgress(metadata.percent);
      });

      // 5. Trigger download
      var downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = 'text-favicon-pack.zip';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast('Favicon pack downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error generating files. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Canvas to PNG blob promise converter
   */
  function canvasToBlob(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob conversion failed'));
        }
      }, 'image/png');
    });
  }

  /**
   * Generate binary ICO file bundling multiple PNGs.
   */
  async function generateICOBinary(sizes) {
    var pngBuffers = [];
    for (var i = 0; i < sizes.length; i++) {
      var canvas = renderCanvas(sizes[i]);
      var blob = await canvasToBlob(canvas);
      var buffer = await blobToArrayBuffer(blob);
      pngBuffers.push({ size: sizes[i], buffer: buffer });
    }

    var ICONDIR_SIZE = 6;
    var ICONDIRENTRY_SIZE = 16;
    var headerSize = ICONDIR_SIZE + ICONDIRENTRY_SIZE * pngBuffers.length;

    var totalDataSize = 0;
    pngBuffers.forEach(function (item) {
      totalDataSize += item.buffer.byteLength;
    });

    var icoBuffer = new ArrayBuffer(headerSize + totalDataSize);
    var view = new DataView(icoBuffer);

    // Write ICONDIR
    view.setUint16(0, 0, true);
    view.setUint16(2, 1, true); // type 1 = ICO
    view.setUint16(4, pngBuffers.length, true);

    // Write entries
    var offset = headerSize;
    for (var j = 0; j < pngBuffers.length; j++) {
      var entry = pngBuffers[j];
      var entryOffset = ICONDIR_SIZE + j * ICONDIRENTRY_SIZE;

      view.setUint8(entryOffset + 0, entry.size >= 256 ? 0 : entry.size); // width
      view.setUint8(entryOffset + 1, entry.size >= 256 ? 0 : entry.size); // height
      view.setUint8(entryOffset + 2, 0); // colors
      view.setUint8(entryOffset + 3, 0); // reserved
      view.setUint16(entryOffset + 4, 1, true); // color planes
      view.setUint16(entryOffset + 6, 32, true); // bpp
      view.setUint32(entryOffset + 8, entry.buffer.byteLength, true); // byte size
      view.setUint32(entryOffset + 12, offset, true); // file offset

      offset += entry.buffer.byteLength;
    }

    // Write PNG data buffers
    var currentOffset = headerSize;
    for (var k = 0; k < pngBuffers.length; k++) {
      var src = new Uint8Array(pngBuffers[k].buffer);
      var dst = new Uint8Array(icoBuffer, currentOffset, src.length);
      dst.set(src);
      currentOffset += src.length;
    }

    return new Blob([icoBuffer], { type: 'image/x-icon' });
  }

  function blobToArrayBuffer(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(new Error('ArrayBuffer read failed'));
      };
      reader.readAsArrayBuffer(blob);
    });
  }

  // UI status utilities
  function setLoading(isLoading) {
    if (!DOM.downloadAllBtn) return;
    if (isLoading) {
      DOM.downloadAllBtn.setAttribute('disabled', 'disabled');
      DOM.downloadAllBtn.innerHTML = '⚙️ Generating ZIP...';
      if (DOM.progressBar) DOM.progressBar.classList.remove('hidden');
    } else {
      DOM.downloadAllBtn.removeAttribute('disabled');
      DOM.downloadAllBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:0.5rem;" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download Favicon Pack (ZIP)
      `;
      if (DOM.progressBar) {
        DOM.progressBar.classList.add('hidden');
        var fill = DOM.progressBar.querySelector('.fill');
        if (fill) fill.style.width = '0%';
      }
    }
  }

  function updateProgress(percent) {
    if (DOM.progressBar) {
      var fill = DOM.progressBar.querySelector('.fill');
      if (fill) fill.style.width = percent + '%';
    }
  }

  function showToast(message, type) {
    // Check if main.js toast utility is available
    if (window.showToastNotification) {
      window.showToastNotification(message, type);
    } else {
      alert(type.toUpperCase() + ': ' + message);
    }
  }
})();
