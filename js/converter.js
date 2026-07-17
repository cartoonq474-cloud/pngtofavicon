/**
 * converter.js — 100% Client-Side PNG to Favicon Converter
 * Handles: file upload, image resizing, ICO binary generation,
 *          manifest/HTML code generation, ZIP packaging, and previews.
 *
 * Dependencies: JSZip (loaded from CDN)
 */

(function () {
  'use strict';

  // =========================================================================
  // Configuration
  // =========================================================================

  /** All favicon output sizes with metadata. */
  var FAVICON_SIZES = [
    { name: 'favicon-16x16.png', size: 16, label: '16×16', desc: 'Browser tabs' },
    { name: 'favicon-32x32.png', size: 32, label: '32×32', desc: 'HiDPI tabs' },
    { name: 'favicon-48x48.png', size: 48, label: '48×48', desc: 'Windows desktop' },
    { name: 'apple-touch-icon.png', size: 180, label: '180×180', desc: 'Apple Touch Icon' },
    { name: 'android-chrome-192x192.png', size: 192, label: '192×192', desc: 'Android home screen' },
    { name: 'android-chrome-512x512.png', size: 512, label: '512×512', desc: 'PWA install icon' },
  ];

  /** Sizes bundled into the multi-resolution favicon.ico file. */
  var ICO_SIZES = [16, 32, 48];

  /** Maximum upload size in bytes (5 MB). */
  var MAX_FILE_SIZE = 5 * 1024 * 1024;

  /** Accepted MIME types for upload. */
  var ACCEPTED_TYPES = [
    'image/png',
    'image/jpeg',
    'image/svg+xml',
    'image/webp',
    'image/gif',
  ];

  // =========================================================================
  // State
  // =========================================================================

  var uploadedImage = null; // HTMLImageElement once loaded
  var selectedSizes = FAVICON_SIZES.slice(); // All selected by default
  var bgColor = 'transparent';
  var roundCorners = false;
  var includeManifest = true;
  var isProcessing = false;

  // =========================================================================
  // DOM References (resolved lazily on DOMContentLoaded)
  // =========================================================================

  var DOM = {};

  function cacheDOMRefs() {
    DOM.dropZone = document.getElementById('dropZone');
    DOM.fileInput = document.getElementById('fileInput');
    DOM.optionsPanel = document.getElementById('optionsPanel');
    DOM.outputSection = document.getElementById('outputSection');
    DOM.previewGrid = document.getElementById('previewGrid');
    DOM.downloadBtn = document.getElementById('downloadBtn');
    DOM.downloadAllBtn = document.getElementById('downloadAllBtn');
    DOM.codeBlock = document.getElementById('htmlCode');
    DOM.colorPicker = document.getElementById('bgColor');
    DOM.roundToggle = document.getElementById('roundCorners');
    DOM.manifestToggle = document.getElementById('includeManifest');
    DOM.sizeCheckboxes = document.querySelectorAll('#sizeCheckboxes input[type="checkbox"]');
    DOM.previewImg = document.getElementById('previewImg');
    DOM.dropText = document.getElementById('dropZoneContent');
    DOM.processingOverlay = document.querySelector('.processing-overlay');
  }

  // =========================================================================
  // FILE UPLOAD — Drag & Drop + Click
  // =========================================================================

  function initDropZone() {
    if (!DOM.dropZone) return;

    // Drag events
    DOM.dropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      DOM.dropZone.classList.add('dragover');
    });

    DOM.dropZone.addEventListener('dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();
      DOM.dropZone.classList.remove('dragover');
    });

    DOM.dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      DOM.dropZone.classList.remove('dragover');

      var files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    });

    // Click to open file picker
    DOM.dropZone.addEventListener('click', function (e) {
      // Don't re-trigger if clicking the file input itself
      if (e.target === DOM.fileInput) return;
      if (DOM.fileInput) DOM.fileInput.click();
    });

    // File input change
    if (DOM.fileInput) {
      DOM.fileInput.addEventListener('change', function () {
        if (DOM.fileInput.files.length > 0) {
          handleFile(DOM.fileInput.files[0]);
        }
      });
    }
  }

  /**
   * Validate and load the selected image file.
   * @param {File} file
   */
  function handleFile(file) {
    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      showToast('Please upload a valid image (PNG, JPG, SVG, WebP, or GIF).', 'error');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      showToast('File is too large. Maximum size is 5 MB.', 'error');
      return;
    }

    var reader = new FileReader();

    reader.onerror = function () {
      showToast('Failed to read the file. Please try again.', 'error');
    };

    reader.onload = function (e) {
      var img = new Image();

      img.onerror = function () {
        showToast('Could not decode image. The file may be corrupted.', 'error');
      };

      img.onload = function () {
        uploadedImage = img;

        // Update drop zone to show preview
        DOM.dropZone.classList.add('has-file');

        // Create or update preview thumbnail
        var previewImg = DOM.dropZone.querySelector('.preview-img');
        if (!previewImg) {
          previewImg = document.createElement('img');
          previewImg.className = 'preview-img';
          previewImg.alt = 'Uploaded image preview';
          DOM.dropZone.appendChild(previewImg);
        }
        previewImg.src = e.target.result;
        previewImg.classList.remove('hidden');

        // Update drop zone text
        if (DOM.dropText) {
          DOM.dropText.innerHTML =
            '<strong>' + escapeHTML(file.name) + '</strong><br>' +
            '<small>' + img.naturalWidth + ' × ' + img.naturalHeight + 'px · ' +
            formatBytes(file.size) + '</small><br>' +
            '<small>Click or drop to replace</small>';
        }

        // Reveal panels
        showOptionsPanel();
        showOutputSection();

        // Auto-generate favicons
        generateAll();
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }

  // =========================================================================
  // IMAGE PROCESSING
  // =========================================================================

  /**
   * Resize an image to targetSize × targetSize with optional background and rounded corners.
   * @param {HTMLImageElement} img
   * @param {number} targetSize
   * @param {Object} [options]
   * @param {string} [options.bgColor='transparent']
   * @param {boolean} [options.roundCorners=false]
   * @returns {HTMLCanvasElement}
   */
  function resizeImage(img, targetSize, options) {
    options = options || {};
    var bg = options.bgColor || 'transparent';
    var rounded = options.roundCorners || false;

    var canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    var ctx = canvas.getContext('2d');

    // Background fill
    if (bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, targetSize, targetSize);
    }

    // Rounded corner clipping
    if (rounded) {
      var radius = targetSize * 0.2; // 20 % corner radius (Apple-style)
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(targetSize - radius, 0);
      ctx.quadraticCurveTo(targetSize, 0, targetSize, radius);
      ctx.lineTo(targetSize, targetSize - radius);
      ctx.quadraticCurveTo(targetSize, targetSize, targetSize - radius, targetSize);
      ctx.lineTo(radius, targetSize);
      ctx.quadraticCurveTo(0, targetSize, 0, targetSize - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.clip();
    }

    // High-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, targetSize, targetSize);

    return canvas;
  }

  /**
   * Convert a canvas to a PNG Blob.
   * @param {HTMLCanvasElement} canvas
   * @param {string} [type='image/png']
   * @returns {Promise<Blob>}
   */
  function canvasToBlob(canvas, type) {
    type = type || 'image/png';
    return new Promise(function (resolve, reject) {
      canvas.toBlob(
        function (blob) {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        type
      );
    });
  }

  // =========================================================================
  // ICO FILE GENERATION — Full binary implementation
  // =========================================================================

  /**
   * Generate a multi-resolution .ico file containing embedded PNGs.
   *
   * ICO binary format:
   *   ICONDIR   (6 bytes)  — reserved(2) + type(2) + count(2)
   *   ICONDIRENTRY × N (16 bytes each)
   *   PNG data blobs concatenated
   *
   * @param {HTMLImageElement} img
   * @param {number[]} [sizes=[16, 32, 48]]
   * @returns {Promise<Blob>} ICO blob
   */
  async function generateICO(img, sizes) {
    sizes = sizes || ICO_SIZES;

    // 1. Render each size to PNG ArrayBuffer
    var pngBuffers = [];
    for (var i = 0; i < sizes.length; i++) {
      var canvas = resizeImage(img, sizes[i], { bgColor: bgColor, roundCorners: roundCorners });
      var blob = await canvasToBlob(canvas);
      var buffer = await blobToArrayBuffer(blob);
      pngBuffers.push({ size: sizes[i], buffer: buffer });
    }

    // 2. Calculate offsets
    var ICONDIR_SIZE = 6;
    var ICONDIRENTRY_SIZE = 16;
    var headerSize = ICONDIR_SIZE + ICONDIRENTRY_SIZE * pngBuffers.length;

    // 3. Total file size
    var totalDataSize = 0;
    pngBuffers.forEach(function (entry) {
      totalDataSize += entry.buffer.byteLength;
    });

    var totalSize = headerSize + totalDataSize;
    var icoBuffer = new ArrayBuffer(totalSize);
    var view = new DataView(icoBuffer);

    // 4. Write ICONDIR header
    view.setUint16(0, 0, true);           // Reserved, must be 0
    view.setUint16(2, 1, true);           // Type: 1 = ICO
    view.setUint16(4, pngBuffers.length, true); // Number of images

    // 5. Write ICONDIRENTRY for each image and track data offsets
    var dataOffset = headerSize;
    for (var j = 0; j < pngBuffers.length; j++) {
      var entry = pngBuffers[j];
      var entryOffset = ICONDIR_SIZE + j * ICONDIRENTRY_SIZE;

      // Width (0 means 256)
      view.setUint8(entryOffset + 0, entry.size >= 256 ? 0 : entry.size);
      // Height (0 means 256)
      view.setUint8(entryOffset + 1, entry.size >= 256 ? 0 : entry.size);
      // Colour palette count (0 = no palette / more than 256)
      view.setUint8(entryOffset + 2, 0);
      // Reserved
      view.setUint8(entryOffset + 3, 0);
      // Colour planes (1 for ICO)
      view.setUint16(entryOffset + 4, 1, true);
      // Bits per pixel (32 for RGBA PNG)
      view.setUint16(entryOffset + 6, 32, true);
      // Image data size in bytes
      view.setUint32(entryOffset + 8, entry.buffer.byteLength, true);
      // Offset of image data from beginning of file
      view.setUint32(entryOffset + 12, dataOffset, true);

      dataOffset += entry.buffer.byteLength;
    }

    // 6. Write PNG image data
    var currentOffset = headerSize;
    for (var k = 0; k < pngBuffers.length; k++) {
      var src = new Uint8Array(pngBuffers[k].buffer);
      var dst = new Uint8Array(icoBuffer, currentOffset, src.length);
      dst.set(src);
      currentOffset += src.length;
    }

    return new Blob([icoBuffer], { type: 'image/x-icon' });
  }

  /**
   * Convert a Blob to an ArrayBuffer.
   * @param {Blob} blob
   * @returns {Promise<ArrayBuffer>}
   */
  function blobToArrayBuffer(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(new Error('Failed to read blob as ArrayBuffer'));
      };
      reader.readAsArrayBuffer(blob);
    });
  }

  // =========================================================================
  // MANIFEST GENERATION
  // =========================================================================

  /**
   * Generate a site.webmanifest JSON string.
   * @returns {string}
   */
  function generateManifest() {
    var manifest = {
      name: '',
      short_name: '',
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
    };

    return JSON.stringify(manifest, null, 2);
  }

  // =========================================================================
  // HTML CODE GENERATION
  // =========================================================================

  /**
   * Generate the HTML link/meta tags for the favicon package.
   * @returns {string}
   */
  function generateHTMLCode() {
    var lines = [];

    // Only include tags for selected sizes
    var hasApple = selectedSizes.some(function (s) { return s.size === 180; });
    var has32 = selectedSizes.some(function (s) { return s.size === 32; });
    var has16 = selectedSizes.some(function (s) { return s.size === 16; });

    if (hasApple) {
      lines.push('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">');
    }
    if (has32) {
      lines.push('<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">');
    }
    if (has16) {
      lines.push('<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">');
    }

    lines.push('<link rel="icon" type="image/x-icon" href="/favicon.ico">');

    if (includeManifest) {
      lines.push('<link rel="manifest" href="/site.webmanifest">');
    }

    return lines.join('\n');
  }

  // =========================================================================
  // ZIP DOWNLOAD
  // =========================================================================

  /**
   * Generate a ZIP file containing all favicon assets and trigger download.
   */
  async function generateZIP() {
    // Guard: JSZip must be loaded
    if (typeof JSZip === 'undefined') {
      showToast('JSZip library failed to load. Please refresh and try again.', 'error');
      return;
    }

    if (!uploadedImage) {
      showToast('Please upload an image first.', 'error');
      return;
    }

    setProcessing(true);

    try {
      var zip = new JSZip();

      // 1. Generate favicon.ico
      var icoBlob = await generateICO(uploadedImage, ICO_SIZES);
      zip.file('favicon.ico', icoBlob);

      // 2. Generate each PNG size
      for (var i = 0; i < selectedSizes.length; i++) {
        var sizeEntry = selectedSizes[i];
        var canvas = resizeImage(uploadedImage, sizeEntry.size, {
          bgColor: bgColor,
          roundCorners: roundCorners,
        });
        var blob = await canvasToBlob(canvas);
        zip.file(sizeEntry.name, blob);
      }

      // 3. Add site.webmanifest
      if (includeManifest) {
        zip.file('site.webmanifest', generateManifest());
      }

      // 4. Generate & download ZIP
      var zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, 'favicon-package.zip');

      showToast('Favicon package downloaded!', 'success');
    } catch (err) {
      console.error('ZIP generation failed:', err);
      showToast('Failed to generate ZIP: ' + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  }

  // =========================================================================
  // PREVIEW RENDERING
  // =========================================================================

  /**
   * Render preview thumbnails for all selected sizes.
   */
  function renderPreviews() {
    if (!DOM.previewGrid || !uploadedImage) return;

    DOM.previewGrid.innerHTML = '';

    selectedSizes.forEach(function (sizeEntry) {
      var canvas = resizeImage(uploadedImage, sizeEntry.size, {
        bgColor: bgColor,
        roundCorners: roundCorners,
      });

      var item = document.createElement('div');
      item.className = 'preview-item';

      var wrapper = document.createElement('div');
      wrapper.className = 'preview-icon-wrapper';

      var img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.alt = sizeEntry.label + ' favicon preview';

      wrapper.appendChild(img);

      var label = document.createElement('span');
      label.className = 'size-label';
      label.textContent = sizeEntry.label;

      var desc = document.createElement('span');
      desc.className = 'size-desc';
      desc.textContent = sizeEntry.desc;

      // Individual download button
      var dlBtn = document.createElement('button');
      dlBtn.className = 'preview-download';
      dlBtn.textContent = '↓ Download';
      dlBtn.setAttribute('aria-label', 'Download ' + sizeEntry.name);
      dlBtn.addEventListener('click', (function (entry, cvs) {
        return async function (e) {
          e.stopPropagation();
          try {
            var blob = await canvasToBlob(cvs);
            downloadFile(blob, entry.name);
          } catch (err) {
            showToast('Download failed.', 'error');
          }
        };
      })(sizeEntry, canvas));

      item.appendChild(wrapper);
      item.appendChild(label);
      item.appendChild(desc);
      item.appendChild(dlBtn);

      DOM.previewGrid.appendChild(item);
    });
  }

  /**
   * Update the HTML code block display.
   */
  function updateCodeBlock() {
    if (!DOM.codeBlock) return;
    DOM.codeBlock.textContent = generateHTMLCode();
  }

  // =========================================================================
  // FULL GENERATION PIPELINE
  // =========================================================================

  /**
   * Run the complete generation pipeline: previews + code block.
   */
  async function generateAll() {
    if (!uploadedImage) return;

    setProcessing(true);

    try {
      renderPreviews();
      updateCodeBlock();
      updateDownloadButton();
    } catch (err) {
      console.error('Generation failed:', err);
      showToast('Something went wrong during generation.', 'error');
    } finally {
      setProcessing(false);
    }
  }

  // =========================================================================
  // INDIVIDUAL FILE DOWNLOAD
  // =========================================================================

  /**
   * Trigger a browser download for a Blob.
   * @param {Blob} blob
   * @param {string} filename
   */
  function downloadFile(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Cleanup after a short delay to ensure download starts
    setTimeout(function () {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  }

  // =========================================================================
  // UI STATE MANAGEMENT
  // =========================================================================

  /** Show the output section. */
  function showOutputSection() {
    if (DOM.outputSection) DOM.outputSection.classList.remove('hidden');
    var layout = document.querySelector('.tool-layout');
    if (layout) layout.classList.add('tool-active');
  }

  /** Hide the output section. */
  function hideOutputSection() {
    if (DOM.outputSection) DOM.outputSection.classList.add('hidden');
    var layout = document.querySelector('.tool-layout');
    if (layout) layout.classList.remove('tool-active');
  }

  /** Show the options panel. */
  function showOptionsPanel() {
    if (DOM.optionsPanel) DOM.optionsPanel.classList.remove('hidden');
  }

  /** Enable/disable the download button based on state. */
  function updateDownloadButton() {
    var btn = DOM.downloadBtn || DOM.downloadAllBtn;
    if (!btn) return;
    btn.disabled = !uploadedImage || isProcessing;
  }

  /**
   * Toggle the processing/loading overlay.
   * @param {boolean} state
   */
  function setProcessing(state) {
    isProcessing = state;

    if (DOM.processingOverlay) {
      DOM.processingOverlay.classList.toggle('hidden', !state);
    }

    // Add loading class to drop zone
    if (DOM.dropZone) {
      DOM.dropZone.classList.toggle('processing', state);
    }

    updateDownloadButton();
  }

  /**
   * Show a temporary toast notification.
   * @param {string} message
   * @param {'success'|'error'|'info'} [type='info']
   */
  function showToast(message, type) {
    type = type || 'info';

    // Expose globally
    window.showToastNotification = showToast;

    // Remove any existing toast
    var existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast-notification toast--' + type;
    toast.setAttribute('role', 'alert');

    var icons = { success: '✓', error: '✗', info: 'ℹ' };
    toast.innerHTML =
      '<span class="toast__icon">' + (icons[type] || 'ℹ') + '</span>' +
      '<span class="toast__message">' + escapeHTML(message) + '</span>';

    // Position styling
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: '10000',
      padding: '0.75rem 1.25rem',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      animation: 'toastIn 0.3s ease-out',
      maxWidth: '400px',
    });

    // Type-specific colours
    var colors = {
      success: { bg: '#10b981', fg: '#fff' },
      error: { bg: '#ef4444', fg: '#fff' },
      info: { bg: '#3b82f6', fg: '#fff' },
    };
    var c = colors[type] || colors.info;
    toast.style.backgroundColor = c.bg;
    toast.style.color = c.fg;

    document.body.appendChild(toast);

    // Auto-dismiss after 4 seconds
    setTimeout(function () {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(function () {
        toast.remove();
      }, 350);
    }, 4000);
  }

  // =========================================================================
  // OPTION CHANGE HANDLERS
  // =========================================================================

  /**
   * Bind event listeners to the options panel controls.
   */
  function initOptions() {
    // Background colour picker
    if (DOM.colorPicker) {
      DOM.colorPicker.addEventListener('input', function () {
        bgColor = DOM.colorPicker.value || 'transparent';
        generateAll();
      });
    }

    // Transparent background checkbox (often paired with colour picker)
    var transparentToggle = document.getElementById('transparentBg');
    if (transparentToggle) {
      transparentToggle.addEventListener('change', function () {
        if (transparentToggle.checked) {
          bgColor = 'transparent';
          if (DOM.colorPicker) DOM.colorPicker.disabled = true;
        } else {
          bgColor = DOM.colorPicker ? DOM.colorPicker.value : 'transparent';
          if (DOM.colorPicker) DOM.colorPicker.disabled = false;
        }
        generateAll();
      });
    }

    // Rounded corners toggle
    if (DOM.roundToggle) {
      DOM.roundToggle.addEventListener('change', function () {
        roundCorners = DOM.roundToggle.checked;
        generateAll();
      });
    }

    // Include manifest toggle
    if (DOM.manifestToggle) {
      DOM.manifestToggle.addEventListener('change', function () {
        includeManifest = DOM.manifestToggle.checked;
        updateCodeBlock();
      });
    }

    // Size checkboxes
    if (DOM.sizeCheckboxes && DOM.sizeCheckboxes.length > 0) {
      DOM.sizeCheckboxes.forEach(function (cb) {
        cb.addEventListener('change', function () {
          updateSelectedSizes();
          generateAll();
        });
      });
    }

    // Download all / ZIP button
    var downloadBtn = DOM.downloadBtn || DOM.downloadAllBtn;
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        generateZIP();
      });
    }

    // Download ICO only button (if it exists)
    var icoBtn = document.getElementById('download-ico-btn');
    if (icoBtn) {
      icoBtn.addEventListener('click', async function () {
        if (!uploadedImage) return;
        try {
          setProcessing(true);
          var icoBlob = await generateICO(uploadedImage);
          downloadFile(icoBlob, 'favicon.ico');
          showToast('favicon.ico downloaded!', 'success');
        } catch (err) {
          showToast('Failed to generate ICO file.', 'error');
        } finally {
          setProcessing(false);
        }
      });
    }
  }

  /**
   * Rebuild the selectedSizes array based on checked checkboxes.
   */
  function updateSelectedSizes() {
    if (!DOM.sizeCheckboxes || DOM.sizeCheckboxes.length === 0) {
      selectedSizes = FAVICON_SIZES.slice();
      return;
    }

    selectedSizes = [];
    DOM.sizeCheckboxes.forEach(function (cb) {
      if (cb.checked) {
        var size = parseInt(cb.value, 10);
        var match = FAVICON_SIZES.find(function (s) { return s.size === size; });
        if (match) selectedSizes.push(match);
      }
    });

    // Fallback: if nothing is selected, select all
    if (selectedSizes.length === 0) {
      selectedSizes = FAVICON_SIZES.slice();
    }
  }

  // =========================================================================
  // UTILITY HELPERS
  // =========================================================================

  /**
   * Escape HTML special characters to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * Format bytes into a human-readable string.
   * @param {number} bytes
   * @returns {string}
   */
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024;
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
  }

  // =========================================================================
  // Inject toast animation keyframes
  // =========================================================================

  (function injectAnimations() {
    if (document.getElementById('converter-animations')) return;
    var style = document.createElement('style');
    style.id = 'converter-animations';
    style.textContent =
      '@keyframes toastIn {' +
      '  from { opacity: 0; transform: translateY(20px); }' +
      '  to   { opacity: 1; transform: translateY(0); }' +
      '}' +
      '@keyframes slideUp {' +
      '  from { opacity: 0; transform: translateY(100%); }' +
      '  to   { opacity: 1; transform: translateY(0); }' +
      '}';
    document.head.appendChild(style);
  })();

  // =========================================================================
  // INITIALISATION
  // =========================================================================

  document.addEventListener('DOMContentLoaded', function () {
    cacheDOMRefs();
    initDropZone();
    initOptions();

    // Hide output panels until an image is uploaded
    hideOutputSection();
    if (DOM.optionsPanel) DOM.optionsPanel.classList.add('hidden');
  });
})();
