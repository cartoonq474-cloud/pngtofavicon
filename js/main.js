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

      // Inject banner HTML
      const banner = document.createElement('div');
      banner.id = 'cookie-consent';
      banner.className = 'glass-card cookie-banner';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', 'Cookie consent');
      banner.innerHTML =
        '<div class="cookie-banner__inner" style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:1.5rem; flex-wrap:wrap;">' +
          '<p class="cookie-banner__text" style="color:var(--text-primary); margin:0; font-size:0.95rem; line-height:1.5;">' +
            '🍪 We use cookies to improve your experience and analyze site traffic. ' +
            'By continuing, you agree to our ' +
            '<a href="/privacy/" style="color:var(--accent-secondary); text-decoration:underline; font-weight:500;">Privacy Policy</a>.' +
          '</p>' +
          '<div class="cookie-banner__actions" style="display:flex; gap:0.75rem;">' +
            '<button class="btn btn-outline" id="cookie-decline" style="padding:0.5rem 1.25rem; font-size:0.875rem;">Decline</button>' +
            '<button class="btn btn-primary" id="cookie-accept" style="padding:0.5rem 1.25rem; font-size:0.875rem;">Accept</button>' +
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

        navigator.clipboard
          .writeText(text)
          .then(function () {
            btn.textContent = '✓ Copied!';
            btn.classList.add('copied');
            setTimeout(function () {
              btn.textContent = originalText;
              btn.classList.remove('copied');
            }, 2000);
          })
          .catch(function () {
            // Fallback for older browsers
            fallbackCopy(text);
            btn.textContent = '✓ Copied!';
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
