/**
 * checker-validator.js — Favicon Auditor
 * Audits favicon installations via client-side CORS proxies.
 */
(function () {
  'use strict';

  var currentLang = document.documentElement.lang || 'en';
  var translations = {
    es: {
      'Auditing...': 'Auditando...',
      'Audit Favicon': 'Auditar Favicon',
      'Could not audit URL. Make sure the site is live and allows crawling.': 'No se pudo auditar la URL. Asegúrese de que el sitio esté activo y permita el rastreo.',
      'No link tags found.': 'No se encontraron etiquetas de enlace.',
      'Found': 'Encontrado',
      'Location': 'Ubicación',
      'Missing': 'Faltante',
      'No fallback icon found in HTML head markup or root server.': 'No se encontró ningún icono de respaldo en el marcado head HTML ni en el servidor raíz.',
      'iOS home screen icon not configured in head meta.': 'El icono de la pantalla de inicio de iOS no está configurado en las meta del head.',
      'PWA installation metadata manifest is not configured.': 'El manifiesto de metadatos de instalación de PWA no está configurado.',
      'No favicon link tags found in page HTML source.': 'No se encontraron etiquetas de enlace de favicon en el código fuente HTML de la página.',
      'Add favicon.ico to your root:': 'Añadir favicon.ico a tu raíz:',
      'Upload a standard 16×16/32×32 `favicon.ico` image to your root folder so web crawlers and legacy browsers can discover it.': 'Sube una imagen standard `favicon.ico` de 16×16/32×32 a tu carpeta raíz para que los rastreadores web y los navegadores antiguos puedan descubrirla.',
      'Add apple-touch-icon:': 'Añadir apple-touch-icon:',
      'Configure a `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">` tag to support high-DPI iOS home screens.': 'Configura una etiqueta `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">` para admitir pantallas de inicio de iOS de alta densidad.',
      'Implement a Web Manifest:': 'Implementar un manifiesto web:',
      'Add a `site.webmanifest` configuration file referencing 192px and 512px icons for PWA installs on Android Chrome.': 'Añade un archivo de configuración `site.webmanifest` que haga referencia a iconos de 192px y 512px para instalaciones de PWA en Android Chrome.',
      'Perfect Setup:': 'Configuración perfecta:',
      'No actions required. Your site supports high-resolution displays and mobile devices properly.': 'No se requieren acciones. Su sitio admite correctamente pantallas de alta resolución y dispositivos móviles.',
      'Healthy': 'Correcto',
      'Your favicon configurations look excellent! All primary browser and mobile interfaces are supported.': '¡Tus configuraciones de favicon se ven excelentes! Todas las interfaces principales de navegador y móviles son compatibles.',
      'Action Required': 'Acción requerida',
      'We detected missing assets or layout tags. Follow the recommendations below to resolve setup compatibility warnings.': 'Detectamos elementos faltantes o etiquetas de diseño. Siga las recomendaciones a continuación para resolver las advertencias de compatibilidad de configuración.',
      'Audit Failed': 'Auditoría fallida',
      'We could not fetch or analyze the target URL. Ensure the domain is correct, the site is active, and is not blocking public crawlers.': 'No pudimos obtener ni analizar la URL de destino. Asegúrese de que el dominio sea correcto, el sitio esté activo y no esté bloqueando los rastreadores públicos.',
      'Unknown': 'Desconocido',
      'Connection Error:': 'Error de conexión:',
      'Make sure the URL you typed is correct and that the website allows crawlers to read its meta headers.': 'Asegúrese de que la URL que escribió sea correcta y que el sitio web permita a los rastreadores leer sus encabezados meta.'
    },
    fr: {
      'Auditing...': 'Audit en cours...',
      'Audit Favicon': 'Auditer Favicon',
      'Could not audit URL. Make sure the site is live and allows crawling.': 'Impossible d\'analyser l\'URL. Assurez-vous que le site est en ligne et autorise l\'exploration.',
      'No link tags found.': 'Aucune balise de lien trouvée.',
      'Found': 'Trouvé',
      'Location': 'Emplacement',
      'Missing': 'Manquant',
      'No fallback icon found in HTML head markup or root server.': 'Aucune icône de secours trouvée dans la balise head HTML ou sur le serveur racine.',
      'iOS home screen icon not configured in head meta.': 'Icône d\'écran d\'accueil iOS non configurée dans les métadonnées head.',
      'PWA installation metadata manifest is not configured.': 'Le manifeste des métadonnées d\'installation de la PWA n\'est pas configuré.',
      'No favicon link tags found in page HTML source.': 'Aucune balise de lien de favicon trouvée dans le code source HTML de la page.',
      'Add favicon.ico to your root:': 'Ajouter favicon.ico à votre racine :',
      'Upload a standard 16×16/32×32 `favicon.ico` image to your root folder so web crawlers and legacy browsers can discover it.': 'Téléchargez une image standard `favicon.ico` de 16×16/32×32 dans votre dossier racine afin que les robots d\'exploration et les anciens navigateurs puissent la découvrir.',
      'Add apple-touch-icon:': 'Ajouter apple-touch-icon :',
      'Configure a `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">` tag to support high-DPI iOS home screens.': 'Configurez une balise `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">` pour prendre en charge les écrans d\'accueil iOS haute résolution.',
      'Implement a Web Manifest:': 'Implémenter un manifeste web :',
      'Add a `site.webmanifest` configuration file referencing 192px and 512px icons for PWA installs on Android Chrome.': 'Ajoutez un fichier de configuration `site.webmanifest` référençant des icônes de 192px et 512px pour les installations de PWA sur Android Chrome.',
      'Perfect Setup:': 'Configuration parfaite :',
      'No actions required. Your site supports high-resolution displays and mobile devices properly.': 'Aucune action requise. Votre site prend correctement en charge les écrans haute résolution et les appareils mobiles.',
      'Healthy': 'Sain',
      'Your favicon configurations look excellent! All primary browser and mobile interfaces are supported.': 'Vos configurations de favicon semblent excellentes ! Toutes les interfaces principales de navigateur et de mobile sont prises en charge.',
      'Action Required': 'Action requise',
      'We detected missing assets or layout tags. Follow the recommendations below to resolve setup compatibility warnings.': 'Nous avons détecté des ressources manquantes ou des balises de mise en page. Suivez les recommandations ci-dessous pour résoudre les avertissements de compatibilité.',
      'Audit Failed': 'Échec de l\'audit',
      'We could not fetch or analyze the target URL. Ensure the domain is correct, the site is active, and is not blocking public crawlers.': 'Nous n\'avons pas pu récupérer ou analyser l\'URL cible. Assurez-vous que le domaine est correct, que le site est actif et qu\'il ne bloque pas les robots d\'exploration.',
      'Unknown': 'Inconnu',
      'Connection Error:': 'Erreur de connexion :',
      'Make sure the URL you typed is correct and that the website allows crawlers to read its meta headers.': 'Assurez-vous que l\'URL saisie est correcte et que le site web autorise les robots à lire ses en-têtes méta.'
    }
  };

  function t(str) {
    if (translations[currentLang] && translations[currentLang][str]) {
      return translations[currentLang][str];
    }
    return str;
  }

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
      showToast(t('Could not audit URL. Make sure the site is live and allows crawling.'), 'error');
      showFailureSummary();
    } finally {
      setLoading(false);
    }
  }

  function resetReport() {
    DOM.report.classList.add('hidden');
    DOM.previewIco.style.display = 'none';
    DOM.previewApple.style.display = 'none';
    DOM.detectedTagsCode.textContent = t('No link tags found.');
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
      DOM.auditBtn.textContent = t('Auditing...');
      DOM.loader.classList.remove('hidden');
    } else {
      DOM.auditBtn.removeAttribute('disabled');
      DOM.auditBtn.textContent = t('Audit Favicon');
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
      DOM.statusIcoText.innerHTML = '✅ <strong>' + t('Found') + '</strong><br>' + t('Location') + ': <span style="font-family: monospace; font-size: 0.75rem; word-break: break-all;">' + escapeHTML(reportData.icoHref) + '</span>';
      var imgIco = DOM.previewIco.querySelector('img');
      imgIco.src = reportData.icoHref;
      DOM.previewIco.style.display = 'block';
    } else {
      DOM.statusIcoText.innerHTML = '⚠️ <strong>' + t('Missing') + '</strong><br>' + t('No fallback icon found in HTML head markup or root server.');
    }

    // 2. Update apple-touch-icon status
    if (reportData.appleHref) {
      DOM.statusAppleText.innerHTML = '✅ <strong>' + t('Found') + '</strong><br>' + t('Location') + ': <span style="font-family: monospace; font-size: 0.75rem; word-break: break-all;">' + escapeHTML(reportData.appleHref) + '</span>';
      var imgApple = DOM.previewApple.querySelector('img');
      imgApple.src = reportData.appleHref;
      DOM.previewApple.style.display = 'block';
    } else {
      DOM.statusAppleText.innerHTML = '❌ <strong>' + t('Missing') + '</strong><br>' + t('iOS home screen icon not configured in head meta.');
    }

    // 3. Update manifest status
    if (reportData.hasManifestTag) {
      DOM.statusManifestText.innerHTML = '✅ <strong>' + t('Found') + '</strong><br>' + t('Location') + ': <span style="font-family: monospace; font-size: 0.75rem; word-break: break-all;">' + escapeHTML(reportData.manifestHref) + '</span>';
    } else {
      DOM.statusManifestText.innerHTML = '⚠️ <strong>' + t('Missing') + '</strong><br>' + t('PWA installation metadata manifest is not configured.');
    }

    // 4. Detected tags markup
    if (reportData.rawLinkTags.length > 0) {
      DOM.detectedTagsCode.textContent = reportData.rawLinkTags.join('\n');
    } else {
      DOM.detectedTagsCode.textContent = t('No favicon link tags found in page HTML source.');
    }

    // 5. Generate action recommendations list
    var recommendations = [];
    var isHealthy = true;

    if (!reportData.icoHref) {
      recommendations.push('<strong>' + t('Add favicon.ico to your root:') + '</strong> ' + t('Upload a standard 16×16/32×32 `favicon.ico` image to your root folder so web crawlers and legacy browsers can discover it.'));
      isHealthy = false;
    }
    if (!reportData.hasAppleTag) {
      recommendations.push('<strong>' + t('Add apple-touch-icon:') + '</strong> ' + t('Configure a `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">` tag to support high-DPI iOS home screens.'));
      isHealthy = false;
    }
    if (!reportData.hasManifestTag) {
      recommendations.push('<strong>' + t('Implement a Web Manifest:') + '</strong> ' + t('Add a `site.webmanifest` configuration file referencing 192px and 512px icons for PWA installs on Android Chrome.'));
    }

    if (isHealthy) {
      DOM.summaryIcon.textContent = '✅';
      DOM.summaryText.textContent = t('Healthy');
      DOM.summaryText.style.color = 'var(--accent-secondary)';
      DOM.summaryDetails.textContent = t('Your favicon configurations look excellent! All primary browser and mobile interfaces are supported.');
      recommendations.push('<strong>' + t('Perfect Setup:') + '</strong> ' + t('No actions required. Your site supports high-resolution displays and mobile devices properly.'));
    } else {
      DOM.summaryIcon.textContent = '⚠️';
      DOM.summaryText.textContent = t('Action Required');
      DOM.summaryText.style.color = 'var(--accent-tertiary)';
      DOM.summaryDetails.textContent = t('We detected missing assets or layout tags. Follow the recommendations below to resolve setup compatibility warnings.');
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
    DOM.summaryText.textContent = t('Audit Failed');
    DOM.summaryText.style.color = '#ef4444';
    DOM.summaryDetails.textContent = t('We could not fetch or analyze the target URL. Ensure the domain is correct, the site is active, and is not blocking public crawlers.');

    DOM.statusIcoText.textContent = t('Unknown');
    DOM.statusAppleText.textContent = t('Unknown');
    DOM.statusManifestText.textContent = t('Unknown');
    
    var li = document.createElement('li');
    li.innerHTML = '<strong>' + t('Connection Error:') + '</strong> ' + t('Make sure the URL you typed is correct and that the website allows crawlers to read its meta headers.');
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
