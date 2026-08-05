/**
 * main.js — Shared functionality for pngtofavicon.com
 * Handles: mobile nav, cookie consent, clipboard, FAQ accordion,
 *          scroll animations, active nav highlight, smooth scroll.
 */

(function () {
  'use strict';

  // Polyfill for NodeList.prototype.forEach
  if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }

  // =========================================================================
  // 1. Mobile Navigation Toggle
  // =========================================================================

  function initMobileNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelectorAll('.nav-links a');

    if (!navToggle) return;

    // Toggle menu open/close
    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      document.body.classList.toggle('nav-open');
      // Update ARIA attribute for accessibility
      const isOpen = document.body.classList.contains('nav-open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking a nav link
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (
        document.body.classList.contains('nav-open') &&
        !e.target.closest('.nav-links') &&
        !e.target.closest('.nav-toggle')
      ) {
        document.body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close menu on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  // =========================================================================
  // 2. Cookie Consent Banner
  // =========================================================================

  function initCookieConsent() {
    try {
      // Skip if user already responded
      if (localStorage.getItem('cookieConsent')) return;

      const currentLang = document.documentElement.lang || 'en';
      var ariaLabel = 'Cookie consent';
      var text = '🍪 We use cookies to improve your experience and analyze site traffic. ' +
                 'By continuing, you agree to our ' +
                 '<a href="/privacy/" style="color:var(--accent-secondary); text-decoration:underline; font-weight:500;">Privacy Policy</a>.';
      var decline = 'Decline';
      var accept = 'Accept';

      if (currentLang === 'pt') {
        ariaLabel = 'Consentimento de cookies';
        text = '🍪 Utilizamos cookies para melhorar a sua experiência e analisar o tráfego do site. ' +
               'Ao continuar, você concorda com a nossa ' +
               '<a href="/pt/privacy/" style="color:var(--accent-secondary); text-decoration:underline; font-weight:500;">Política de Privacidade</a>.';
        decline = 'Recusar';
        accept = 'Aceitar';
      } else if (currentLang === 'es') {
        ariaLabel = 'Consentimiento de cookies';
        text = '🍪 Utilizamos cookies para mejorar su experiencia y analizar el tráfico del sitio. ' +
               'Al continuar, acepta nuestra ' +
               '<a href="/es/privacy/" style="color:var(--accent-secondary); text-decoration:underline; font-weight:500;">Política de Privacidad</a>.';
        decline = 'Rechazar';
        accept = 'Aceptar';
      } else if (currentLang === 'fr') {
        ariaLabel = 'Consentement aux cookies';
        text = '🍪 Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic du site. ' +
               'En continuant, vous acceptez notre ' +
               '<a href="/fr/privacy/" style="color:var(--accent-secondary); text-decoration:underline; font-weight:500;">Politique de Confidentialité</a>.';
        decline = 'Refuser';
        accept = 'Accepter';
      } else if (currentLang === 'de') {
        ariaLabel = 'Cookie-Einwilligung';
        text = '🍪 Wir verwenden Cookies, um Ihre Erfahrung zu verbessern und den Website-Traffic zu analysieren. ' +
               'Durch die Fortsetzung stimmen Sie unserer ' +
               '<a href="/de/privacy/" style="color:var(--accent-secondary); text-decoration:underline; font-weight:500;">Datenschutzerklärung</a> zu.';
        decline = 'Ablehnen';
        accept = 'Akzeptieren';
      } else if (currentLang === 'id') {
        ariaLabel = 'Persetujuan cookie';
        text = '🍪 Kami menggunakan cookie untuk meningkatkan pengalaman Anda dan menganalisis lalu lintas situs. ' +
               'Dengan melanjutkan, Anda menyetujui <a href="/id/privacy/" style="color:var(--accent-secondary); text-decoration:underline; font-weight:500;">Kebijakan Privasi</a> kami.';
        decline = 'Tolak';
        accept = 'Setuju';
      } else if (currentLang === 'hi') {
        ariaLabel = 'कुकी सहमति';
        text = '🍪 हम आपके अनुभव को बेहतर बनाने और साइट ट्रैफ़िक का विश्लेषण करने के लिए कुकीज़ का उपयोग करते हैं। ' +
               'जारी रखकर, आप हमारी <a href="/hi/privacy/" style="color:var(--accent-secondary); text-decoration:underline; font-weight:500;">गोpनीयता नीति</a> से सहमत होते हैं।';
        decline = 'अस्वीकार करें';
        accept = 'स्वीकार करें';
      } else if (currentLang === 'tr') {
        ariaLabel = 'Çerez onayı';
        text = '🍪 Deneyiminizi geliştirmek ve site trafiğini analiz etmek için çerezler kullanıyoruz. ' +
               'Devam ederek, <a href="/tr/privacy/" style="color:var(--accent-secondary); text-decoration:underline; font-weight:500;">Gizlilik Politikamızı</a> kabul etmiş olursunuz.';
        decline = 'Reddet';
        accept = 'Kabul Et';
      } else if (currentLang === 'ur') {
        ariaLabel = 'کوکی کی رضامندی';
        text = '🍪 ہم آپ کے تجربے کو بہتر بنانے اور سائٹ ٹریفک کا تجزیہ کرنے کے لیے کوکیز کا استعمال کرتے ہیں۔ ' +
               'جاری رکھ کر، آپ ہماری <a href="/ur/privacy/" style="color:var(--accent-secondary); text-decoration:underline; font-weight:500;">رازداری کی پالیسی</a> سے اتفاق کرتے ہیں۔';
        decline = 'مسترد کریں';
        accept = 'قبول کریں';
      } else if (currentLang === 'ar') {
        ariaLabel = 'موافقة الكوكيز';
        text = '🍪 نحن نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل حركة مرور الموقع. ' +
               'من خلال الاستمرار، فإنك توافق على <a href="/ar/privacy/" style="color:var(--accent-secondary); text-decoration:underline; font-weight:500;">سياسة الخصوصية</a> الخاصة بنا.';
        decline = 'رفض';
        accept = 'قبول';
      }

      // Inject banner HTML
      const banner = document.createElement('div');
      banner.id = 'cookie-consent';
      banner.className = 'glass-card cookie-banner';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', ariaLabel);
      banner.innerHTML =
        '<div class="cookie-banner__inner" style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:1.5rem; flex-wrap:wrap;">' +
          '<p class="cookie-banner__text" style="color:var(--text-primary); margin:0; font-size:0.95rem; line-height:1.5;">' +
            text +
          '</p>' +
          '<div class="cookie-banner__actions" style="display:flex; gap:0.75rem;">' +
            '<button class="btn btn-outline" id="cookie-decline" style="padding:0.5rem 1.25rem; font-size:0.875rem;">' + decline + '</button>' +
            '<button class="btn btn-primary" id="cookie-accept" style="padding:0.5rem 1.25rem; font-size:0.875rem;">' + accept + '</button>' +
          '</div>' +
        '</div>';

      // Apply floating glass card styling
      Object.assign(banner.style, {
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%) translateY(150%)',
        zIndex: '9999',
        width: 'calc(100% - 3rem)',
        maxWidth: '800px',
        padding: '1.25rem',
        border: '1px solid var(--border-card)',
        opacity: '0',
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease'
      });

      document.body.appendChild(banner);

      // Slide up animation
      requestAnimationFrame(function () {
        setTimeout(function () {
          banner.style.transform = 'translateX(-50%) translateY(0)';
          banner.style.opacity = '1';
        }, 1000); // Delay appearance
      });

      // Dismiss function
      function dismissBanner(el) {
        el.style.transform = 'translateX(-50%) translateY(150%)';
        el.style.opacity = '0';
        setTimeout(function () {
          el.remove();
        }, 600);
      }

      // Accept handler
      document.getElementById('cookie-accept').addEventListener('click', function () {
        try { localStorage.setItem('cookieConsent', 'accepted'); } catch(e) {}
        dismissBanner(banner);
      });

      // Decline handler
      document.getElementById('cookie-decline').addEventListener('click', function () {
        try { localStorage.setItem('cookieConsent', 'declined'); } catch(e) {}
        dismissBanner(banner);
      });
    } catch (e) {
      console.warn("Cookie consent blocked by browser settings");
    }
  }

  // =========================================================================
  // 3. Copy to Clipboard
  // =========================================================================

  function initCopyButtons() {
    const copyButtons = document.querySelectorAll('[data-copy]');

    copyButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Find the nearest .code-block's <code> element
        var target = btn.getAttribute('data-copy');
        var codeEl;

        if (target) {
          // Try ID first, then selector query
          codeEl = document.getElementById(target) || document.querySelector(target);
        }

        // Fallback: look for sibling / parent .code-block code
        if (!codeEl) {
          var parent = btn.closest('.code-block') || btn.parentElement;
          codeEl = parent ? parent.querySelector('code') : null;
        }

        if (!codeEl) return;

        var text = codeEl.textContent;
        var originalText = btn.textContent;

        var copiedText = '✓ Copied!';
        var currentLang = document.documentElement.lang || 'en';
        if (currentLang === 'pt') copiedText = '✓ Copiado!';
        else if (currentLang === 'es') copiedText = '✓ ¡Copiado!';
        else if (currentLang === 'fr') copiedText = '✓ Copié !';
        else if (currentLang === 'de') copiedText = '✓ Kopiert!';
        else if (currentLang === 'id') copiedText = '✓ Disalin!';
        else if (currentLang === 'hi') copiedText = '✓ कॉपी किया गया!';
        else if (currentLang === 'tr') copiedText = '✓ Kopyalandı!';
        else if (currentLang === 'ur') copiedText = '✓ کاپی ہو گیا!';
        else if (currentLang === 'ar') copiedText = '✓ تم النسخ!';

        navigator.clipboard
          .writeText(text)
          .then(function () {
            btn.textContent = copiedText;
            btn.classList.add('copied');
            setTimeout(function () {
              btn.textContent = originalText;
              btn.classList.remove('copied');
            }, 2000);
          })
          .catch(function () {
            // Fallback for older browsers
            fallbackCopy(text);
            btn.textContent = copiedText;
            btn.classList.add('copied');
            setTimeout(function () {
              btn.textContent = originalText;
              btn.classList.remove('copied');
            }, 2000);
          });
      });
    });
  }

  /**
   * Fallback clipboard copy using a temporary textarea.
   * @param {string} text
   */
  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (_) {
      /* silent fail */
    }
    document.body.removeChild(textarea);
  }

  // =========================================================================
  // 4. FAQ Accordion (smooth animation for <details>/<summary>)
  // =========================================================================

  function initFAQAccordion() {
    var detailsElements = document.querySelectorAll('details.faq-item, details[data-accordion]');

    for (var i = 0; i < detailsElements.length; i++) {
      var details = detailsElements[i];
      var summary = details.querySelector('summary');
      var content = details.querySelector('.faq-answer') || details.querySelector('p');

      if (!summary || !content) continue;

      // Wrap content for animation if not already wrapped
      var wrapper;
      if (content.parentElement !== details) {
        wrapper = content.parentElement;
      } else {
        wrapper = document.createElement('div');
        wrapper.className = 'faq-content-wrapper';
        // Move all children except summary into wrapper
        var childrenToMove = [];
        for (var j = 0; j < details.children.length; j++) {
          if (details.children[j] !== summary) {
            childrenToMove.push(details.children[j]);
          }
        }
        for (var k = 0; k < childrenToMove.length; k++) {
          wrapper.appendChild(childrenToMove[k]);
        }
        details.appendChild(wrapper);
      }

      // Override default toggle for smooth animation
      (function(details, summary, wrapper) {
        summary.addEventListener('click', function (e) {
          e.preventDefault();

          if (details.open) {
            // Closing animation
            var currentHeight = wrapper.scrollHeight;
            wrapper.style.overflow = 'hidden';
            wrapper.style.maxHeight = currentHeight + 'px';
            wrapper.style.opacity = '1';
            
            // Force layout reflow
            wrapper.offsetHeight;

            wrapper.style.transition = 'max-height 0.3s ease-out, opacity 0.3s ease-out';
            wrapper.style.maxHeight = '0';
            wrapper.style.opacity = '0';

            setTimeout(function () {
              details.open = false;
              wrapper.style.maxHeight = '';
              wrapper.style.opacity = '';
              wrapper.style.transition = '';
              wrapper.style.overflow = '';
            }, 300);
          } else {
            // Opening animation
            details.open = true;
            var fullHeight = wrapper.scrollHeight;
            
            wrapper.style.overflow = 'hidden';
            wrapper.style.maxHeight = '0';
            wrapper.style.opacity = '0';
            
            // Force layout reflow
            wrapper.offsetHeight;

            wrapper.style.transition = 'max-height 0.3s ease-out, opacity 0.3s ease-out';
            wrapper.style.maxHeight = fullHeight + 'px';
            wrapper.style.opacity = '1';

            setTimeout(function () {
              wrapper.style.maxHeight = '';
              wrapper.style.opacity = '';
              wrapper.style.transition = '';
              wrapper.style.overflow = '';
            }, 300);
          }
        });
      })(details, summary, wrapper);
    }
  }

  // =========================================================================
  // 5. Scroll-triggered Animations
  // =========================================================================

  function initScrollAnimations() {
    var targets = document.querySelectorAll('.animate-on-scroll');

    if (!targets.length || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
            observer.unobserve(entry.target); // Animate only once
          }
        });
      },
      { threshold: 0.1 }
    );

    targets.forEach(function (target) {
      observer.observe(target);
    });
  }

  // =========================================================================
  // 6. Active Nav Link Highlight
  // =========================================================================

  function initActiveNavLink() {
    var currentPath = window.location.pathname;
    // Normalise: strip trailing slash, treat "/" and "/index.html" the same
    var normalised = currentPath.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';

    var navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var linkPath = href.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';

      if (linkPath === normalised) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  // =========================================================================
  // 7. Smooth Scroll for Anchor Links
  // =========================================================================

  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      var targetId = anchor.getAttribute('href');
      if (targetId === '#' || targetId.length < 2) return;

      var targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Update URL hash without jumping
      if (history.pushState) {
        history.pushState(null, null, targetId);
      }
    });
  }

  // =========================================================================
  // 8. FAQ Tabs Switcher
  // =========================================================================

  function initFAQTabs() {
    var tabs = document.querySelectorAll('.faq-tab-btn');
    var groups = document.querySelectorAll('.faq-group');

    if (tabs.length === 0) return;

    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        var clickedTab = this;
        for (var j = 0; j < tabs.length; j++) {
          if (tabs[j].classList) tabs[j].classList.remove('active');
        }
        if (clickedTab.classList) clickedTab.classList.add('active');

        var targetGroup = clickedTab.getAttribute('data-tab');

        for (var k = 0; k < groups.length; k++) {
          var group = groups[k];
          group.style.display = 'none';
          if (group.classList) group.classList.remove('active');
          var details = group.querySelectorAll('details.faq-item');
          for (var l = 0; l < details.length; l++) {
            var d = details[l];
            d.open = false;
            var w = d.querySelector('.faq-content-wrapper');
            if (w) w.style.maxHeight = '';
          }
        }

        var groupEl = document.getElementById('faq-' + targetGroup);
        if (groupEl) {
          groupEl.style.display = 'flex';
          groupEl.offsetHeight; // Force reflow
          if (groupEl.classList) groupEl.classList.add('active');
        }
      });
    }
  }

  // =========================================================================
  // 9. Testimonial Tabs Switcher
  // =========================================================================

  function initTestimonialTabs() {
    var tabs = document.querySelectorAll('.testimonial-tab');
    var groups = document.querySelectorAll('.reviews-group');

    if (tabs.length === 0) return;

    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        // Remove active class from all tabs
        for (var j = 0; j < tabs.length; j++) {
          if (tabs[j].classList) tabs[j].classList.remove('active');
        }
        // Add active class to clicked tab
        if (this.classList) this.classList.add('active');

        var targetGroup = this.getAttribute('data-target');

        // Hide all groups
        for (var k = 0; k < groups.length; k++) {
          var group = groups[k];
          group.style.display = 'none';
          if (group.classList) group.classList.remove('active');
        }

        // Show target group
        var groupEl = document.getElementById(targetGroup);
        if (groupEl) {
          groupEl.style.display = 'grid';
          groupEl.offsetHeight; // Force reflow
          if (groupEl.classList) groupEl.classList.add('active');
        }
      });
    }
  }

  // =========================================================================
  // 10. Language Dropdown Toggle
  // =========================================================================

  function initLangDropdown() {
    const trigger = document.querySelector('.lang-dropdown-trigger');
    const dropdown = document.querySelector('.lang-dropdown');

    if (!trigger || !dropdown) return;

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        dropdown.classList.remove('active');
      }
    });
  }

  // =========================================================================
  // =========================================================================
  // 11. Toast Notifications Utility
  // =========================================================================

  function showToastNotification(message, type) {
    type = type || 'info';

    // Localize message if language is not English
    var currentLang = document.documentElement.lang || 'en';
    if (currentLang === 'pt') {
      var ptMsgs = {
        'Please upload a valid image (PNG, JPG, SVG, WebP, or GIF).': 'Por favor, envie uma imagem válida (PNG, JPG, SVG, WebP ou GIF).',
        'File is too large. Maximum size is 5 MB.': 'O arquivo é muito grande. O tamanho máximo é 5 MB.',
        'Failed to read the file. Please try again.': 'Falha ao ler o arquivo. Por favor, tente novamente.',
        'Could not decode image. The file may be corrupted.': 'Não foi possível decodificar a imagem. O arquivo pode estar corrompido.',
        'JSZip library failed to load. Please refresh and try again.': 'Falha ao carregar a biblioteca JSZip. Por favor, atualize a página e tente novamente.',
        'Please upload an image first.': 'Por favor, envie uma imagem primeiro.',
        'Favicon package downloaded!': 'Pacote de favicon baixado!',
        'Download failed.': 'O download falhou.',
        'Something went wrong during generation.': 'Algo deu errado durante a geração.',
        'favicon.ico downloaded!': 'favicon.ico baixado!',
        'Failed to generate ICO file.': 'Falha ao gerar o arquivo ICO.',
        'Code copied!': 'Código copiado!',
        'Downloading components... JSZip is missing. Please reload the page.': 'Baixando componentes... O JSZip não foi encontrado. Por favor, recarregue a página.',
        'Favicon pack downloaded successfully!': 'Pacote de favicon baixado com sucesso!',
        'Error generating files. Please try again.': 'Erro ao gerar os arquivos. Por favor, tente novamente.'
      };
      if (ptMsgs[message]) message = ptMsgs[message];
      else if (message.indexOf('Failed to generate ZIP:') === 0) message = 'Falha ao gerar o ZIP: ' + message.substring('Failed to generate ZIP:'.length);
    } else if (currentLang === 'es') {
      var esMsgs = {
        'Please upload a valid image (PNG, JPG, SVG, WebP, or GIF).': 'Por favor, suba una imagen válida (PNG, JPG, SVG, WebP o GIF).',
        'File is too large. Maximum size is 5 MB.': 'El archivo es demasiado grande. El tamaño máximo es 5 MB.',
        'Failed to read the file. Please try again.': 'No se pudo leer el archivo. Por favor, inténtelo de nuevo.',
        'Could not decode image. The file may be corrupted.': 'No se pudo decodificar la imagen. El archivo puede estar dañado.',
        'JSZip library failed to load. Please refresh and try again.': 'La biblioteca JSZip no se pudo cargar. Por favor, recargue e inténtelo de nuevo.',
        'Please upload an image first.': 'Por favor, suba una imagen primero.',
        'Favicon package downloaded!': '¡Paquete de favicon descargado!',
        'Download failed.': 'La descarga falló.',
        'Something went wrong during generation.': 'Algo salió mal durante la generación.',
        'favicon.ico downloaded!': '¡favicon.ico descargado!',
        'Failed to generate ICO file.': 'No se pudo generar el archivo ICO.',
        'Code copied!': '¡Código copiado!',
        'Downloading components... JSZip is missing. Please reload the page.': 'Descargando componentes... JSZip no se encuentra. Por favor, recargue la página.',
        'Favicon pack downloaded successfully!': '¡Paquete de favicon descargado con éxito!',
        'Error generating files. Please try again.': 'Error al generar los archivos. Por favor, inténtelo de nuevo.'
      };
      if (esMsgs[message]) message = esMsgs[message];
      else if (message.indexOf('Failed to generate ZIP:') === 0) message = 'Error al generar ZIP: ' + message.substring('Failed to generate ZIP:'.length);
    } else if (currentLang === 'fr') {
      var frMsgs = {
        'Please upload a valid image (PNG, JPG, SVG, WebP, or GIF).': 'Veuillez télécharger une image valide (PNG, JPG, SVG, WebP ou GIF).',
        'File is too large. Maximum size is 5 MB.': 'Le fichier est trop volumineux. La taille maximale est de 5 Mo.',
        'Failed to read the file. Please try again.': 'Impossible de lire le fichier. Veuillez réessayer.',
        'Could not decode image. The file may be corrupted.': 'Impossible de décoder l\'image. Le fichier est peut-être corrompu.',
        'JSZip library failed to load. Please refresh and try again.': 'Le chargement de la bibliothèque JSZip a échoué. Veuillez rafraîchir et réessayer.',
        'Please upload an image first.': 'Veuillez d\'abord télécharger une image.',
        'Favicon package downloaded!': 'Pack de favicons téléchargé !',
        'Download failed.': 'Le téléchargement a échoué.',
        'Something went wrong during generation.': 'Une erreur est survenue lors de la génération.',
        'favicon.ico downloaded!': 'favicon.ico téléchargé !',
        'Failed to generate ICO file.': 'Échec de la génération du fichier ICO.',
        'Code copied!': 'Code copié !',
        'Downloading components... JSZip is missing. Please reload the page.': 'Téléchargement des composants... JSZip est manquant. Veuillez recharger la page.',
        'Favicon pack downloaded successfully!': 'Pack de favicons téléchargé avec succès !',
        'Error generating files. Please try again.': 'Erreur lors de la génération des fichiers. Veuillez réessayer.'
      };
      if (frMsgs[message]) message = frMsgs[message];
      else if (message.indexOf('Failed to generate ZIP:') === 0) message = 'Échec de la génération du ZIP : ' + message.substring('Failed to generate ZIP:'.length);
    }

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

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.showToastNotification = showToastNotification;

  // Initialise everything on DOMContentLoaded
  // =========================================================================

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initCookieConsent();
    initCopyButtons();
    initFAQAccordion();
    initLangDropdown();
    initFAQTabs();
    initTestimonialTabs();
    initScrollAnimations();
    initActiveNavLink();
    initSmoothScroll();
  });
})();
