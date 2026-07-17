/**
 * emoji-generator.js — Emoji to Favicon Engine
 * 100% Client-Side canvas emoji rendering and package creation.
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

  const EMOJI_CATEGORIES = {
    popular: [
      { emoji: '🚀', name: 'rocket space launch' },
      { emoji: '🔥', name: 'fire hot flame popular' },
      { emoji: '✨', name: 'sparkles star shine magic' },
      { emoji: '❤️', name: 'heart love red' },
      { emoji: '👍', name: 'thumbs up like good' },
      { emoji: '💡', name: 'lightbulb idea bulb smart creative' },
      { emoji: '🌍', name: 'globe earth world map' },
      { emoji: '🎨', name: 'palette art paint creative' },
      { emoji: '🎮', name: 'game controller play' },
      { emoji: '💻', name: 'laptop computer tech work developer' },
      { emoji: '📈', name: 'chart graph growth success' },
      { emoji: '🛍️', name: 'shopping bags cart store shop' },
      { emoji: '⚡', name: 'lightning bolt electricity energy fast' },
      { emoji: '🔒', name: 'lock secure private safe' },
      { emoji: '🎉', name: 'tada celebration party fun' },
      { emoji: '📱', name: 'phone mobile smartphone cell' }
    ],
    tech: [
      { emoji: '💻', name: 'laptop computer tech work developer' },
      { emoji: '⌨️', name: 'keyboard typing text tech' },
      { emoji: '🖥️', name: 'desktop screen monitor display' },
      { emoji: '💾', name: 'floppy save disk storage' },
      { emoji: '💿', name: 'cd dvd disc media optical' },
      { emoji: '🖱️', name: 'mouse click pointer tech' },
      { emoji: '🤖', name: 'robot AI bot assistant machine' },
      { emoji: '⚙️', name: 'gear settings configuration options' },
      { emoji: '🔧', name: 'wrench tool setup configure' },
      { emoji: '🔨', name: 'hammer tool build construction' },
      { emoji: '📡', name: 'satellite dish signal antenna network' },
      { emoji: '🔋', name: 'battery power energy charge' },
      { emoji: '🔌', name: 'plug electric power connector' },
      { emoji: '🔒', name: 'lock secure private safe' },
      { emoji: '🔑', name: 'key unlock access secret' },
      { emoji: '🛡️', name: 'shield protect secure safety' }
    ],
    smileys: [
      { emoji: '😀', name: 'grinning face happy smile' },
      { emoji: '😎', name: 'cool sunglasses chill style' },
      { emoji: '🤔', name: 'thinking question wonder face' },
      { emoji: '🤓', name: 'nerd glasses smart book' },
      { emoji: '😉', name: 'wink face tease' },
      { emoji: '😂', name: 'joy tears laugh face' },
      { emoji: '😍', name: 'heart eyes love admire' },
      { emoji: '🤩', name: 'starstruck excited face' },
      { emoji: '🥳', name: 'party face celebration hat' },
      { emoji: '😇', name: 'angel halo innocent good' },
      { emoji: '🤠', name: 'cowboy hat adventure' },
      { emoji: '🤖', name: 'robot machine face' },
      { emoji: '👽', name: 'alien space monster' },
      { emoji: '👻', name: 'ghost spooky scary halloween' },
      { emoji: '🐱', name: 'cat pet kitty' },
      { emoji: '🐶', name: 'dog pet puppy' }
    ],
    objects: [
      { emoji: '💡', name: 'lightbulb idea bulb smart creative' },
      { emoji: '🎨', name: 'palette art paint creative' },
      { emoji: '🎮', name: 'game controller play' },
      { emoji: '🎁', name: 'gift present birthday wrap' },
      { emoji: '🎈', name: 'balloon celebration fly party' },
      { emoji: '🚀', name: 'rocket space launch' },
      { emoji: '✈️', name: 'airplane fly travel flight' },
      { emoji: '🚗', name: 'car drive transport travel' },
      { emoji: '🚲', name: 'bicycle ride cycle sport' },
      { emoji: '⏰', name: 'alarm clock time timer alert' },
      { emoji: '📅', name: 'calendar date schedule event' },
      { emoji: '📚', name: 'books reading library study' },
      { emoji: '🖊️', name: 'pen writing draw ink office' },
      { emoji: '✉️', name: 'envelope mail letter contact' },
      { emoji: '📢', name: 'megaphone broadcast speaker news alert' },
      { emoji: '🔑', name: 'key security unlock access' }
    ],
    symbols: [
      { emoji: '❤️', name: 'heart love red' },
      { emoji: '✨', name: 'sparkles star shine magic' },
      { emoji: '🔥', name: 'fire hot flame popular' },
      { emoji: '⚡', name: 'lightning bolt electricity energy fast' },
      { emoji: '⭐', name: 'star gold premium success rating' },
      { emoji: '🌟', name: 'glowing star bright award' },
      { emoji: '💥', name: 'boom collision explosion bang' },
      { emoji: '🌀', name: 'cyclone vortex spiral' },
      { emoji: '💤', name: 'sleep zzz night tired' },
      { emoji: '🌐', name: 'globe network web internet' },
      { emoji: '💬', name: 'speech bubble chat conversation' },
      { emoji: '🔔', name: 'bell notification alert sound' },
      { emoji: '🎯', name: 'target goal focus hit bullseye' },
      { emoji: '🏆', name: 'trophy win success award prize' },
      { emoji: '📈', name: 'chart graph growth success' },
      { emoji: '⚓', name: 'anchor sea ship nautical target' }
    ]
  };

  // DOM Elements
  var DOM = {
    emojiInput: document.getElementById('emojiInput'),
    emojiSearch: document.getElementById('emojiSearch'),
    emojiCategoryTabs: document.getElementById('emojiCategoryTabs'),
    emojiGrid: document.getElementById('emojiGrid'),
    bgColor: document.getElementById('bgColor'),
    transparentBg: document.getElementById('transparentBg'),
    bgShape: document.getElementById('bgShape'),
    fontSize: document.getElementById('fontSize'),
    fontSizeVal: document.getElementById('fontSizeVal'),
    includeManifest: document.getElementById('includeManifest'),
    previewGrid: document.getElementById('previewGrid'),
    downloadAllBtn: document.getElementById('downloadAllBtn'),
    progressBar: document.getElementById('progressBar'),
    htmlCode: document.getElementById('htmlCode'),
  };

  // State
  var state = {
    emoji: '🚀',
    bgColor: '#8b5cf6',
    isTransparent: true,
    shape: 'rounded',
    emojiScale: 70,
    includeManifest: true,
    activeCategory: 'popular',
    searchQuery: '',
  };

  // Initialize
  init();

  function init() {
    if (!DOM.emojiInput) return; // Guard

    setupEventListeners();
    readStateFromUI();
    renderEmojiGrid();
    generateAll();
  }

  function setupEventListeners() {
    // Basic inputs
    var inputs = [
      DOM.emojiInput, DOM.bgColor, DOM.transparentBg,
      DOM.bgShape, DOM.fontSize, DOM.includeManifest
    ];

    inputs.forEach(function (input) {
      if (!input) return;
      var eventType = (input.id === 'emojiInput' || input.id === 'fontSize') ? 'input' : 'change';
      input.addEventListener(eventType, function () {
        readStateFromUI();
        generateAll();
      });
    });

    // Search input
    if (DOM.emojiSearch) {
      DOM.emojiSearch.addEventListener('input', function (e) {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderEmojiGrid();
      });
    }

    // Category Switcher
    if (DOM.emojiCategoryTabs) {
      DOM.emojiCategoryTabs.addEventListener('click', function (e) {
        var button = e.target.closest('button');
        if (!button) return;

        // Reset search field
        if (DOM.emojiSearch) DOM.emojiSearch.value = '';
        state.searchQuery = '';

        // Update active tab
        DOM.emojiCategoryTabs.querySelectorAll('button').forEach(function (btn) {
          btn.classList.remove('active');
        });
        button.classList.add('active');

        state.activeCategory = button.getAttribute('data-cat');
        renderEmojiGrid();
      });
    }

    // Grid Emoji Clicks
    if (DOM.emojiGrid) {
      DOM.emojiGrid.addEventListener('click', function (e) {
        var gridItem = e.target.closest('.emoji-grid-item');
        if (!gridItem) return;

        var selectedEmoji = gridItem.getAttribute('data-emoji');
        state.emoji = selectedEmoji;
        if (DOM.emojiInput) DOM.emojiInput.value = selectedEmoji;

        generateAll();
      });
    }

    // Download zip button
    if (DOM.downloadAllBtn) {
      DOM.downloadAllBtn.addEventListener('click', function () {
        triggerZipDownload();
      });
    }
  }

  function readStateFromUI() {
    state.emoji = DOM.emojiInput.value.trim() || '🚀';
    state.bgColor = DOM.bgColor.value;
    state.isTransparent = DOM.transparentBg.checked;
    state.shape = DOM.bgShape.value;
    state.emojiScale = parseInt(DOM.fontSize.value, 10);
    state.includeManifest = DOM.includeManifest.checked;

    // Update range display text
    if (DOM.fontSizeVal) {
      DOM.fontSizeVal.textContent = state.emojiScale + '%';
    }

    // Disable background color picker if transparent
    if (DOM.transparentBg.checked) {
      DOM.bgColor.setAttribute('disabled', 'disabled');
      DOM.bgColor.style.opacity = '0.5';
    } else {
      DOM.bgColor.removeAttribute('disabled');
      DOM.bgColor.style.opacity = '1';
    }
  }

  /**
   * Render emoji grid items based on active category or search query
   */
  function renderEmojiGrid() {
    if (!DOM.emojiGrid) return;
    DOM.emojiGrid.innerHTML = '';

    var listToRender = [];

    if (state.searchQuery) {
      // Search across ALL categories
      var matchedSet = new Set();
      Object.keys(EMOJI_CATEGORIES).forEach(function (cat) {
        EMOJI_CATEGORIES[cat].forEach(function (item) {
          if (item.name.includes(state.searchQuery) && !matchedSet.has(item.emoji)) {
            matchedSet.add(item.emoji);
            listToRender.push(item);
          }
        });
      });
    } else {
      // Standard category listing
      listToRender = EMOJI_CATEGORIES[state.activeCategory] || [];
    }

    if (listToRender.length === 0) {
      var noResults = document.createElement('div');
      noResults.style.gridColumn = '1 / -1';
      noResults.style.textAlign = 'center';
      noResults.style.padding = '1rem 0';
      noResults.style.color = 'var(--text-secondary)';
      noResults.style.fontSize = '0.875rem';
      noResults.textContent = 'No emojis matched your search.';
      DOM.emojiGrid.appendChild(noResults);
      return;
    }

    listToRender.forEach(function (item) {
      var btn = document.createElement('button');
      btn.className = 'emoji-grid-item';
      btn.setAttribute('data-emoji', item.emoji);
      btn.setAttribute('title', item.name);
      btn.style.background = 'none';
      btn.style.border = 'none';
      btn.style.fontSize = '1.75rem';
      btn.style.cursor = 'pointer';
      btn.style.padding = '0.25rem';
      btn.style.borderRadius = '8px';
      btn.style.transition = 'transform 0.2s';
      btn.textContent = item.emoji;

      btn.addEventListener('mouseover', function () {
        btn.style.transform = 'scale(1.2)';
      });
      btn.addEventListener('mouseout', function () {
        btn.style.transform = 'scale(1)';
      });

      DOM.emojiGrid.appendChild(btn);
    });
  }

  /**
   * Render emoji on canvas of size `size`.
   * @param {number} size
   * @returns {HTMLCanvasElement}
   */
  function renderCanvas(size) {
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    // 1. Draw Background Shape
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

    // 2. Draw Emoji Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Set emoji scale
    var fontSizePx = Math.floor(size * (state.emojiScale / 100));
    ctx.font = fontSizePx + 'px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif';

    // Vertical baseline correction (emojis render slightly high on some platforms)
    var yOffset = size * 0.04;
    ctx.fillText(state.emoji, size / 2, size / 2 + yOffset);

    return canvas;
  }

  /**
   * Update live previews and copyable HTML code block.
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

    // HTML links snippet update
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
   * ZIP packaging
   */
  async function triggerZipDownload() {
    if (typeof JSZip === 'undefined') {
      showToast('Downloading components... JSZip is missing. Please reload the page.', 'error');
      return;
    }

    setLoading(true);

    try {
      var zip = new JSZip();

      // 1. Generate ICO fallback
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
          name: 'Emoji Favicon Package',
          short_name: 'Emoji Favicon',
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
      downloadLink.download = 'emoji-favicon-pack.zip';
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
   * Generate multi-resolution .ico binary
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
    view.setUint16(2, 1, true);
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

  // UI state utilities
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
    if (window.showToastNotification) {
      window.showToastNotification(message, type);
    } else {
      alert(type.toUpperCase() + ': ' + message);
    }
  }
})();
