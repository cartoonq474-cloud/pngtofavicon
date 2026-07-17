/**
 * checker-validator.js — Favicon Auditor
 * Audits favicon installations via client-side CORS proxies.
 */
(function () {
  'use strict';

  // DOM elements
  var DOM = {
    form: document.getElementById('checkerForm'),
    urlInput: document.getElementById('checkerUrl'),
    auditBtn: document.getElementById('auditBtn'),
    loader: document.getElementById('checkerLoader'),
    report: document.getElementById('reportSection'),
    summaryIcon: document.getElementById('summaryIcon'),
    summaryText: document.getElementById('summaryStatusText'),
    summaryDetails: document.getElementById('summaryDetails'),
    
    // Status text nodes
    statusIcoText: document.getElementById('statusIcoText'),
    statusAppleText: document.getElementById('statusAppleText'),
    statusManifestText: document.getElementById('statusManifestText'),
    
    // Preview container nodes
    previewIco: document.getElementById('previewIco'),
    previewApple: document.getElementById('previewApple'),
    
    // HTML tags code block
    detectedTagsCode: document.getElementById('detectedTagsCode'),
    
    // Recommendations list
    recommendationsList: document.getElementById('recommendationsList'),
  };

  // State
  var reportData = {
    url: '',
    hasIcoTag: false,
    hasAppleTag: false,
    hasManifestTag: false,
    icoHref: '',
    appleHref: '',
    manifestHref: '',
    rawLinkTags: [],
    errors: [],
  };

  init();

  function init() {
    if (!DOM.form) return; // Guard

    DOM.form.addEventListener('submit', function (e) {
      e.preventDefault();
      runFaviconAudit();
    });
  }

  async function runFaviconAudit() {
    var rawUrl = DOM.urlInput.value.trim();
    if (!rawUrl) return;

    // Normalize URL
    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = 'https://' + rawUrl;
    }
    reportData.url = rawUrl;

    // Reset report state
    resetReport();
    setLoading(true);

    try {
      // Use AllOrigins raw HTML fetch proxy
      var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(rawUrl);
      var response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error('Proxy connection failed');
      }

      var htmlText = await response.text();
      analyzeHTML(htmlText);
      await checkFilePresence();
      renderReport();
    } catch (err) {
      console.error(err);
      showToast('Could not audit URL. Make sure the site is live and allows crawling.', 'error');
      showFailureSummary();
    } finally {
      setLoading(false);
    }
  }

  function resetReport() {
    DOM.report.classList.add('hidden');
    DOM.previewIco.style.display = 'none';
    DOM.previewApple.style.display = 'none';
    DOM.detectedTagsCode.textContent = 'No link tags found.';
    DOM.recommendationsList.innerHTML = '';
    
    reportData = {
      url: reportData.url,
      hasIcoTag: false,
      hasAppleTag: false,
      hasManifestTag: false,
      icoHref: '',
      appleHref: '',
      manifestHref: '',
      rawLinkTags: [],
      errors: [],
    };
  }

  function setLoading(isLoading) {
    if (isLoading) {
      DOM.auditBtn.setAttribute('disabled', 'disabled');
      DOM.auditBtn.textContent = 'Auditing...';
      DOM.loader.classList.remove('hidden');
    } else {
      DOM.auditBtn.removeAttribute('disabled');
      DOM.auditBtn.textContent = 'Audit Favicon';
      DOM.loader.classList.add('hidden');
    }
  }

  /**
   * Parse the HTML text and extract relevant tags
   * @param {string} htmlText
   */
  function analyzeHTML(htmlText) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlText, 'text/html');
    var links = doc.querySelectorAll('link');

    links.forEach(function (link) {
      var rel = (link.getAttribute('rel') || '').toLowerCase();
      var href = link.getAttribute('href') || '';
      var sizes = link.getAttribute('sizes') || '';

      if (!rel || !href) return;

      // Clean href to absolute URL
      var absoluteHref = resolveUrl(stateUrlBase(), href);

      // Raw tag text for report block
      var tagString = link.outerHTML;
      
      if (rel.includes('icon') || rel.includes('shortcut')) {
        reportData.rawLinkTags.push(tagString);
        
        // Prefer explicit favicon or .ico formats
        if (href.endsWith('.ico') || rel.includes('shortcut') || !reportData.icoHref) {
          reportData.hasIcoTag = true;
          reportData.icoHref = absoluteHref;
        }
      }

      if (rel.includes('apple-touch-icon')) {
        reportData.rawLinkTags.push(tagString);
        reportData.hasAppleTag = true;
        reportData.appleHref = absoluteHref;
      }

      if (rel === 'manifest') {
        reportData.rawLinkTags.push(tagString);
        reportData.hasManifestTag = true;
        reportData.manifestHref = absoluteHref;
      }
    });
  }

  /**
   * Check fallback URL existence if markup checks fail
   */
  async function checkFilePresence() {
    // If no favicon.ico markup tag found, check standard root domain default location
    if (!reportData.icoHref) {
      var defaultIcoUrl = resolveUrl(stateUrlBase(), '/favicon.ico');
      try {
        // HEAD request via proxy to check if file exists
        var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(defaultIcoUrl);
        var res = await fetch(proxyUrl, { method: 'HEAD' });
        if (res.ok) {
          reportData.icoHref = defaultIcoUrl;
        }
      } catch (e) {
        console.warn('Default favicon path check failed');
      }
    }
  }

  function renderReport() {
    DOM.report.classList.remove('hidden');

    // 1. Update fallback favicon.ico status
    if (reportData.icoHref) {
      DOM.statusIcoText.innerHTML = '✅ <strong>Found</strong><br>Location: <span style="font-family: monospace; font-size: 0.75rem; word-break: break-all;">' + escapeHTML(reportData.icoHref) + '</span>';
      var imgIco = DOM.previewIco.querySelector('img');
      imgIco.src = reportData.icoHref;
      DOM.previewIco.style.display = 'block';
    } else {
      DOM.statusIcoText.innerHTML = '⚠️ <strong>Missing</strong><br>No fallback icon found in HTML head markup or root server.';
    }

    // 2. Update apple-touch-icon status
    if (reportData.appleHref) {
      DOM.statusAppleText.innerHTML = '✅ <strong>Found</strong><br>Location: <span style="font-family: monospace; font-size: 0.75rem; word-break: break-all;">' + escapeHTML(reportData.appleHref) + '</span>';
      var imgApple = DOM.previewApple.querySelector('img');
      imgApple.src = reportData.appleHref;
      DOM.previewApple.style.display = 'block';
    } else {
      DOM.statusAppleText.innerHTML = '❌ <strong>Missing</strong><br>iOS home screen icon not configured in head meta.';
    }

    // 3. Update manifest status
    if (reportData.hasManifestTag) {
      DOM.statusManifestText.innerHTML = '✅ <strong>Found</strong><br>Location: <span style="font-family: monospace; font-size: 0.75rem; word-break: break-all;">' + escapeHTML(reportData.manifestHref) + '</span>';
    } else {
      DOM.statusManifestText.innerHTML = '⚠️ <strong>Missing</strong><br>PWA installation metadata manifest is not configured.';
    }

    // 4. Detected tags markup
    if (reportData.rawLinkTags.length > 0) {
      DOM.detectedTagsCode.textContent = reportData.rawLinkTags.join('\n');
    } else {
      DOM.detectedTagsCode.textContent = 'No favicon link tags found in page HTML source.';
    }

    // 5. Generate action recommendations list
    var recommendations = [];
    var isHealthy = true;

    if (!reportData.icoHref) {
      recommendations.push('<strong>Add favicon.ico to your root:</strong> Upload a standard 16×16/32×32 `favicon.ico` image to your root folder so web crawlers and legacy browsers can discover it.');
      isHealthy = false;
    }
    if (!reportData.hasAppleTag) {
      recommendations.push('<strong>Add apple-touch-icon:</strong> Configure a `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">` tag to support high-DPI iOS home screens.');
      isHealthy = false;
    }
    if (!reportData.hasManifestTag) {
      recommendations.push('<strong>Implement a Web Manifest:</strong> Add a `site.webmanifest` configuration file referencing 192px and 512px icons for PWA installs on Android Chrome.');
    }

    if (isHealthy) {
      DOM.summaryIcon.textContent = '✅';
      DOM.summaryText.textContent = 'Healthy';
      DOM.summaryText.style.color = 'var(--accent-secondary)';
      DOM.summaryDetails.textContent = 'Your favicon configurations look excellent! All primary browser and mobile interfaces are supported.';
      recommendations.push('<strong>Perfect Setup:</strong> No actions required. Your site supports high-resolution displays and mobile devices properly.');
    } else {
      DOM.summaryIcon.textContent = '⚠️';
      DOM.summaryText.textContent = 'Action Required';
      DOM.summaryText.style.color = 'var(--accent-tertiary)';
      DOM.summaryDetails.textContent = 'We detected missing assets or layout tags. Follow the recommendations below to resolve setup compatibility warnings.';
    }

    recommendations.forEach(function (rec) {
      var li = document.createElement('li');
      li.innerHTML = rec;
      DOM.recommendationsList.appendChild(li);
    });
  }

  function showFailureSummary() {
    DOM.report.classList.remove('hidden');
    DOM.summaryIcon.textContent = '❌';
    DOM.summaryText.textContent = 'Audit Failed';
    DOM.summaryText.style.color = '#ef4444';
    DOM.summaryDetails.textContent = 'We could not fetch or analyze the target URL. Ensure the domain is correct, the site is active, and is not blocking public crawlers.';

    DOM.statusIcoText.textContent = 'Unknown';
    DOM.statusAppleText.textContent = 'Unknown';
    DOM.statusManifestText.textContent = 'Unknown';
    
    var li = document.createElement('li');
    li.innerHTML = '<strong>Connection Error:</strong> Make sure the URL you typed is correct and that the website allows crawlers to read its meta headers.';
    DOM.recommendationsList.appendChild(li);
  }

  // Helper: extract base URL domain
  function stateUrlBase() {
    try {
      var u = new URL(reportData.url);
      return u.origin;
    } catch (e) {
      return reportData.url;
    }
  }

  // Helper: Resolve relative URL with a base URL path
  function resolveUrl(base, relative) {
    try {
      return new URL(relative, base).href;
    } catch (e) {
      return relative;
    }
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  function showToast(message, type) {
    if (window.showToastNotification) {
      window.showToastNotification(message, type);
    } else {
      alert(type.toUpperCase() + ': ' + message);
    }
  }
})();
