const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const languages = ['ar', 'de', 'es', 'fr', 'hi', 'id', 'pt', 'tr', 'ur'];

const languageNames = {
    en: { name: 'English', flagCode: 'us' },
    ar: { name: 'العربية', flagCode: 'sa' },
    de: { name: 'Deutsch', flagCode: 'de' },
    es: { name: 'Español', flagCode: 'es' },
    fr: { name: 'Français', flagCode: 'fr' },
    hi: { name: 'हिन्दी', flagCode: 'in' },
    id: { name: 'Bahasa Indonesia', flagCode: 'id' },
    pt: { name: 'Português', flagCode: 'pt' },
    tr: { name: 'Türkçe', flagCode: 'tr' },
    ur: { name: 'اردو', flagCode: 'pk' }
};

// Load existing translations
let existingTranslations = {};
try {
    const scriptContent = fs.readFileSync(path.join(__dirname, 'translate_all_languages.js'), 'utf8');
    const match = scriptContent.match(/const translations = ({[\s\S]+?});/);
    if (match) {
        existingTranslations = eval(`(${match[1]})`);
    }
} catch (e) {
    console.error("Could not load existing translations", e);
}

const getFilesToLocalize = (dir, baseDir = '') => {
    let results = [];
    const list = fs.readdirSync(dir);
    
    for (const file of list) {
        const filePath = path.join(dir, file);
        const relativePath = path.join(baseDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory()) {
            if (['node_modules', 'images', 'js', 'css', 'locales', '.git', 'sitemap'].includes(file) && baseDir === '') continue;
            if (languages.includes(file) && baseDir === '') continue;
            
            results = results.concat(getFilesToLocalize(filePath, relativePath));
        } else {
            if (file.endsWith('.html')) {
                results.push(relativePath);
            }
        }
    }
    
    return results;
};

// Check if a URL is relative (e.g. stylesheet or script path)
const isRelativeUrl = (url) => {
    if (!url) return false;
    if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//') || url.startsWith('data:') || url.startsWith('javascript:')) {
        return false;
    }
    return true;
};

const isTranslatable = (node) => {
    if (node.parentElement && ['CODE', 'PRE', 'SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT'].includes(node.parentElement.tagName)) return false;
    return true;
};

// Fix the English source files first to make sure they don't have "undefined" URLs on disk
function fixEnglishSourceFiles(files) {
    console.log("--- Fixing 'undefined' metadata in English source files ---");
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        let html = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Simple string replacements for metadata
        const fileUrlPath = file.replace(/\\/g, '/').replace('index.html', '');
        const correctUrl = `https://pngtofavicon.com/${fileUrlPath}`;
        
        if (html.includes('href="undefined"')) {
            html = html.replace(/href="undefined"/g, `href="${correctUrl}"`);
            modified = true;
        }
        if (html.includes('content="undefined"')) {
            html = html.replace(/content="undefined"/g, `content="${correctUrl}"`);
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(filePath, html, 'utf8');
            console.log(`Fixed metadata in: ${file}`);
        }
    });
}

function generateHreflangTags(relativePath, doc) {
    const fileUrlPath = relativePath.replace(/\\/g, '/').replace('index.html', '');
    
    // Remove existing hreflang tags to avoid duplicates
    const existing = doc.querySelectorAll('link[rel="alternate"][hreflang]');
    existing.forEach(el => el.remove());
    
    // x-default and English
    const xDefault = doc.createElement('link');
    xDefault.setAttribute('rel', 'alternate');
    xDefault.setAttribute('hreflang', 'x-default');
    xDefault.setAttribute('href', `https://pngtofavicon.com/${fileUrlPath}`);
    doc.head.appendChild(xDefault);
    
    const enTag = doc.createElement('link');
    enTag.setAttribute('rel', 'alternate');
    enTag.setAttribute('hreflang', 'en');
    enTag.setAttribute('href', `https://pngtofavicon.com/${fileUrlPath}`);
    doc.head.appendChild(enTag);
    
    // Localized hreflangs
    languages.forEach(lang => {
        const tag = doc.createElement('link');
        tag.setAttribute('rel', 'alternate');
        tag.setAttribute('hreflang', lang);
        tag.setAttribute('href', `https://pngtofavicon.com/${lang}/${fileUrlPath}`);
        doc.head.appendChild(tag);
    });
}

function injectLanguageDropdown(relativePath, doc, targetLang) {
    const navLinks = doc.getElementById('navLinks');
    if (!navLinks) return;
    
    // Remove existing language dropdown wrapper if any
    const existing = navLinks.querySelector('.lang-dropdown-wrapper');
    if (existing) existing.remove();
    
    const wrapper = doc.createElement('li');
    wrapper.className = 'lang-dropdown-wrapper';
    
    const currentInfo = languageNames[targetLang] || { name: 'English', flagCode: 'us' };
    
    let menuItemsHtml = '';
    const fileUrlPath = relativePath.replace(/\\/g, '/').replace('index.html', '');
    
    const allLangs = ['en', ...languages];
    allLangs.forEach(lang => {
        let href = '';
        if (lang === 'en') {
            href = '/' + fileUrlPath;
        } else {
            href = '/' + lang + '/' + fileUrlPath;
        }
        
        const langInfo = languageNames[lang];
        const isActive = lang === targetLang ? 'active' : '';
        menuItemsHtml += `
            <a href="${href}" class="lang-dropdown-item ${isActive}">
                <img src="https://flagcdn.com/w40/${langInfo.flagCode}.png" srcset="https://flagcdn.com/w80/${langInfo.flagCode}.png 2x" width="20" height="20" alt="${langInfo.name} flag" class="flag-icon">
                <span>${langInfo.name}</span>
            </a>
        `;
    });
    
    const langLabel = targetLang === 'ar' ? 'اللغة' : (targetLang === 'hi' ? 'भाषा' : 'Language');

    wrapper.innerHTML = `
        <div class="lang-dropdown">
            <a href="#" class="lang-dropdown-trigger" role="button" aria-haspopup="true" aria-expanded="false" aria-label="Select Language">
                <div class="lang-dropdown-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                    </svg>
                </div>
                <div class="lang-dropdown-label">
                    <span>${langLabel}</span>
                    <span>${currentInfo.name}</span>
                </div>
                <svg class="lang-dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </a>
            <div class="lang-dropdown-menu">
                ${menuItemsHtml}
            </div>
        </div>
    `;
    
    navLinks.appendChild(wrapper);
}

async function localizePage(relativePath, targetLang) {
    const srcPath = path.join(__dirname, relativePath);
    const destPath = path.join(__dirname, targetLang, relativePath);
    
    // Ensure dest directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    const html = fs.readFileSync(srcPath, 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const normPath = relativePath.replace(/\\/g, '/');
    
    // 1. Update lang attribute
    doc.documentElement.setAttribute('lang', targetLang);
    if (['ar', 'ur'].includes(targetLang)) {
        doc.documentElement.setAttribute('dir', 'rtl');
    } else {
        doc.documentElement.removeAttribute('dir');
    }
    
    // 2. Update canonical and OG URLs
    const updateUrl = (url) => {
        if (!url) return url;
        if (url.includes('pngtofavicon.com')) {
            const urlObj = new URL(url);
            if (!languages.some(l => urlObj.pathname.startsWith(`/${l}/`))) {
                urlObj.pathname = `/${targetLang}${urlObj.pathname}`;
            }
            return urlObj.toString();
        }
        return url;
    };
    
    const canonical = doc.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', updateUrl(canonical.getAttribute('href')));
    
    const ogUrl = doc.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', updateUrl(ogUrl.getAttribute('content')));
    
    const twitterUrl = doc.querySelector('meta[property="twitter:url"]');
    if (twitterUrl) twitterUrl.setAttribute('content', updateUrl(twitterUrl.getAttribute('content')));
    
    // 3. Shift relative asset paths (prepend ../ to find root assets)
    // Stylesheets
    doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (isRelativeUrl(href)) {
            link.setAttribute('href', '../' + href);
        }
    });
    
    // Scripts
    doc.querySelectorAll('script[src]').forEach(script => {
        const src = script.getAttribute('src');
        if (isRelativeUrl(src)) {
            script.setAttribute('src', '../' + src);
        }
    });
    
    // Images
    doc.querySelectorAll('img[src]').forEach(img => {
        const src = img.getAttribute('src');
        if (isRelativeUrl(src)) {
            img.setAttribute('src', '../' + src);
        }
    });
    
    // Source tags (e.g. responsive images)
    doc.querySelectorAll('source[srcset]').forEach(source => {
        const srcset = source.getAttribute('srcset');
        if (isRelativeUrl(srcset)) {
            source.setAttribute('srcset', '../' + srcset);
        }
    });

    // 4. Update absolute internal hrefs
    doc.querySelectorAll('a[href]').forEach(link => {
        let href = link.getAttribute('href');
        if (href.startsWith('/') && !href.startsWith('//')) {
            const firstSeg = href.split('/')[1];
            if (!languages.includes(firstSeg)) {
                link.setAttribute('href', `/${targetLang}${href}`);
            }
        }
    });

    // 5. Update language switcher paths in the footer
    const langSelector = doc.getElementById('languageBar');
    if (langSelector) {
        const langLinks = langSelector.querySelectorAll('a.lang-badge');
        let currentAbsPath = relativePath.replace(/\\/g, '/').replace('index.html', '');
        langLinks.forEach(ll => {
            const l = ll.getAttribute('lang');
            if (l === 'en') {
                ll.setAttribute('href', `/${currentAbsPath}`);
            } else {
                ll.setAttribute('href', `/${l}/${currentAbsPath}`);
            }
            if (l === targetLang) {
                ll.classList.add('active');
            } else {
                ll.classList.remove('active');
            }
        });
    }

    // 6. Generate alternate hreflang tags
    generateHreflangTags(relativePath, doc);

    // 7. Inject Language Dropdown in Header Navbar
    injectLanguageDropdown(relativePath, doc, targetLang);

    // 8. Translate UI Elements using static translations dictionary
    const dict = existingTranslations[targetLang] || {};

    // Global translation block for Arabic pages
    if (targetLang === 'ar') {
        // Explore More Favicon Tools Section
        let exploreSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && (h2.textContent.includes('Explore More Favicon Tools') || h2.textContent.includes('استكشف المزيد من أدوات Favicon'))) {
                exploreSec = sec;
            }
        });

        if (exploreSec) {
            const h2 = exploreSec.querySelector('h2.section-title');
            if (h2) h2.textContent = 'استكشف المزيد من أدوات Favicon';

            const subtitle = exploreSec.querySelector('.section-subtitle') || exploreSec.querySelector('p');
            if (subtitle) subtitle.textContent = 'يقدم موقع PNGtoFavicon مجموعة كاملة من الأدوات لتلبية جميع احتياجات أيقونات المواقع الخاصة بك.';

            exploreSec.querySelectorAll('.tool-card').forEach(card => {
                const titleEl = card.querySelector('h3');
                const descEl = card.querySelector('p');
                const linkEl = card.querySelector('.tool-card-link');

                if (titleEl) {
                    const titleText = titleEl.textContent.trim();
                    if (titleText === 'Text to Favicon') {
                        titleEl.textContent = 'النص إلى Favicon';
                        if (descEl) descEl.textContent = 'أنشئ أيقونة Favicon باستخدام النص أو الحروف الأولى لعلامتك التجارية. اختر الخطوط، الألوان، والتنسيقات لإنشاء أيقونة فريدة.';
                        if (linkEl) linkEl.textContent = 'جربه مجاناً ←';
                    } else if (titleText === 'Emoji to Favicon') {
                        titleEl.textContent = 'الرموز التعبيرية إلى Favicon';
                        if (descEl) descEl.textContent = 'اختر من بين مئات الرموز التعبيرية لإنشاء أيقونة favicon ملونة ومعبرة فوراً. مثالي للمشاريع الشخصية، والمدونات، والنماذج السريعة.';
                        if (linkEl) linkEl.textContent = 'جربه مجاناً ←';
                    } else if (titleText === 'Favicon Checker') {
                        titleEl.textContent = 'فاحص الـ Favicon';
                        if (descEl) descEl.textContent = 'تحقق من صحة إعدادات أيقونة موقعك. أدخل أي رابط للتحقق من المقاسات المفقودة، التنسيقات الخاطئة، ومشاكل التوافق عبر المنصات.';
                        if (linkEl) linkEl.textContent = 'افحص الآن ←';
                    }
                }
            });
        }
    }

    // Custom logic for Arabic index.html hero section translation
    if (targetLang === 'ar' && relativePath === 'index.html') {
        // H1
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'محول <span class="gradient-text">PNG إلى Favicon</span> المجاني';
        }

        // Subtitle
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.innerHTML = 'حوّل أي صورة بصيغة <strong>PNG</strong> إلى حزمة <strong>Favicon</strong> متكاملة في لحظات. مجاني، سريع، ويعمل بالكامل داخل متصفحك، لذلك لا تغادر ملفاتك جهازك أبدًا.';
        }

        // Dropzone content
        const dropZone = doc.getElementById('dropZone');
        if (dropZone) {
            dropZone.setAttribute('aria-label', 'منطقة الرفع. اسحب وأفلت صورة PNG هنا أو انقر لتصفح الملفات.');
        }

        const dropZoneContent = doc.getElementById('dropZoneContent');
        if (dropZoneContent) {
            const paragraphs = dropZoneContent.querySelectorAll('p.text');
            if (paragraphs.length >= 3) {
                paragraphs[0].textContent = 'اسحب وأفلت صورة PNG هنا';
                paragraphs[1].innerHTML = 'أو <span class="browse-btn" id="browseBtn">تصفح الملفات</span>';
                paragraphs[2].textContent = 'الصيغ المدعومة: PNG، JPG، SVG، WEBP، GIF (الحد الأقصى: 5 ميجابايت)';
            }
        }

        // Trust badges
        const badgePrivate = doc.getElementById('badge-private');
        if (badgePrivate) badgePrivate.textContent = '🔒 خصوصية تامة 100%';

        const badgeInstant = doc.getElementById('badge-instant');
        if (badgeInstant) badgeInstant.textContent = '⚡ تحويل فوري';

        const badgeSizes = doc.getElementById('badge-sizes');
        if (badgeSizes) badgeSizes.textContent = '📦 جميع الأحجام مضمنة';

        const badgeFree = doc.getElementById('badge-free');
        if (badgeFree) badgeFree.textContent = '💰 مجاني بالكامل';

        // Head SEO metadata
        doc.title = 'محول PNG إلى Favicon المجاني | PNGtoFavicon';
        
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', 'قم بتحويل أي صورة بصيغة PNG إلى حزمة Favicon متكاملة في لحظات. مجاني، سريع، ويعمل بالكامل داخل متصفحك.');
        }
        
        const ogTitle = doc.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', 'محول PNG إلى Favicon المجاني | PNGtoFavicon');

        const ogDesc = doc.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', 'قم بتحويل أي صورة بصيغة PNG إلى حزمة Favicon متكاملة في لحظات. مجاني، سريع، ويعمل بالكامل داخل متصفحك.');

        const twitterTitle = doc.querySelector('meta[property="twitter:title"]');
        if (twitterTitle) twitterTitle.setAttribute('content', 'محول PNG إلى Favicon المجاني | PNGtoFavicon');

        const twitterDesc = doc.querySelector('meta[property="twitter:description"]');
        if (twitterDesc) twitterDesc.setAttribute('content', 'قم بتحويل أي صورة بصيغة PNG إلى حزمة Favicon متكاملة في لحظات. مجاني، سريع، ويعمل بالكامل داخل متصفحك.');

        // Why Choose Section
        const whyChooseTitle = doc.querySelector('h2.section-title');
        if (whyChooseTitle) whyChooseTitle.textContent = 'لماذا تختار PNGtoFavicon.com لإنشاء أيقونات Favicon؟';

        const whyChooseSubtitle = doc.querySelector('p.section-subtitle');
        if (whyChooseSubtitle) whyChooseSubtitle.textContent = 'أقوى أداة مجانية عبر الإنترنت لإنشاء أيقونات Favicon، تُحوّل الصور إلى ملفات متوافقة مع معايير المتصفحات بدقة احترافية وسرعة فائقة.';

        const cards = doc.querySelectorAll('.features-grid .feature-card');
        if (cards.length >= 6) {
            // Card 1
            const h3_1 = cards[0].querySelector('h3');
            const p_1 = cards[0].querySelector('p');
            if (h3_1) h3_1.textContent = 'محرك فوري يعمل داخل المتصفح';
            if (p_1) p_1.textContent = 'حوّل صور PNG إلى حزم Favicon في أجزاء من الثانية باستخدام قوة المعالجة المحلية داخل متصفحك.';

            // Card 2
            const h3_2 = cards[1].querySelector('h3');
            const p_2 = cards[1].querySelector('p');
            if (h3_2) h3_2.textContent = 'إعادة تحجيم دقيقة على مستوى البكسل';
            if (p_2) p_2.textContent = 'تقنية تصغير عالية الدقة تحافظ على وضوح الحواف ودقة التفاصيل حتى عند أحجام 16×16 بكسل.';

            // Card 3
            const h3_3 = cards[2].querySelector('h3');
            const p_3 = cards[2].querySelector('p');
            if (h3_3) h3_3.textContent = 'يدعم جميع تنسيقات الصور';
            if (p_3) p_3.textContent = 'يعمل بسلاسة مع PNG وJPG وSVG وWEBP وGIF وغيرها من تنسيقات الصور الشائعة.';

            // Card 4
            const h3_4 = cards[3].querySelector('h3');
            const p_4 = cards[3].querySelector('p');
            if (h3_4) h3_4.textContent = 'دعم شامل لجميع الأجهزة';
            if (p_4) p_4.textContent = 'ينشئ ملفات ICO التقليدية، وأيقونات Apple Touch، وأحجام Android Chrome، وأيقونات تطبيقات الويب التقدمية (PWA)، ويجمعها جميعًا داخل ملف ZIP واحد.';

            // Card 5
            const h3_5 = cards[4].querySelector('h3');
            const p_5 = cards[4].querySelector('p');
            if (h3_5) h3_5.textContent = 'آمن وخاص بنسبة 100%';
            if (p_5) p_5.textContent = 'يعمل بالكامل داخل متصفحك باستخدام تقنية HTML5 Canvas. لا يتم تحميل صورتك أو إرسالها إلى أي خادم مطلقًا.';

            // Card 6
            const h3_6 = cards[5].querySelector('h3');
            const p_6 = cards[5].querySelector('p');
            if (h3_6) h3_6.textContent = 'مجاني بالكامل ومفتوح للجميع';
            if (p_6) p_6.textContent = 'لا يتطلب تسجيل بريد إلكتروني، ولا اشتراكات، ولا جدران دفع. أدوات مجانية بالكامل للمطورين.';
        }

        const stepsBadge = doc.querySelector('.steps-badge');
        if (stepsBadge) {
            stepsBadge.childNodes.forEach(node => {
                if (node.nodeType === 3 && node.textContent.trim().includes('Powerful features')) {
                    node.textContent = ' ميزات قوية بين يديك';
                }
            });
        }

        // How It Works Section
        const stepsContainer = doc.querySelector('.steps');
        if (stepsContainer) {
            const section = stepsContainer.parentElement;
            if (section) {
                const title = section.querySelector('h2.section-title');
                if (title) title.textContent = 'كيف يعمل محول PNG إلى Favicon؟';

                const subtitle = section.querySelector('p.section-subtitle');
                if (subtitle) subtitle.textContent = 'اكتشف التقنية المتقدمة التي تعمل بالكامل داخل متصفحك لإنشاء أيقونات Favicon بأمان، دون الحاجة إلى تحميل ملفاتك إلى أي خادم.';

                const steps = stepsContainer.querySelectorAll('.step');
                if (steps.length >= 5) {
                    // Step 1
                    const h3_1 = steps[0].querySelector('h3');
                    const p_1 = steps[0].querySelector('p');
                    if (h3_1) h3_1.textContent = '1. قراءة الملف محليًا';
                    if (p_1) p_1.innerHTML = 'بمجرد سحب صورة PNG وإفلاتها أو اختيارها من جهازك، يستخدم المتصفح واجهة <strong>HTML5 FileReader API</strong> لقراءة الملف محليًا وتحويله إلى تدفق بيانات آمن داخل الذاكرة، دون إرسال أي جزء منه إلى خوادم خارجية.';

                    // Step 2
                    const h3_2 = steps[1].querySelector('h3');
                    const p_2 = steps[1].querySelector('p');
                    if (h3_2) h3_2.textContent = '2. تصغير الصورة خارج الشاشة';
                    if (p_2) p_2.innerHTML = 'لإنشاء جميع الأحجام المطلوبة، يستخدم المحول عناصر <strong>HTML5 Canvas</strong> مخفية تعمل خارج الشاشة. ويطبّق خوارزميات تصغير عالية الجودة للحفاظ على وضوح الشعار وحدة الحواف عند جميع المقاسات.';

                    // Step 3
                    const h3_3 = steps[2].querySelector('h3');
                    const p_3 = steps[2].querySelector('p');
                    if (h3_3) h3_3.textContent = '3. معالجة خيارات التخصيص';
                    if (p_3) p_3.textContent = 'عند تخصيص الإعدادات، يتم تعديل عملية معالجة الصورة تلقائيًا. فعند تعطيل الشفافية، يُضاف لون خلفية ثابت، بينما يؤدي تفعيل الزوايا المستديرة إلى تطبيق قناع دائري يمنح الأيقونة مظهرًا أكثر سلاسة.';

                    // Step 4
                    const h3_4 = steps[3].querySelector('h3');
                    const p_4 = steps[3].querySelector('p');
                    if (h3_4) h3_4.textContent = '4. إنشاء ملف ICO';
                    if (p_4) p_4.innerHTML = 'يتم إنشاء ملف <strong>ICO</strong> متعدد الأحجام بالكامل داخل متصفحك. حيث تُنشئ الأداة رؤوس الملف، وتكتب بيانات دليل <strong>ICO</strong>، ثم تجمع بيانات صور <strong>PNG</strong> في ملف واحد باستخدام معالجة ثنائية مباشرة.';

                    // Step 5
                    const h3_5 = steps[4].querySelector('h3');
                    const p_5 = steps[4].querySelector('p');
                    if (h3_5) h3_5.textContent = '5. ضغط الملفات وتنزيلها';
                    if (p_5) p_5.innerHTML = 'تُجمع جميع الملفات، بما في ذلك ملف <strong>site.webmanifest</strong>، داخل حزمة <strong>ZIP</strong> باستخدام <strong>JSZip</strong>. يتم إنشاء الحزمة محليًا داخل المتصفح، ثم يُنشأ رابط تنزيل مؤقت لبدء حفظ الملف على جهازك.';
                }

                // Footer badge text
                const stepsBadgeFooter = section.querySelector('.steps-badge');
                if (stepsBadgeFooter) {
                    stepsBadgeFooter.childNodes.forEach(node => {
                        if (node.nodeType === 3 && node.textContent.trim().includes('Ready in seconds')) {
                            node.textContent = ' جاهز خلال ثوانٍ، مع معالجة محلية بالكامل بنسبة 100%';
                        }
                    });
                }
            }
        }

        // Perfect for Every Use Case Section
        let perfectUseCasesSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Perfect for Every Use Case')) {
                perfectUseCasesSec = sec;
            }
        });

        if (perfectUseCasesSec) {
            const title = perfectUseCasesSec.querySelector('h2.section-title');
            if (title) title.textContent = 'مثالي لجميع حالات الاستخدام';

            const subtitle = perfectUseCasesSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.innerHTML = 'اكتشف كيف يساعدك محول <strong>PNG إلى Favicon</strong> في مختلف الاستخدامات.';

            const cards = perfectUseCasesSec.querySelectorAll('.use-case-card');
            if (cards.length >= 4) {
                // Card 1
                const h3_1 = cards[0].querySelector('h3');
                const p_1 = cards[0].querySelector('p');
                if (h3_1) h3_1.textContent = 'مطورو الويب';
                if (p_1) p_1.innerHTML = 'أنشئ جميع أحجام <strong>Favicon</strong> المطلوبة لمشاريعك من ملف PNG واحد، بسرعة وسهولة.';

                // Card 2
                const h3_2 = cards[1].querySelector('h3');
                const p_2 = cards[1].querySelector('p');
                if (h3_2) h3_2.textContent = 'مصممو UI/UX';
                if (p_2) p_2.textContent = 'حافظ على وضوح هوية علامتك التجارية وجودة عرضها في علامات تبويب المتصفح وعلى الشاشات الرئيسية للأجهزة.';

                // Card 3
                const h3_3 = cards[2].querySelector('h3');
                const p_3 = cards[2].querySelector('p');
                if (h3_3) h3_3.textContent = 'المدونون وصنّاع المحتوى';
                if (p_3) p_3.textContent = 'أضف أيقونة احترافية إلى مدونتك أو معرض أعمالك بسهولة وفي غضون ثوانٍ.';

                // Card 4
                const h3_4 = cards[3].querySelector('h3');
                const p_4 = cards[3].querySelector('p');
                if (h3_4) h3_4.textContent = 'أصحاب الأعمال';
                if (p_4) p_4.innerHTML = 'امنح موقعك مظهرًا أكثر احترافية مع <strong>Favicon</strong> عالية الجودة تعزز ثقة الزوار.';
            }

            const stepsBadge = perfectUseCasesSec.querySelector('.steps-badge');
            if (stepsBadge) {
                stepsBadge.childNodes.forEach(node => {
                    if (node.nodeType === 3 && node.textContent.trim().includes('Trusted by professionals')) {
                        node.textContent = ' موثوق به من قبل محترفين حول العالم';
                    }
                });
            }
        }

        // What's Included Section
        let whatsIncludedSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes("What's Included in Your Download")) {
                whatsIncludedSec = sec;
            }
        });

        if (whatsIncludedSec) {
            const title = whatsIncludedSec.querySelector('h2.section-title');
            if (title) title.textContent = 'ما الذي تتضمنه حزمة التنزيل؟';

            const subtitle = whatsIncludedSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.innerHTML = 'كل الملفات التي تحتاجها لضمان دعم كامل لـ <strong>Favicon</strong> عبر مختلف المتصفحات والأجهزة.';

            // favicon.ico
            const fcIco = whatsIncludedSec.querySelector('#file-favicon-ico');
            if (fcIco) {
                const badge = fcIco.querySelector('.file-badge');
                const p = fcIco.querySelector('p');
                if (badge) badge.textContent = 'ICO';
                if (p) p.innerHTML = 'تنسيق <strong>ICO</strong> الكلاسيكي متعدد الأحجام، ويحتوي على أيقونات بمقاسات <strong>16×16</strong> و<strong>32×32</strong> و<strong>48×48</strong> بكسل. ضروري لدعم المتصفحات القديمة، بما في ذلك الإصدارات السابقة من <strong>Internet Explorer</strong>.';
            }

            // favicon-16
            const fc16 = whatsIncludedSec.querySelector('#file-favicon-16');
            if (fc16) {
                const badge = fc16.querySelector('.file-badge');
                const p = fc16.querySelector('p');
                if (badge) badge.textContent = '16';
                if (p) p.innerHTML = 'أيقونة علامة التبويب القياسية بحجم <strong>16×16</strong> بكسل، وتستخدمها معظم المتصفحات الحديثة كأيقونة <strong>Favicon</strong> الأساسية للشاشات ذات الكثافة القياسية.';
            }

            // favicon-32
            const fc32 = whatsIncludedSec.querySelector('#file-favicon-32');
            if (fc32) {
                const badge = fc32.querySelector('.file-badge');
                const p = fc32.querySelector('p');
                if (badge) badge.textContent = '32';
                if (p) p.innerHTML = 'أيقونة عالية الدقة بحجم <strong>32×32</strong> بكسل، تُعرض بوضوح على شاشات <strong>Retina</strong> و<strong>HiDPI</strong> للحصول على مظهر أكثر حدة داخل علامات التبويب.';
            }

            // apple-touch-icon
            const fcApple = whatsIncludedSec.querySelector('#file-apple-touch');
            if (fcApple) {
                const badge = fcApple.querySelector('.file-badge');
                const p = fcApple.querySelector('p');
                if (badge) badge.textContent = '180';
                if (p) p.innerHTML = 'أيقونة <strong>Apple Touch</strong> بحجم <strong>180×180</strong> بكسل لأجهزة <strong>iPhone</strong> و<strong>iPad</strong> و<strong>iPod Touch</strong>، وتظهر عند إضافة الموقع إلى الشاشة الرئيسية في نظام <strong>iOS</strong>.';
            }

            // android-chrome-192
            const fc192 = whatsIncludedSec.querySelector('#file-android-192');
            if (fc192) {
                const badge = fc192.querySelector('.file-badge');
                const p = fc192.querySelector('p');
                if (badge) badge.textContent = '192';
                if (p) p.innerHTML = 'أيقونة الشاشة الرئيسية لنظام <strong>Android</strong> بحجم <strong>192×192</strong> بكسل، تُستخدم عند إضافة الموقع إلى الشاشة الرئيسية عبر <strong>Chrome</strong> أو المتصفحات الأخرى.';
            }

            // android-chrome-512
            const fc512 = whatsIncludedSec.querySelector('#file-android-512');
            if (fc512) {
                const badge = fc512.querySelector('.file-badge');
                const p = fc512.querySelector('p');
                if (badge) badge.textContent = '512';
                if (p) p.innerHTML = 'أيقونة <strong>PWA</strong> عالية الدقة بحجم <strong>512×512</strong> بكسل، مطلوبة لرسائل تثبيت تطبيقات الويب التقدمية (<strong>Progressive Web Apps</strong>) وشاشات البدء على أجهزة <strong>Android</strong>.';
            }

            // site.webmanifest
            const fcManifest = whatsIncludedSec.querySelector('#file-manifest');
            if (fcManifest) {
                const badge = fcManifest.querySelector('.file-badge');
                const p = fcManifest.querySelector('p');
                if (badge) badge.textContent = 'JSON';
                if (p) p.innerHTML = 'ملف <strong>Web App Manifest</strong> الذي يحتوي على مراجع الأيقونات ولون السمة ولون الخلفية، وهو عنصر أساسي لدعم <strong>PWA</strong> والتكامل مع الشاشة الرئيسية في <strong>Android</strong>.';
            }
        }

        // Comparison Table Section
        let comparisonSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('PNGtoFavicon vs Other Tools')) {
                comparisonSec = sec;
            }
        });

        if (comparisonSec) {
            const title = comparisonSec.querySelector('h2.section-title');
            if (title) title.textContent = 'PNGtoFavicon مقارنةً بالأدوات الأخرى في السوق';

            const subtitle = comparisonSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'اطّلع على كيفية تفوق PNGtoFavicon على مولدات Favicon الأخرى.';

            const table = comparisonSec.querySelector('#comparisonTable');
            if (table) {
                // Headers
                const ths = table.querySelectorAll('thead th');
                if (ths.length >= 3) {
                    ths[0].textContent = 'الميزة';
                    ths[1].textContent = 'PNGtoFavicon';
                    ths[2].textContent = 'الأدوات الأخرى';
                }

                // Body rows
                const rows = table.querySelectorAll('tbody tr');
                if (rows.length >= 8) {
                    // Row 1: Price
                    rows[0].querySelectorAll('td')[0].textContent = 'السعر';
                    rows[0].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> مجاني مدى الحياة';
                    rows[0].querySelectorAll('td')[2].textContent = 'خطط مجانية محدودة أو مدفوعة';

                    // Row 2: Privacy
                    rows[1].querySelectorAll('td')[0].textContent = 'الخصوصية';
                    rows[1].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> معالجة محلية 100%';
                    rows[1].querySelectorAll('td')[2].textContent = 'يتم رفع الملفات إلى الخوادم';

                    // Row 3: Speed
                    rows[2].querySelectorAll('td')[0].textContent = 'السرعة';
                    rows[2].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> معالجة فورية';
                    rows[2].querySelectorAll('td')[2].textContent = 'تعتمد على ضغط الخادم';

                    // Row 4: File Formats
                    rows[3].querySelectorAll('td')[0].textContent = 'صيغ الملفات';
                    rows[3].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> ICO + PNG + Manifest';
                    rows[3].querySelectorAll('td')[2].textContent = 'غالبًا ICO فقط';

                    // Row 5: Registration
                    rows[4].querySelectorAll('td')[0].textContent = 'بدون تسجيل';
                    rows[4].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> لا يتطلب إنشاء حساب';
                    rows[4].querySelectorAll('td')[2].textContent = 'قد يكون مطلوبًا';

                    // Row 6: Multi-platform
                    rows[5].querySelectorAll('td')[0].textContent = 'دعم المنصات';
                    rows[5].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> جميع الأجهزة والمتصفحات';
                    rows[5].querySelectorAll('td')[2].textContent = 'دعم محدود';

                    // Row 7: HTML Code Snippet
                    rows[6].querySelectorAll('td')[0].textContent = 'كود HTML';
                    rows[6].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> يتم إنشاؤه تلقائيًا';
                    rows[6].querySelectorAll('td')[2].textContent = 'يتطلب إضافته يدويًا';

                    // Row 8: Open Source
                    rows[7].querySelectorAll('td')[0].textContent = 'مفتوح المصدر';
                    rows[7].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> عملية شفافة';
                    rows[7].querySelectorAll('td')[2].textContent = 'حلول مغلقة';
                }
            }
        }

        // Testimonials Section
        let testimonialsSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('What Our Users Say')) {
                testimonialsSec = sec;
            }
        });

        if (testimonialsSec) {
            const accent = testimonialsSec.querySelector('.section-subtitle-accent');
            if (accent) accent.textContent = 'آراء العملاء';

            const title = testimonialsSec.querySelector('h2.section-title');
            if (title) title.textContent = 'ماذا يقول مستخدمونا؟';

            const subtitle = testimonialsSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.innerHTML = 'يثق أكثر من <strong>50,000</strong> مطور ومصمم وصانع محتوى في <strong>PNGtoFavicon</strong> لإنجاز مشاريعهم.';

            // Rating Platforms
            const ratingDetails = testimonialsSec.querySelectorAll('.rating-details');
            ratingDetails.forEach(detail => {
                const platform = detail.querySelector('.rating-platform');
                const count = detail.querySelector('.rating-count');
                if (platform) {
                    if (platform.textContent.includes('Trustpilot')) {
                        platform.textContent = 'تقييمات موثقة على Trustpilot';
                    } else if (platform.textContent.includes('Capterra')) {
                        platform.textContent = 'تقييمات موثقة على Capterra';
                    }
                }
                if (count && count.textContent.includes('reviews')) {
                    count.textContent = 'من أكثر من 500 تقييم';
                }
            });

            // Tabs
            const tabs = testimonialsSec.querySelectorAll('.testimonial-tab');
            if (tabs.length >= 4) {
                tabs[0].textContent = 'الكل';
                tabs[1].textContent = 'المطورون';
                tabs[2].textContent = 'المصممون';
                tabs[3].textContent = 'منشئو المحتوى';
            }

            // Cards
            const cards = testimonialsSec.querySelectorAll('.review-card');
            cards.forEach(card => {
                const authorEl = card.querySelector('.review-meta h3');
                const roleEl = card.querySelector('.review-meta p');
                const dateEl = card.querySelector('.review-date');
                const textEl = card.querySelector('.review-card > p');

                if (authorEl) {
                    const author = authorEl.textContent.trim();
                    if (author === 'Alex M.') {
                        if (roleEl) roleEl.textContent = 'مطور واجهات أمامية';
                        if (dateEl) dateEl.textContent = 'أكتوبر 2025';
                        if (textEl) textEl.innerHTML = '"أسرع طريقة لإنشاء جميع أحجام <strong>Favicon</strong>. لا تستغرق سوى ثانيتين، كما أنها تدعم ملفات <strong>manifest.json</strong> الحديثة بشكل مثالي."';
                    } else if (author === 'Sarah J.') {
                        if (roleEl) roleEl.textContent = 'مصممة UI/UX';
                        if (dateEl) dateEl.textContent = 'سبتمبر 2025';
                        if (textEl) textEl.innerHTML = '"كنت أستخدم ثلاث أدوات مختلفة لتحويل ملفات <strong>PNG</strong> إلى <strong>ICO</strong> وإنشاء <strong>Apple Touch Icons</strong>. الآن يمكنني إنجاز كل ذلك بنقرة واحدة."';
                    } else if (author === 'David K.') {
                        if (roleEl) roleEl.textContent = 'رائد أعمال مستقل';
                        if (dateEl) dateEl.textContent = 'أغسطس 2025';
                        if (textEl) textEl.textContent = '"واجهة نظيفة، بدون إعلانات، وتحترم الخصوصية. أوصي بها بشدة لمصممي واجهات المستخدم والمطورين."';
                    } else if (author === 'Elena R.') {
                        if (roleEl) roleEl.textContent = 'مالكة وكالة';
                        if (dateEl) dateEl.textContent = 'يوليو 2025';
                        if (textEl) textEl.innerHTML = '"أصبحنا نعتمد على هذه الأداة في جميع مشاريع عملائنا. النتائج دائمًا واضحة وعالية الجودة، كما أن أكواد <strong>HTML</strong> الجاهزة توفر علينا الكثير من الوقت."';
                    } else if (author === 'Michael T.') {
                        if (roleEl) roleEl.textContent = 'مطور Full Stack';
                        if (dateEl) dateEl.textContent = 'يونيو 2025';
                        if (textEl) textEl.innerHTML = '"أخيرًا، مولد <strong>Favicon</strong> يفهم متطلبات الويب الحديثة. كما أن تصميم الوضع الداكن للموقع رائع للغاية."';
                    } else if (author === 'Jessica L.') {
                        if (roleEl) roleEl.textContent = 'مديرة منتجات';
                        if (dateEl) dateEl.textContent = 'مايو 2025';
                        if (textEl) textEl.textContent = '"أداة موثوقة للغاية. أحب أنها تمنحك كل ما تحتاج إليه مباشرة دون خطوات معقدة أو الحاجة إلى إنشاء حساب."';
                    } else if (author === 'Ryan P.') {
                        if (roleEl) roleEl.textContent = 'مصمم منتجات';
                        if (dateEl) dateEl.textContent = 'أبريل 2025';
                        if (textEl) textEl.textContent = '"تنفيذ خالٍ من العيوب تماماً. ملف zip المولد منظم بشكل مثالي وتبدو الأيقونات رائعة على جميع الأجهزة."';
                    } else if (author === 'Amanda B.') {
                        if (roleEl) roleEl.textContent = 'مديرة تسويق';
                        if (dateEl) dateEl.textContent = 'مارس 2025';
                        if (textEl) textEl.textContent = '"استغرق الأمر مني أقل من دقيقة لتحديث أيقونات موقع شركتنا. العملية بديهية وسهلة للغاية."';
                    } else if (author === 'Chris W.') {
                        if (roleEl) roleEl.textContent = 'مؤسس';
                        if (dateEl) dateEl.textContent = 'فبراير 2025';
                        if (textEl) textEl.textContent = '"شيء واحد أقل يدعو للقلق عند إطلاق منتج جديد. ما عليك سوى السحب والإفلات والحصول على أيقونات مثالية."';
                    } else if (author === 'Nina S.') {
                        if (roleEl) roleEl.textContent = 'مصمم ويب مستقل';
                        if (dateEl) dateEl.textContent = 'أغسطس 2025';
                        if (textEl) textEl.textContent = '"أوصي بهذه الأداة لجميع زملائي. إنها تتعامل مع الشفافية بشكل مثالي وملفات ICO صالحة دائماً."';
                    } else if (author === 'Tom H.') {
                        if (roleEl) roleEl.textContent = 'المدير التقني (CTO)';
                        if (dateEl) dateEl.textContent = 'يوليو 2025';
                        if (textEl) textEl.textContent = '"بسيطة وفعالة وتفعل ما تقوله بالضبط. لا توجد ميزات غير ضرورية، مجرد أداة قوية ومفيدة."';
                    } else if (author === 'Laura C.') {
                        if (roleEl) roleEl.textContent = 'مدون';
                        if (dateEl) dateEl.textContent = 'يونيو 2025';
                        if (textEl) textEl.textContent = '"لست خبيراً تقنياً، لكن هذه الأداة سهلت عليّ للغاية الحصول على أيقونة احترافية لمدونتي. شكراً لكم!"';
                    }
                }
            });
        }

        // FAQ Section
        let faqSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Frequently Asked Questions')) {
                faqSec = sec;
            }
        });

        if (faqSec) {
            const title = faqSec.querySelector('h2.section-title');
            if (title) title.textContent = 'الأسئلة الشائعة';

            const subtitle = faqSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'اعثر على إجابات للأسئلة الشائعة حول خدمة تحويل أيقونات المواقع الخاصة بنا';

            // Tabs
            const tabBtns = faqSec.querySelectorAll('.faq-tab-btn');
            if (tabBtns.length >= 4) {
                tabBtns[0].textContent = 'البداية';
                tabBtns[1].textContent = 'الميزات';
                tabBtns[2].textContent = 'التقنية';
                tabBtns[3].textContent = 'من نحن';
            }

            // Getting Started Group
            const gsGroup = faqSec.querySelector('#faq-getting-started');
            if (gsGroup) {
                const items = gsGroup.querySelectorAll('.faq-item');
                if (items.length >= 4) {
                    // Item 1
                    const q_1 = items[0].querySelector('summary');
                    const a_1 = items[0].querySelector('.faq-answer');
                    if (q_1) q_1.textContent = 'ما هو الفافيكون (Favicon)؟';
                    if (a_1) a_1.textContent = 'أيقونة المفضلة (Favicon) هي أيقونة صغيرة تمثل موقعك الإلكتروني في علامات تبويب المتصفح، والإشارات المرجعية، وسجلات المحفوظات، وشريط العنوان. تساعد المستخدمين على التعرف على علامتك التجارية بصرياً.';

                    // Item 2
                    const q_2 = items[1].querySelector('summary');
                    const a_2 = items[1].querySelector('.faq-answer');
                    if (q_2) q_2.textContent = 'كيف يمكنني تحويل صورة PNG إلى أيقونة موقع عبر الإنترنت؟';
                    if (a_2) a_2.textContent = 'ما عليك سوى سحب صورة PNG وإفلاتها في صندوق الرفع في الأعلى، وتخصيص لون الخلفية أو الهوامش أو الزوايا، وتنزيل حزمة ZIP المجمعة على الفور.';

                    // Item 3
                    const q_3 = items[2].querySelector('summary');
                    const a_3 = items[2].querySelector('.faq-answer');
                    if (q_3) q_3.textContent = 'هل أحتاج إلى تثبيت أي برامج؟';
                    if (a_3) a_3.textContent = 'لا، يعمل محول الأيقونات الخاص بنا بنسبة 100% داخل متصفح الويب الخاص بك. لا داعي لتثبيت أي ملحقات أو إضافات أو برامج.';

                    // Item 4
                    const q_4 = items[3].querySelector('summary');
                    const a_4 = items[3].querySelector('.faq-answer');
                    if (q_4) q_4.textContent = 'هل أحتاج إلى إنشاء حساب؟';
                    if (a_4) a_4.textContent = 'لا، الأداة مجانية ومفتوحة تماماً وتعمل دون تحديد هوية. لا يلزم التسجيل أو إدخال بريد إلكتروني أو أي اشتراك.';
                }
            }

            // Features Group
            const ftGroup = faqSec.querySelector('#faq-features');
            if (ftGroup) {
                const items = ftGroup.querySelectorAll('.faq-item');
                if (items.length >= 4) {
                    // Item 1
                    const q_1 = items[0].querySelector('summary');
                    const a_1 = items[0].querySelector('.faq-answer');
                    if (q_1) q_1.textContent = 'ما هي تنسيقات الملفات التي تنشئها الأداة؟';
                    if (a_1) a_1.textContent = 'تنتج الأداة ملف favicon.ico متعدد الأحجام (16 و32 و48 بكسل)، وأيقونات متصفح PNG عالية الدقة، وأيقونات Apple Touch (180x180)، وأيقونات Android Chrome (192x192 و512x512)، وملف site.webmanifest.';

                    // Item 2
                    const q_2 = items[1].querySelector('summary');
                    const a_2 = items[1].querySelector('.faq-answer');
                    if (q_2) q_2.textContent = 'هل تدعم الأداة صور PNG الشفافة؟';
                    if (a_2) a_2.textContent = 'نعم! تحافظ الأداة على الشفافية افتراضياً. يمكنك أيضاً إيقاف تشغيل الشفافية وملء الخلفية بأي لون تختاره.';

                    // Item 3
                    const q_3 = items[2].querySelector('summary');
                    const a_3 = items[2].querySelector('.faq-answer');
                    if (q_3) q_3.textContent = 'هل يمكنني اختيار أحجام مخرجات محددة؟';
                    if (a_3) a_3.textContent = 'نعم، تتيح لك لوحة الخيارات اختيار أو إلغاء تحديد أحجام معينة بحيث تقوم فقط بتنزيل الأيقونات التي تحتاجها بالفعل.';

                    // Item 4
                    const q_4 = items[3].querySelector('summary');
                    const a_4 = items[3].querySelector('.faq-answer');
                    if (q_4) q_4.textContent = 'ما هو ملف site.webmanifest؟';
                    if (a_4) a_4.textContent = 'هو ملف تكوين بتنسيق JSON يحتوي على بيانات وصفية لاسم التطبيق ومسارات الأيقونات التي تتطلبها أجهزة Android الحديثة وتطبيقات الويب التقدمية (PWA) لتثبيت موقعك على الشاشة الرئيسية.';
                }
            }

            // Technology Group
            const techGroup = faqSec.querySelector('#faq-technology');
            if (techGroup) {
                const items = techGroup.querySelectorAll('.faq-item');
                if (items.length >= 4) {
                    // Item 1
                    const q_1 = items[0].querySelector('summary');
                    const a_1 = items[0].querySelector('.faq-answer');
                    if (q_1) q_1.textContent = 'كيف يعمل تحويل الأيقونات من جانب العميل؟';
                    if (a_1) a_1.textContent = 'نستخدم لوحة HTML5 Canvas لقياس ورسم الصور، ونقوم بتجميع ملف favicon.ico الثنائي باستخدام مخازن صفائف البايت (ArrayBuffers) مباشرة في ذاكرة متصفحك.';

                    // Item 2
                    const q_2 = items[1].querySelector('summary');
                    const a_2 = items[1].querySelector('.faq-answer');
                    if (q_2) q_2.textContent = 'هل يدعم المحول الصور الكبيرة؟';
                    if (a_2) a_2.textContent = 'نعم، يتعامل المحول بسهولة مع الصور عالية الدقة حتى 5 ميجابايت، ويغير حجمها باستخدام مرشح الاستكمال الثنائي للحفاظ على الخطوط واضحة ونقية.';

                    // Item 3
                    const q_3 = items[2].querySelector('summary');
                    const a_3 = items[2].querySelector('.faq-answer');
                    if (q_3) q_3.textContent = 'لماذا يعد ملف favicon.ico مهماً؟';
                    if (a_3) a_3.textContent = 'على الرغم من أن المتصفحات الحديثة تدعم أيقونات PNG، لا يزال تنسيق favicon.ico القديم مطلوباً كحل بديل لإصدارات Internet Explorer القديمة وبعض مديري اختصارات سطح المكتب.';

                    // Item 4
                    const q_4 = items[3].querySelector('summary');
                    const a_4 = items[3].querySelector('.faq-answer');
                    if (q_4) q_4.textContent = 'ما مدى سرعة عملية التحويل؟';
                    if (a_4) a_4.textContent = 'التحويل فوري تقريباً (أقل من 50 مللي ثانية) لأنه يعالج كل شيء محلياً على جهاز الكمبيوتر الخاص بك بدلاً من تحميله إلى خادم بعيد.';
                }
            }

            // About Us Group
            const aboutUsGroup = faqSec.querySelector('#faq-about-us');
            if (aboutUsGroup) {
                const items = aboutUsGroup.querySelectorAll('.faq-item');
                if (items.length >= 4) {
                    // Item 1
                    const q_1 = items[0].querySelector('summary');
                    const a_1 = items[0].querySelector('.faq-answer');
                    if (q_1) q_1.textContent = 'هل صورتي آمنة وخاصة؟';
                    if (a_1) a_1.textContent = 'نعم، بكل تأكيد. لا تغادر صورك متصفحك أبداً لأن المعالجة تتم محلياً. نحن لا نقوم بنقل أو تحليل أو تخزين أي من ملفاتك.';

                    // Item 2
                    const q_2 = items[1].querySelector('summary');
                    const a_2 = items[1].querySelector('.faq-answer');
                    if (q_2) q_2.textContent = 'لماذا يجب أن أختار موقع PNGtoFavicon.com؟';
                    if (a_2) a_2.textContent = 'نحن نقدم أداة صديقة للمطورين، تركز على الخصوصية أولاً، وتعمل بشكل تلقائي بالكامل وتوفر حزم أيقونات متوافقة مع جميع المعايير والأجهزة مجاناً بالكامل.';

                    // Item 3
                    const q_3 = items[2].querySelector('summary');
                    const a_3 = items[2].querySelector('.faq-answer');
                    if (q_3) q_3.textContent = 'هل يمكنني استخدام هذه الأداة على الأجهزة المحمولة؟';
                    if (a_3) a_3.textContent = 'نعم! الموقع ومحرك التحويل متوافقان تماماً مع الهواتف والأجهزة اللوحية، بحيث يمكنك إنشاء وتنزيل أيقوناتك من أي جهاز.';

                    // Item 4
                    const q_4 = items[3].querySelector('summary');
                    const a_4 = items[3].querySelector('.faq-answer');
                    if (q_4) q_4.textContent = 'هل هذا المحول مجاني بالكامل؟';
                    if (a_4) a_4.textContent = 'نعم، مجاني 100% بدون حدود، وبدون أي علامات مائية أو رسوم خفية أو باقات اشتراك.';
                }
            }
        }

        // Header Navbar Links
        const navLinksList = doc.querySelectorAll('#navLinks a');
        navLinksList.forEach(link => {
            const text = link.textContent.trim();
            if (text === 'Converter') link.textContent = 'المحول';
            else if (text === 'Text to Favicon') link.textContent = 'نص إلى أيقونة';
            else if (text === 'Emoji to Favicon') link.textContent = 'رمز تعبيري إلى أيقونة';
            else if (text === 'Favicon Checker') link.textContent = 'فاحص الأيقونات';
            else if (text === 'Tutorials') link.textContent = 'دروس تعليمية';
            else if (text === 'Blog') link.textContent = 'المدونة';
        });

        // Options Panel
        const optionsPanel = doc.getElementById('optionsPanel');
        if (optionsPanel) {
            const h3 = optionsPanel.querySelector('h3');
            if (h3) h3.textContent = '⚙️ الخيارات';

            const labels = optionsPanel.querySelectorAll('label');
            labels.forEach(label => {
                const text = label.childNodes[0]?.textContent?.trim() || label.textContent.trim();
                if (text.includes('Output Sizes')) {
                    label.childNodes[0].textContent = 'أحجام الإخراج';
                } else if (text.includes('Background Color')) {
                    label.textContent = 'لون الخلفية (لصور PNG الشفافة)';
                } else if (text.includes('Keep transparent')) {
                    const checkbox = label.querySelector('input');
                    label.innerHTML = '';
                    if (checkbox) label.appendChild(checkbox);
                    label.appendChild(doc.createTextNode(' الحفاظ على الشفافية'));
                } else if (text.includes('Round corners')) {
                    const checkbox = label.querySelector('input');
                    label.innerHTML = '';
                    if (checkbox) label.appendChild(checkbox);
                    label.appendChild(doc.createTextNode(' حواف مستديرة'));
                } else if (text.includes('Include site.webmanifest')) {
                    const checkbox = label.querySelector('input');
                    label.innerHTML = '';
                    if (checkbox) label.appendChild(checkbox);
                    label.appendChild(doc.createTextNode(' تضمين ملف site.webmanifest'));
                }
            });
        }

        // Preview & HTML output
        const outputSection = doc.getElementById('outputSection');
        if (outputSection) {
            const h3s = outputSection.querySelectorAll('h3');
            h3s.forEach(h3 => {
                if (h3.textContent.includes('Preview')) h3.textContent = '📦 المعاينة';
                else if (h3.textContent.includes('HTML Code')) h3.textContent = '🔗 كود HTML';
            });

            const downloadBtn = doc.getElementById('downloadAllBtn');
            if (downloadBtn) {
                const svg = downloadBtn.querySelector('svg');
                downloadBtn.innerHTML = '';
                if (svg) downloadBtn.appendChild(svg);
                downloadBtn.appendChild(doc.createTextNode(' تنزيل الكل (ZIP)'));
            }

            const htmlP = outputSection.querySelector('p');
            if (htmlP && htmlP.textContent.includes("Add this to your website")) {
                htmlP.innerHTML = 'أضف هذا إلى علامة <code>&lt;head&gt;</code> الخاصة بموقعك:';
            }

            const copyBtn = doc.getElementById('copyHtmlBtn');
            if (copyBtn) copyBtn.textContent = 'نسخ';
        }

        // CTA Section
        let ctaSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Start Converting PNG to Favicon')) {
                ctaSec = sec;
            }
        });

        if (ctaSec) {
            const h2 = ctaSec.querySelector('h2');
            if (h2) h2.textContent = 'ابدأ بتحويل PNG إلى Favicon مجاناً اليوم';

            const p = ctaSec.querySelector('p');
            if (p) p.textContent = 'انضم إلى أكثر من 50,000 مستخدم يثقون بموقع PNGtoFavicon.com لإنشاء أيقونات دقيقة وسريعة ومجانية تماماً.';

            const btn = ctaSec.querySelector('.btn');
            if (btn) btn.textContent = 'ابدأ التحويل الآن - إنه مجاني!';
        }

        // More tools Section
        let toolsSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Explore More Favicon Tools')) {
                toolsSec = sec;
            }
        });

        if (toolsSec) {
            const title = toolsSec.querySelector('h2.section-title');
            if (title) title.textContent = 'استكشف المزيد من أدوات الأيقونات';

            const subtitle = toolsSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'يقدم موقع PNGtoFavicon مجموعة كاملة من الأدوات لجميع احتياجاتك الخاصة بأيقونات المواقع';

            const cards = toolsSec.querySelectorAll('.tool-card');
            if (cards.length >= 3) {
                // Card 1: Text to Favicon
                const h3_1 = cards[0].querySelector('h3');
                const p_1 = cards[0].querySelector('p');
                const l_1 = cards[0].querySelector('.tool-card-link');
                if (h3_1) h3_1.textContent = 'نص إلى أيقونة';
                if (p_1) p_1.textContent = 'أنشئ أيقونة من الحروف أو الأحرف الأولى أو أي نص. اختر الخطوط والألوان والأنماط لإنشاء أيقونة نصية فريدة لعلامتك التجارية.';
                if (l_1) l_1.textContent = 'جربه مجاناً ←';

                // Card 2: Emoji to Favicon
                const h3_2 = cards[1].querySelector('h3');
                const p_2 = cards[1].querySelector('p');
                const l_2 = cards[1].querySelector('.tool-card-link');
                if (h3_2) h3_2.textContent = 'رمز تعبيري إلى أيقونة';
                if (p_2) p_2.textContent = 'اختر من بين مئات الرموز التعبيرية لإنشاء أيقونة ملونة ومعبرة على الفور. مثالية للمشاريع الشخصية والمدونات والنماذج الأولية السريعة.';
                if (l_2) l_2.textContent = 'جربه مجاناً ←';

                // Card 3: Favicon Checker
                const h3_3 = cards[2].querySelector('h3');
                const p_3 = cards[2].querySelector('p');
                const l_3 = cards[2].querySelector('.tool-card-link');
                if (h3_3) h3_3.textContent = 'فاحص الأيقونات';
                if (p_3) p_3.textContent = 'تحقق من إعدادات أيقونة موقعك الإلكتروني. أدخل أي عنوان URL للتحقق من الأحجام المفقودة والتنسيقات غير الصحيحة ومشكلات التوافق.';
                if (l_3) l_3.textContent = 'افحص الآن ←';
            }
        }

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                waLink.childNodes.forEach(node => {
                    if (node.nodeType === 3 && node.textContent.trim().includes('Chat on WhatsApp')) {
                        node.textContent = 'دردشة عبر واتساب';
                    }
                });
            }

            // Columns headers
            const colHeaders = footer.querySelectorAll('h4');
            colHeaders.forEach(h4 => {
                const text = h4.textContent.trim();
                if (text === 'Tools') h4.textContent = 'الأدوات';
                else if (text === 'Resources') h4.textContent = 'المصادر';
                else if (text === 'Company') h4.textContent = 'الشركة';
            });

            // Links
            const footerLinks = footer.querySelectorAll('a');
            footerLinks.forEach(link => {
                const text = link.textContent.trim();
                if (text === 'PNG to Favicon Converter') link.textContent = 'محول PNG إلى Favicon';
                else if (text === 'Text to Favicon') link.textContent = 'نص إلى أيقونة';
                else if (text === 'Emoji to Favicon') link.textContent = 'رمز تعبيري إلى أيقونة';
                else if (text === 'Favicon Checker') link.textContent = 'فاحص الأيقونات';
                else if (text === 'Tutorials') link.textContent = 'دروس تعليمية';
                else if (text === 'Blog') link.textContent = 'المدونة';
                else if (text === 'Favicon Sizes Guide') link.textContent = 'دليل مقاسات الأيقونات';
                else if (text === 'What is a Favicon?') link.textContent = 'ما هو الفافيكون (Favicon)؟';
                else if (text === 'About') link.textContent = 'من نحن';
                else if (text === 'Contact') link.textContent = 'اتصل بنا';
                else if (text === 'Privacy Policy') link.textContent = 'سياسة الخصوصية';
                else if (text === 'Terms of Service') link.textContent = 'شروط الخدمة';
                else if (text === 'Cookie Policy') link.textContent = 'سياسة ملفات الارتباط';
            });

            // Copyright text
            const copyright = footer.querySelector('.footer-bottom p');
            if (copyright) {
                copyright.textContent = '© 2026 PNGtoFavicon.com — جميع الحقوق محفوظة.';
            }
        }
    }

    // Custom logic for Arabic text-to-favicon page translation
    if (targetLang === 'ar' && normPath === 'text-to-favicon/index.html') {
        // H1
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'مولّد <span class="gradient-text">Favicon</span> من النص';
        }

        // Subtitle
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'أنشئ أيقونة Favicon احترافية وعالية الجودة باستخدام النص أو الأحرف الأولى لعلامتك التجارية. خصّص الألوان والأشكال والخطوط، ثم نزّل حزمة Favicon الكاملة فورًا.';
        }

        // Badges
        const badgeFree = doc.getElementById('badge-free');
        if (badgeFree) badgeFree.textContent = '💰 مجاني 100%';
        const badgeFonts = doc.getElementById('badge-fonts');
        if (badgeFonts) badgeFonts.textContent = '🎨 خطوط Google Fonts';
        const badgeCustom = doc.getElementById('badge-custom');
        if (badgeCustom) badgeCustom.textContent = '⚙️ قابل للتخصيص بالكامل';
        const badgePrivate = doc.getElementById('badge-private');
        if (badgePrivate) badgePrivate.textContent = '🔒 خاص وآمن 100%';

        // Favicon Settings Panel
        const controlsCard = doc.querySelector('.tool-grid > div.card');
        if (controlsCard) {
            const h2 = controlsCard.querySelector('h2');
            if (h2) h2.textContent = 'إعدادات Favicon';

            const labels = controlsCard.querySelectorAll('label');
            labels.forEach(label => {
                const text = label.childNodes[0]?.textContent?.trim() || label.textContent.trim();
                if (text.includes('Text / Initials')) {
                    label.childNodes[0].textContent = 'النص / الأحرف الأولى';
                } else if (text.includes('Font Family')) {
                    label.textContent = 'عائلة الخط';
                } else if (text.includes('Font Weight')) {
                    label.textContent = 'وزن الخط';
                } else if (text.includes('Font Size')) {
                    label.childNodes[0].textContent = 'حجم الخط';
                } else if (text.includes('Text Color')) {
                    label.textContent = 'لون النص';
                } else if (text.includes('Background') && !text.includes('Transparent')) {
                    label.textContent = 'لون الخلفية';
                } else if (text.includes('Transparent Background')) {
                    const checkbox = label.querySelector('input');
                    label.innerHTML = '';
                    if (checkbox) label.appendChild(checkbox);
                    label.appendChild(doc.createTextNode(' خلفية شفافة'));
                } else if (text.includes('Include site.webmanifest')) {
                    const checkbox = label.querySelector('input');
                    label.innerHTML = '';
                    if (checkbox) label.appendChild(checkbox);
                    label.appendChild(doc.createTextNode(' تضمين ملف site.webmanifest (PWA)'));
                } else if (text.includes('Background Shape')) {
                    label.textContent = 'شكل الخلفية';
                }
            });

            // Weight Select Options
            const weightSelect = doc.getElementById('fontWeightSelect');
            if (weightSelect) {
                const options = weightSelect.querySelectorAll('option');
                options.forEach(opt => {
                    const val = opt.getAttribute('value');
                    if (val === '400') opt.textContent = 'عادي';
                    else if (val === '500') opt.textContent = 'متوسط';
                    else if (val === '600') opt.textContent = 'شبه عريض';
                    else if (val === '700') opt.textContent = 'عريض';
                    else if (val === '800') opt.textContent = 'عريض جداً';
                    else if (val === '900') opt.textContent = 'أسود';
                });
            }

            // Shape Select Options
            const shapeSelect = doc.getElementById('shapeSelect');
            if (shapeSelect) {
                const options = shapeSelect.querySelectorAll('option');
                options.forEach(opt => {
                    const val = opt.getAttribute('value');
                    if (val === 'square') opt.textContent = 'مربع';
                    else if (val === 'rounded') opt.textContent = 'مربع بحواف مستديرة';
                    else if (val === 'circle') opt.textContent = 'دائرة';
                });
            }
        }

        // Live Preview Column
        const previewCol = doc.querySelector('.tool-grid > div[style*="flex-direction: column"]');
        if (previewCol) {
            const h3s = previewCol.querySelectorAll('h3');
            h3s.forEach(h3 => {
                const text = h3.textContent.trim();
                if (text.includes('Live Preview')) h3.textContent = 'المعاينة المباشرة';
                else if (text.includes('HTML Code')) h3.textContent = 'كود HTML';
                else if (text.includes('Included Formats')) h3.textContent = 'التنسيقات المضمنة';
            });

            const downloadBtn = doc.getElementById('downloadAllBtn');
            if (downloadBtn) {
                const svg = downloadBtn.querySelector('svg');
                downloadBtn.innerHTML = '';
                if (svg) downloadBtn.appendChild(svg);
                downloadBtn.appendChild(doc.createTextNode(' تنزيل حزمة Favicon (ZIP)'));
            }

            const copyBtn = previewCol.querySelector('button[onclick*="clipboard"]');
            if (copyBtn) copyBtn.textContent = 'نسخ';
        }

        // Section 3: How This Text to Favicon Tool Works
        let howWorksSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('How this text to Favicon')) {
                howWorksSec = sec;
            }
        });

        if (howWorksSec) {
            const title = howWorksSec.querySelector('h2.section-title');
            if (title) title.textContent = 'كيف تعمل أداة تحويل النص إلى Favicon؟';

            const subtitle = howWorksSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'تعالج الأداة كل شيء محليًا داخل متصفحك بنسبة 100%، مما يضمن السرعة والخصوصية والأمان.';

            const steps = howWorksSec.querySelectorAll('.step');
            if (steps.length >= 4) {
                // Step 1
                const h3_1 = steps[0].querySelector('h3');
                const p_1 = steps[0].querySelector('p');
                if (h3_1) h3_1.textContent = '1. الرسم الفوري باستخدام Canvas';
                if (p_1) p_1.textContent = 'تستخدم الأداة HTML5 Canvas لرسم الخلفيات والنصوص في الوقت الفعلي مباشرة داخل متصفحك، مما يتيح معاينة فورية لأي تغييرات.';

                // Step 2
                const h3_2 = steps[1].querySelector('h3');
                const p_2 = steps[1].querySelector('p');
                if (h3_2) h3_2.textContent = '2. إنشاء ملف ICO';
                if (p_2) p_2.textContent = 'بدلاً من الاعتماد على خوادم خارجية، يقوم البرنامج بتجميع بيانات PNG الخام لإنشاء ملف ICO متوافق بالكامل مع معايير المتصفحات.';

                // Step 3
                const h3_3 = steps[2].querySelector('h3');
                const p_3 = steps[2].querySelector('p');
                if (h3_3) h3_3.textContent = '3. إنشاء حزمة ZIP';
                if (p_3) p_3.textContent = 'تُجمع جميع أحجام الأيقونات وملف site.webmanifest ديناميكيًا داخل حزمة ZIP باستخدام JSZip، وكل ذلك محليًا داخل المتصفح.';

                // Step 4
                const h3_4 = steps[3].querySelector('h3');
                const p_4 = steps[3].querySelector('p');
                if (h3_4) h3_4.textContent = '4. التنزيل مباشرة من المتصفح';
                if (p_4) p_4.textContent = 'تُحوَّل الحزمة إلى رابط Blob URL مؤقت، مما يتيح تنزيلًا فوريًا وآمنًا دون أي تفاعل مع الخوادم أو المساس بخصوصيتك.';
            }

            const stepsBadge = howWorksSec.querySelector('.steps-badge');
            if (stepsBadge) {
                stepsBadge.childNodes.forEach(node => {
                    if (node.nodeType === 3 && node.textContent.trim().includes('Free and Secure')) {
                        node.textContent = ' أصول مجانية وآمنة للمطورين بنسبة 100%';
                    }
                });
            }
        }

        // Section 4: Why Generate Text Favicons Here?
        let whyGenerateSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Why Generate Text Favicons Here')) {
                whyGenerateSec = sec;
            }
        });

        if (whyGenerateSec) {
            const title = whyGenerateSec.querySelector('h2.section-title');
            if (title) title.textContent = 'لماذا تنشئ Favicon نصية باستخدام هذه الأداة؟';

            const subtitle = whyGenerateSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'أداة مجانية متقدمة لإنشاء Favicons احترافية ومتوافقة مع جميع المتصفحات، بدقة عالية وسرعة فائقة.';

            const cards = whyGenerateSec.querySelectorAll('.feature-card');
            if (cards.length >= 6) {
                // Card 1
                const h3_1 = cards[0].querySelector('h3');
                const p_1 = cards[0].querySelector('p');
                if (h3_1) h3_1.textContent = 'محرك فوري يعمل داخل المتصفح';
                if (p_1) p_1.textContent = 'أنشئ حزمة Favicon كاملة في أجزاء من الثانية باستخدام قوة المعالجة المحلية داخل متصفحك.';

                // Card 2
                const h3_2 = cards[1].querySelector('h3');
                const p_2 = cards[1].querySelector('p');
                if (h3_2) h3_2.textContent = 'إعادة تحجيم دقيقة على مستوى البكسل';
                if (p_2) p_2.textContent = 'تحافظ تقنيات التصغير عالية الجودة على وضوح الحواف والتفاصيل حتى عند مقاس 16×16 بكسل.';

                // Card 3
                const h3_3 = cards[2].querySelector('h3');
                const p_3 = cards[2].querySelector('p');
                if (h3_3) h3_3.textContent = 'يدعم جميع تنسيقات الصور';
                if (p_3) p_3.textContent = 'يعمل مع PNG وJPG وSVG وWEBP وGIF وغيرها من تنسيقات الصور الشائعة.';

                // Card 4
                const h3_4 = cards[3].querySelector('h3');
                const p_4 = cards[3].querySelector('p');
                if (h3_4) h3_4.textContent = 'دعم شامل لجميع الأجهزة';
                if (p_4) p_4.textContent = 'ينشئ ملفات ICO، وأيقونات Apple Touch، وأحجام Android Chrome، وملفات PWA داخل حزمة ZIP واحدة.';

                // Card 5
                const h3_5 = cards[4].querySelector('h3');
                const p_5 = cards[4].querySelector('p');
                if (h3_5) h3_5.textContent = 'آمن وخاص بنسبة 100%';
                if (p_5) p_5.textContent = 'يعمل بالكامل داخل متصفحك باستخدام HTML5 Canvas، ولا يتم تحميل أي بيانات إلى أي خادم.';

                // Card 6
                const h3_6 = cards[5].querySelector('h3');
                const p_6 = cards[5].querySelector('p');
                if (h3_6) h3_6.textContent = 'مجاني بالكامل ومفتوح للجميع';
                if (p_6) p_6.textContent = 'لا يتطلب تسجيلًا أو اشتراكًا أو أي رسوم. أدوات مجانية بالكامل للمطورين.';
            }

            const stepsBadge = whyGenerateSec.querySelector('.steps-badge');
            if (stepsBadge) {
                stepsBadge.childNodes.forEach(node => {
                    if (node.nodeType === 3 && node.textContent.trim().includes('Powerful features')) {
                        node.textContent = ' ميزات قوية بين يديك';
                    }
                });
            }
        }

        // Section 5: Perfect for Every Use Case
        let perfectUseCasesSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Perfect for Every Use Case')) {
                perfectUseCasesSec = sec;
            }
        });

        if (perfectUseCasesSec) {
            const title = perfectUseCasesSec.querySelector('h2.section-title');
            if (title) title.textContent = 'مثالي لجميع الاستخدامات';

            const subtitle = perfectUseCasesSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'اكتشف كيف تساعدك أداة Text to Favicon في مختلف السيناريوهات.';

            const cards = perfectUseCasesSec.querySelectorAll('.use-case-card');
            if (cards.length >= 4) {
                // Card 1
                const h3_1 = cards[0].querySelector('h3');
                const p_1 = cards[0].querySelector('p');
                if (h3_1) h3_1.textContent = 'مطورو الويب';
                if (p_1) p_1.textContent = 'أنشئ جميع أحجام Favicon المطلوبة لمشاريعك بسهولة باستخدام نص بسيط.';

                // Card 2
                const h3_2 = cards[1].querySelector('h3');
                const p_2 = cards[1].querySelector('p');
                if (h3_2) h3_2.textContent = 'مصممو UI/UX';
                if (p_2) p_2.textContent = 'حافظ على وضوح هوية علامتك التجارية في علامات تبويب المتصفح وعلى الشاشات الرئيسية للأجهزة.';

                // Card 3
                const h3_3 = cards[2].querySelector('h3');
                const p_3 = cards[2].querySelector('p');
                if (h3_3) h3_3.textContent = 'المدونون وصناع المحتوى';
                if (p_3) p_3.textContent = 'خصص مدونتك أو معرض أعمالك بأيقونة احترافية خلال ثوانٍ.';

                // Card 4
                const h3_4 = cards[3].querySelector('h3');
                const p_4 = cards[3].querySelector('p');
                if (h3_4) h3_4.textContent = 'أصحاب الأعمال';
                if (p_4) p_4.textContent = 'عزز المظهر الاحترافي لموقعك باستخدام Favicon عالية الجودة تعزز ثقة العملاء.';
            }

            const stepsBadge = perfectUseCasesSec.querySelector('.steps-badge');
            if (stepsBadge) {
                stepsBadge.childNodes.forEach(node => {
                    if (node.nodeType === 3 && node.textContent.trim().includes('Trusted by professionals')) {
                        node.textContent = ' موثوق به من قبل محترفين حول العالم';
                    }
                });
            }
        }

        // Section 6: Comparison Table
        let comparisonSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('vs Other Tools')) {
                comparisonSec = sec;
            }
        });

        if (comparisonSec) {
            const title = comparisonSec.querySelector('h2.section-title');
            if (title) title.textContent = 'Text Favicon Generator مقارنةً بالأدوات الأخرى';

            const subtitle = comparisonSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'اطّلع على كيفية تفوق أداتنا على مولدات Favicon الأخرى.';

            const table = comparisonSec.querySelector('#comparisonTable');
            if (table) {
                // Headers
                const ths = table.querySelectorAll('thead th');
                if (ths.length >= 3) {
                    ths[0].textContent = 'الميزة';
                    ths[1].textContent = 'PNGtoFavicon';
                    ths[2].textContent = 'الأدوات الأخرى';
                }

                // Body rows
                const rows = table.querySelectorAll('tbody tr');
                if (rows.length >= 8) {
                    // Row 1: Price
                    rows[0].querySelectorAll('td')[0].textContent = 'السعر';
                    rows[0].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> مجاني مدى الحياة';
                    rows[0].querySelectorAll('td')[2].textContent = 'خطط مجانية محدودة أو مدفوعة';

                    // Row 2: Privacy
                    rows[1].querySelectorAll('td')[0].textContent = 'الخصوصية';
                    rows[1].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> معالجة محلية 100%';
                    rows[1].querySelectorAll('td')[2].textContent = 'رفع الملفات إلى الخوادم';

                    // Row 3: Speed
                    rows[2].querySelectorAll('td')[0].textContent = 'السرعة';
                    rows[2].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> معالجة فورية';
                    rows[2].querySelectorAll('td')[2].textContent = 'تعتمد على ضغط الخادم';

                    // Row 4: File Formats
                    rows[3].querySelectorAll('td')[0].textContent = 'صيغ الملفات';
                    rows[3].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> ICO + PNG + Manifest';
                    rows[3].querySelectorAll('td')[2].textContent = 'غالبًا ICO فقط';

                    // Row 5: Registration
                    rows[4].querySelectorAll('td')[0].textContent = 'بدون تسجيل';
                    rows[4].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> لا يتطلب إنشاء حساب';
                    rows[4].querySelectorAll('td')[2].textContent = 'قد يكون مطلوبًا';

                    // Row 6: Multi-platform
                    rows[5].querySelectorAll('td')[0].textContent = 'دعم المنصات';
                    rows[5].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> جميع الأجهزة والمتصفحات';
                    rows[5].querySelectorAll('td')[2].textContent = 'دعم محدود';

                    // Row 7: HTML Code Snippet
                    rows[6].querySelectorAll('td')[0].textContent = 'كود HTML';
                    rows[6].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> يتم إنشاؤه تلقائيًا';
                    rows[6].querySelectorAll('td')[2].textContent = 'يتطلب إضافته يدويًا';

                    // Row 8: Open Source
                    rows[7].querySelectorAll('td')[0].textContent = 'مفتوح المصدر';
                    rows[7].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> عملية شفافة';
                    rows[7].querySelectorAll('td')[2].textContent = 'حلول مغلقة';
                }
            }
        }

        // Section 7: Testimonials
        let testimonialsSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('What Our Users Say')) {
                testimonialsSec = sec;
            }
        });

        if (testimonialsSec) {
            const accent = testimonialsSec.querySelector('.section-subtitle-accent');
            if (accent) accent.textContent = 'آراء العملاء';

            const title = testimonialsSec.querySelector('h2.section-title');
            if (title) title.textContent = 'ماذا يقول مستخدمونا؟';

            const subtitle = testimonialsSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.innerHTML = 'يثق أكثر من <strong>50,000</strong> مطور ومصمم وصانع محتوى في <strong>PNGtoFavicon</strong> لإنجاز مشاريعهم.';

            // Rating Platforms
            const ratingDetails = testimonialsSec.querySelectorAll('.rating-details');
            ratingDetails.forEach(detail => {
                const platform = detail.querySelector('.rating-platform');
                const count = detail.querySelector('.rating-count');
                if (platform) {
                    if (platform.textContent.includes('Trustpilot')) {
                        platform.textContent = 'تقييمات موثقة على Trustpilot';
                    } else if (platform.textContent.includes('Capterra')) {
                        platform.textContent = 'تقييمات موثقة على Capterra';
                    }
                }
                if (count && count.textContent.includes('reviews')) {
                    count.textContent = 'من أكثر من 500 تقييم';
                }
            });

            // Tabs
            const tabs = testimonialsSec.querySelectorAll('.testimonial-tab');
            if (tabs.length >= 4) {
                tabs[0].textContent = 'الكل';
                tabs[1].textContent = 'المطورون';
                tabs[2].textContent = 'المصممون';
                tabs[3].textContent = 'منشئو المحتوى';
            }

            // Cards
            const cards = testimonialsSec.querySelectorAll('.review-card');
            cards.forEach(card => {
                const authorEl = card.querySelector('.review-meta h3');
                const roleEl = card.querySelector('.review-meta p');
                const dateEl = card.querySelector('.review-date');
                const textEl = card.querySelector('.review-card > p');

                if (authorEl) {
                    const author = authorEl.textContent.trim();
                    if (author === 'Alex M.') {
                        if (roleEl) roleEl.textContent = 'مطور واجهات أمامية';
                        if (dateEl) dateEl.textContent = 'أكتوبر 2025';
                        if (textEl) textEl.innerHTML = '"أسرع طريقة لإنشاء جميع أحجام <strong>Favicon</strong>. لا تستغرق سوى ثانيتين، كما أنها تدعم ملفات <strong>manifest.json</strong> الحديثة بشكل مثالي."';
                    } else if (author === 'Sarah J.') {
                        if (roleEl) roleEl.textContent = 'مصممة UI/UX';
                        if (dateEl) dateEl.textContent = 'سبتمبر 2025';
                        if (textEl) textEl.innerHTML = '"كنت أستخدم ثلاث أدوات مختلفة لإنشاء ملفات <strong>ICO</strong> و<strong>Apple Touch Icons</strong>. الآن يمكنني إنجاز كل ذلك بنقرة واحدة."';
                    } else if (author === 'David K.') {
                        if (roleEl) roleEl.textContent = 'رائد أعمال مستقل';
                        if (dateEl) dateEl.textContent = 'أغسطس 2025';
                        if (textEl) textEl.textContent = '"واجهة نظيفة، بلا إعلانات، وتحترم الخصوصية. أوصي بها بشدة للمطورين ومصممي واجهات المستخدم."';
                    } else if (author === 'Elena R.') {
                        if (roleEl) roleEl.textContent = 'مالكة وكالة';
                        if (dateEl) dateEl.textContent = 'يوليو 2025';
                        if (textEl) textEl.innerHTML = '"أصبحت هذه الأداة جزءًا أساسيًا من جميع مشاريع عملائنا. النتائج دائمًا واضحة وعالية الجودة، كما توفر لنا أكواد <strong>HTML</strong> الجاهزة توفر علينا الكثير من الوقت."';
                    } else if (author === 'Michael T.') {
                        if (roleEl) roleEl.textContent = 'مطور Full Stack';
                        if (dateEl) dateEl.textContent = 'يونيو 2025';
                        if (textEl) textEl.innerHTML = '"أخيرًا، مولد <strong>Favicon</strong> يفهم متطلبات الويب الحديثة. كما أن تصميم الوضع الداكن للموقع رائع للغاية."';
                    } else if (author === 'Jessica L.') {
                        if (roleEl) roleEl.textContent = 'مديرة منتجات';
                        if (dateEl) dateEl.textContent = 'مايو 2025';
                        if (textEl) textEl.textContent = '"أداة موثوقة للغاية. تمنحك كل ما تحتاج إليه مباشرة دون خطوات معقدة أو الحاجة إلى إنشاء حساب."';
                    } else if (author === 'Ryan P.') {
                        if (roleEl) roleEl.textContent = 'مصمم منتجات';
                        if (dateEl) dateEl.textContent = 'أبريل 2025';
                        if (textEl) textEl.textContent = '"تنفيذ خالٍ من العيوب تماماً. ملف zip المولد منظم بشكل مثالي وتبدو الأيقونات رائعة على جميع الأجهزة."';
                    } else if (author === 'Amanda B.') {
                        if (roleEl) roleEl.textContent = 'مديرة تسويق';
                        if (dateEl) dateEl.textContent = 'مارس 2025';
                        if (textEl) textEl.textContent = '"استغرق الأمر مني أقل من دقيقة لتحديث أيقونات موقع شركتنا. العملية بديهية وسهلة للغاية."';
                    } else if (author === 'Chris W.') {
                        if (roleEl) roleEl.textContent = 'مؤسس';
                        if (dateEl) dateEl.textContent = 'فبراير 2025';
                        if (textEl) textEl.textContent = '"شيء واحد أقل يدعو للقلق عند إطلاق منتج جديد. ما عليك سوى السحب والإفلات والحصول على أيقونات مثالية."';
                    } else if (author === 'Nina S.') {
                        if (roleEl) roleEl.textContent = 'مصمم ويب مستقل';
                        if (dateEl) dateEl.textContent = 'أغسطس 2025';
                        if (textEl) textEl.textContent = '"أوصي بهذه الأداة لجميع زملائي. إنها تتعامل مع الشفافية بشكل مثالي وملفات ICO صالحة دائماً."';
                    } else if (author === 'Tom H.') {
                        if (roleEl) roleEl.textContent = 'المدير التقني (CTO)';
                        if (dateEl) dateEl.textContent = 'يوليو 2025';
                        if (textEl) textEl.textContent = '"بسيطة وفعالة وتفعل ما تقوله بالضبط. لا توجد ميزات غير ضرورية، مجرد أداة قوية ومفيدة."';
                    } else if (author === 'Laura C.') {
                        if (roleEl) roleEl.textContent = 'مدون';
                        if (dateEl) dateEl.textContent = 'يونيو 2025';
                        if (textEl) textEl.textContent = '"لست خبيراً تقنياً، لكن هذه الأداة سهلت عليّ للغاية الحصول على أيقونة احترافية لمدونتي. شكراً لكم!"';
                    }
                }
            });
        }

        // Section 8: What's Included in Your Download
        let whatsIncludedSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes("What's Included in Your Download")) {
                whatsIncludedSec = sec;
            }
        });

        if (whatsIncludedSec) {
            const title = whatsIncludedSec.querySelector('h2.section-title');
            if (title) title.textContent = 'ما الذي تتضمنه حزمة التنزيل؟';

            const subtitle = whatsIncludedSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.innerHTML = 'كل الملفات التي تحتاجها لضمان دعم كامل لـ <strong>Favicon</strong> عبر جميع المتصفحات والأجهزة.';

            // favicon.ico
            const fcIco = whatsIncludedSec.querySelector('#file-favicon-ico');
            if (fcIco) {
                const badge = fcIco.querySelector('.file-badge');
                const p = fcIco.querySelector('p');
                if (badge) badge.textContent = 'ICO';
                if (p) p.innerHTML = 'تنسيق <strong>ICO</strong> الكلاسيكي متعدد الأحجام، ويحتوي على أيقونات بمقاسات <strong>16×16</strong> و<strong>32×32</strong> و<strong>48×48</strong> بكسل. ضروري لدعم المتصفحات القديمة، بما في ذلك الإصدارات السابقة من <strong>Internet Explorer</strong>.';
            }

            // favicon-16
            const fc16 = whatsIncludedSec.querySelector('#file-favicon-16');
            if (fc16) {
                const badge = fc16.querySelector('.file-badge');
                const p = fc16.querySelector('p');
                if (badge) badge.textContent = '16';
                if (p) p.innerHTML = 'أيقونة علامة التبويب القياسية بحجم <strong>16×16</strong> بكسل، وتستخدمها معظم المتصفحات الحديثة كأيقونة <strong>Favicon</strong> الأساسية.';
            }

            // favicon-32
            const fc32 = whatsIncludedSec.querySelector('#file-favicon-32');
            if (fc32) {
                const badge = fc32.querySelector('.file-badge');
                const p = fc32.querySelector('p');
                if (badge) badge.textContent = '32';
                if (p) p.innerHTML = 'أيقونة عالية الدقة بحجم <strong>32×32</strong> بكسل، مخصصة لشاشات <strong>Retina</strong> و<strong>HiDPI</strong> لعرض أكثر وضوحًا.';
            }

            // apple-touch-icon
            const fcApple = whatsIncludedSec.querySelector('#file-apple-touch');
            if (fcApple) {
                const badge = fcApple.querySelector('.file-badge');
                const p = fcApple.querySelector('p');
                if (badge) badge.textContent = '180';
                if (p) p.innerHTML = 'أيقونة <strong>Apple Touch</strong> بحجم <strong>180×180</strong> بكسل لأجهزة <strong>iPhone</strong> و<strong>iPad</strong> و<strong>iPod Touch</strong>، وتظهر عند إضافة الموقع إلى الشاشة الرئيسية.';
            }

            // android-chrome-192
            const fc192 = whatsIncludedSec.querySelector('#file-android-192');
            if (fc192) {
                const badge = fc192.querySelector('.file-badge');
                const p = fc192.querySelector('p');
                if (badge) badge.textContent = '192';
                if (p) p.innerHTML = 'أيقونة الشاشة الرئيسية لنظام <strong>Android</strong> بحجم <strong>192×192</strong> بكسل، تُستخدم عند إضافة الموقع إلى الشاشة الرئيسية عبر <strong>Chrome</strong>.';
            }

            // android-chrome-512
            const fc512 = whatsIncludedSec.querySelector('#file-android-512');
            if (fc512) {
                const badge = fc512.querySelector('.file-badge');
                const p = fc512.querySelector('p');
                if (badge) badge.textContent = '512';
                if (p) p.innerHTML = 'أيقونة <strong>PWA</strong> عالية الدقة بحجم <strong>512×512</strong> بكسل، مطلوبة لتطبيقات الويب التقدمية وشاشات البدء.';
            }

            // site.webmanifest
            const fcManifest = whatsIncludedSec.querySelector('#file-manifest');
            if (fcManifest) {
                const badge = fcManifest.querySelector('.file-badge');
                const p = fcManifest.querySelector('p');
                if (badge) badge.textContent = 'JSON';
                if (p) p.innerHTML = 'ملف <strong>Web App Manifest</strong> الذي يحتوي على مراجع الأيقونات ولون السمة ولون الخلفية، ويُعد عنصرًا أساسيًا لدعم <strong>PWA</strong> والتكامل مع الشاشة الرئيسية في <strong>Android</strong>.';
            }
        }

        // Header Navbar Links
        const navLinksList = doc.querySelectorAll('#navLinks a');
        navLinksList.forEach(link => {
            const text = link.textContent.trim();
            if (text === 'Converter') link.textContent = 'المحول';
            else if (text === 'Text to Favicon') link.textContent = 'نص إلى أيقونة';
            else if (text === 'Emoji to Favicon') link.textContent = 'رمز تعبيري إلى أيقونة';
            else if (text === 'Favicon Checker') link.textContent = 'فاحص الأيقونات';
            else if (text === 'Tutorials') link.textContent = 'دروس تعليمية';
            else if (text === 'Blog') link.textContent = 'المدونة';
        });

        // FAQ Section
        let faqSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Frequently Asked Questions')) {
                faqSec = sec;
            }
        });

        if (faqSec) {
            const title = faqSec.querySelector('h2');
            if (title) title.textContent = 'الأسئلة الشائعة';

            const subtitle = faqSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'اعثر على إجابات للأسئلة الشائعة حول خدمة تحويل أيقونات المواقع الخاصة بنا';

            const items = faqSec.querySelectorAll('.faq-item');
            if (items.length >= 4) {
                // Item 1
                const q_1 = items[0].querySelector('summary h3') || items[0].querySelector('summary');
                const a_1 = items[0].querySelector('.faq-answer');
                if (q_1) q_1.textContent = 'لماذا أستخدم أيقونة نصية بدلاً من صورة؟';
                if (a_1) a_1.textContent = 'تعد الأيقونات النصية مثالية للعلامات التجارية في مراحلها الأولى، وحافظات الأعمال الشخصية، والمدونات، والمواقع البسيطة الأنيقة. يسهل التعرف على الأحرف الأولى في علامات تبويب المتصفح المزدحمة، مما يعزز تمييز العلامة التجارية دون الحاجة إلى تصميم رسومي معقد.';

                // Item 2
                const q_2 = items[1].querySelector('summary h3') || items[1].querySelector('summary');
                const a_2 = items[1].querySelector('.faq-answer');
                if (q_2) q_2.textContent = 'ما هو الخط الأنسب لأيقونة الموقع (Favicon)؟';
                if (a_2) a_2.textContent = 'يُوصى بشدة باستخدام الخطوط العريضة والسميكة من نوع sans-serif مثل Space Grotesk وMontserrat وOutfit. كما تبدو الخطوط أحادية المسافة (Monospaced) ممتازة أيضاً. حاول تجنب الخطوط الرفيعة للغاية، لأنها تصبح غير مقروءة عند تصغيرها إلى مقاس 16×16 بكسل.';

                // Item 3
                const q_3 = items[2].querySelector('summary h3') || items[2].querySelector('summary');
                const a_3 = items[2].querySelector('.faq-answer');
                if (q_3) q_3.textContent = 'هل بياناتي خاصة وآمنة على هذا الموقع؟';
                if (a_3) a_3.textContent = 'نعم، بنسبة 100%. يعمل المولد بالكامل داخل متصفح الويب الخاص بك باستخدام HTML5 Canvas. لا يتم رفع نصوصك وتصميماتك المخصصة والملفات التي تم إنشاؤها إلى خوادمنا، مما يحافظ على خصوصية هوية علامتك التجارية.';

                // Item 4
                const q_4 = items[3].querySelector('summary h3') || items[3].querySelector('summary');
                const a_4 = items[3].querySelector('.faq-answer');
                if (q_4) q_4.textContent = 'ما هي تنسيقات الملفات التي تنتجها هذه الأداة؟';
                if (a_4) a_4.innerHTML = 'ينتج مولد الأيقونات النصية الخاص بنا ملف <strong>favicon.ico</strong> قياسي متعدد الأحجام (يحتوي على مقاسات 16 و32 و48 بكسل)، وعدة أيقونات <strong>PNG</strong> عالية الدقة لعلامات تبويب المتصفح، وأيقونات <strong>Apple Touch</strong> بحجم 180×180 بكسل، وأيقونات <strong>Android Chrome</strong> بمقاسات 192×192 و512×512 بكسل، وملف التكوين <strong>site.webmanifest</strong>.';
            }
        }

        // CTA Section
        let ctaSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Start Converting PNG to Favicon')) {
                ctaSec = sec;
            }
        });

        if (ctaSec) {
            const h2 = ctaSec.querySelector('h2');
            if (h2) h2.textContent = 'ابدأ بتحويل PNG إلى Favicon مجاناً اليوم';

            const p = ctaSec.querySelector('p');
            if (p) p.textContent = 'انضم إلى أكثر من 50,000 مستخدم يثقون بموقع PNGtoFavicon.com لإنشاء أيقونات دقيقة وسريعة ومجانية تماماً.';

            const btn = ctaSec.querySelector('.btn');
            if (btn) btn.textContent = 'ابدأ التحويل الآن - إنه مجاني!';
        }

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                waLink.childNodes.forEach(node => {
                    if (node.nodeType === 3 && node.textContent.trim().includes('Chat on WhatsApp')) {
                        node.textContent = 'دردشة عبر واتساب';
                    }
                });
            }

            // Columns headers
            const colHeaders = footer.querySelectorAll('h4');
            colHeaders.forEach(h4 => {
                const text = h4.textContent.trim();
                if (text === 'Tools') h4.textContent = 'الأدوات';
                else if (text === 'Resources') h4.textContent = 'المصادر';
                else if (text === 'Company') h4.textContent = 'الشركة';
            });

            // Links
            const footerLinks = footer.querySelectorAll('a');
            footerLinks.forEach(link => {
                const text = link.textContent.trim();
                if (text === 'PNG to Favicon Converter') link.textContent = 'محول PNG إلى Favicon';
                else if (text === 'Text to Favicon') link.textContent = 'نص إلى أيقونة';
                else if (text === 'Emoji to Favicon') link.textContent = 'رمز تعبيري إلى أيقونة';
                else if (text === 'Favicon Checker') link.textContent = 'فاحص الأيقونات';
                else if (text === 'Tutorials') link.textContent = 'دروس تعليمية';
                else if (text === 'Blog') link.textContent = 'المدونة';
                else if (text === 'Favicon Sizes Guide') link.textContent = 'دليل مقاسات الأيقونات';
                else if (text === 'What is a Favicon?') link.textContent = 'ما هو الفافيكون (Favicon)؟';
                else if (text === 'About') link.textContent = 'من نحن';
                else if (text === 'Contact') link.textContent = 'اتصل بنا';
                else if (text === 'Privacy Policy') link.textContent = 'سياسة الخصوصية';
                else if (text === 'Terms of Service') link.textContent = 'شروط الخدمة';
                else if (text === 'Cookie Policy') link.textContent = 'سياسة ملفات الارتباط';
            });

            // Copyright text
            const copyright = footer.querySelector('.footer-bottom p');
            if (copyright) {
                copyright.textContent = '© 2026 PNGtoFavicon.com — جميع الحقوق محفوظة.';
            }
        }
    }

    // Custom logic for Arabic emoji-to-favicon page translation
    if (targetLang === 'ar' && normPath === 'emoji-to-favicon/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'مولّد الرموز التعبيرية إلى Favicon — أداة مجانية عبر الإنترنت | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'حوّل الرمز التعبيري المفضل لديك إلى حزمة أيقونة favicon كاملة. اختر الرمز، ونسق إطار الخلفية، وقم بتنزيل كافة الأحجام بنقرة واحدة.');

        // H1
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'مولّد <span class="gradient-text">الرموز التعبيرية</span> إلى Favicon';
        }

        // Subtitle
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'حوّل الرمز التعبيري المفضل لديك إلى حزمة أيقونة favicon كاملة. اختر الرمز، ونسق إطار الخلفية، وقم بتنزيل كافة الأحجام بنقرة واحدة.';
        }

        // Badges
        const badgeFree = doc.getElementById('badge-free');
        if (badgeFree) badgeFree.textContent = '💰 مجاني 100%';
        const badgeEmojis = doc.getElementById('badge-emojis');
        if (badgeEmojis) badgeEmojis.textContent = '🚀 أكثر من 1000 رمز تعبيري';
        const badgeStyle = doc.getElementById('badge-style');
        if (badgeStyle) badgeStyle.textContent = '⚙️ تنسيق تفاعلي';
        const badgePrivate = doc.getElementById('badge-private');
        if (badgePrivate) badgePrivate.textContent = '🔒 خاص وآمن 100%';

        // Controls Card / Settings Card Title
        const controlsTitle = doc.querySelector('.controls-card h3');
        if (controlsTitle) controlsTitle.textContent = '🚀 اختر ونسق الرمز التعبيري';

        // Labels
        doc.querySelectorAll('label').forEach(label => {
            const text = label.textContent.trim();
            if (text.includes('Selected Emoji')) {
                label.childNodes[0].textContent = 'الرمز التعبيري المحدد';
            } else if (text.includes('Background Color')) {
                label.textContent = 'لون الخلفية';
            } else if (text.includes('Keep transparent (Icon only)')) {
                label.childNodes[1].textContent = 'خلفية شفافة (أيقونة فقط)';
            } else if (text.includes('Background Shape')) {
                label.textContent = 'شكل الخلفية';
            } else if (text.includes('Emoji Scale')) {
                label.textContent = 'حجم الرمز التعبيري';
            } else if (text.includes('Include site.webmanifest')) {
                label.childNodes[1].textContent = 'تضمين ملف site.webmanifest (PWA)';
            }
        });

        // Select Options
        doc.querySelectorAll('select option').forEach(opt => {
            const text = opt.textContent.trim();
            if (text === 'Circle') opt.textContent = 'دائرة';
            else if (text === 'Rounded Square') opt.textContent = 'مربع بحواف مستديرة';
            else if (text === 'Square') opt.textContent = 'مربع';
        });

        // Preview Title
        const previewCol = doc.querySelector('.preview-col');
        if (previewCol) {
            const h3 = previewCol.querySelector('h3');
            if (h3) h3.textContent = '📦 المعاينة المباشرة';
            
            const zipBtn = previewCol.querySelector('#downloadZip');
            if (zipBtn) zipBtn.textContent = 'تنزيل حزمة Favicon (ZIP)';
        }

        // Copy panel
        const codeCol = doc.querySelector('.code-col');
        if (codeCol) {
            const h3 = codeCol.querySelector('h3');
            if (h3) h3.textContent = '🔗 نسخ ولصق كود HTML';
            
            const p = codeCol.querySelector('p');
            if (p) p.textContent = 'أضف هذا الكود إلى قسم <head> في صفحة HTML الخاصة بك:';

            const copyBtn = codeCol.querySelector('#copyCode');
            if (copyBtn) copyBtn.textContent = 'نسخ';
        }

        // Section 3: How This Tool Works
        let howItWorksSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('How this Emoji to Favicon')) {
                howItWorksSec = sec;
            }
        });

        if (howItWorksSec) {
            const h2 = howItWorksSec.querySelector('h2');
            if (h2) h2.textContent = 'كيف تعمل أداة تحويل الرموز التعبيرية إلى Favicon؟';

            const p = howItWorksSec.querySelector('p.section-subtitle');
            if (p) p.textContent = 'تعالج الأداة كل شيء محليًا داخل متصفحك بنسبة 100%، مما يضمن السرعة والخصوصية والأمان.';

            const steps = howItWorksSec.querySelectorAll('.step');
            if (steps.length >= 4) {
                // Step 1
                const h3_1 = steps[0].querySelector('h3');
                const p_1 = steps[0].querySelector('p');
                if (h3_1) h3_1.textContent = 'الرسم الفوري باستخدام Canvas';
                if (p_1) p_1.textContent = 'تستخدم الأداة HTML5 Canvas لرسم الخلفيات ورموز Emoji الأصلية للنظام مباشرةً وفي الوقت الفعلي داخل متصفحك.';

                // Step 2
                const h3_2 = steps[1].querySelector('h3');
                const p_2 = steps[1].querySelector('p');
                if (h3_2) h3_2.textContent = 'إنشاء ملف ICO';
                if (p_2) p_2.textContent = 'بدلاً من الاعتماد على أدوات أو خوادم خارجية، يقوم البرنامج بتجميع بيانات PNG الخام يدويًا لإنشاء بنية ICO ثنائية متوافقة بالكامل مع المعايير.';

                // Step 3
                const h3_3 = steps[2].querySelector('h3');
                const p_3 = steps[2].querySelector('p');
                if (h3_3) h3_3.textContent = 'إنشاء حزمة ZIP';
                if (p_3) p_3.textContent = 'تُنشأ جميع أحجام الأيقونات وملفات site.webmanifest الديناميكية مباشرةً داخل الذاكرة باستخدام JSZip الذي يعمل بالكامل داخل المتصفح.';

                // Step 4
                const h3_4 = steps[3].querySelector('h3');
                const p_4 = steps[3].querySelector('p');
                if (h3_4) h3_4.textContent = 'التنزيل مباشرة من المتصفح';
                if (p_4) p_4.textContent = 'تُحوَّل الحزمة إلى رابط Blob URL لتوفير تنزيل فوري وآمن، دون أي تفاعل مع الخوادم أو أي مخاطر على الخصوصية.';
            }

            const footerBadge = howItWorksSec.querySelector('.section-footer .badge');
            if (footerBadge) footerBadge.textContent = 'أدوات مجانية وآمنة للمطورين بنسبة 100%';
        }

        // Section 4: Why Generate
        let whyGenerateSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Why Generate Emoji Favicons')) {
                whyGenerateSec = sec;
            }
        });

        if (whyGenerateSec) {
            const h2 = whyGenerateSec.querySelector('h2');
            if (h2) h2.textContent = 'لماذا تنشئ Favicon من الرموز التعبيرية هنا؟';

            const p = whyGenerateSec.querySelector('p.section-subtitle');
            if (p) p.textContent = 'أداة مجانية متقدمة لإنشاء Favicons احترافية ومتوافقة مع جميع المتصفحات، بدقة عالية وسرعة فائقة.';

            const features = whyGenerateSec.querySelectorAll('.feature-card');
            if (features.length >= 6) {
                // 1
                const h3_1 = features[0].querySelector('h3');
                const p_1 = features[0].querySelector('p');
                if (h3_1) h3_1.textContent = 'محرك فوري يعمل داخل المتصفح';
                if (p_1) p_1.textContent = 'أنشئ حزم Favicon في أجزاء من الثانية باستخدام قوة المعالجة المحلية داخل متصفحك.';

                // 2
                const h3_2 = features[1].querySelector('h3');
                const p_2 = features[1].querySelector('p');
                if (h3_2) h3_2.textContent = 'إعادة تحجيم دقيقة على مستوى البكسل';
                if (p_2) p_2.textContent = 'تقنية تصغير عالية الدقة تحافظ على وضوح الحواف ودقة التفاصيل حتى عند أحجام 16×16 بكسل.';

                // 3
                const h3_3 = features[2].querySelector('h3');
                const p_3 = features[2].querySelector('p');
                if (h3_3) h3_3.textContent = 'يدعم جميع تنسيقات الصور';
                if (p_3) p_3.textContent = 'يعمل بسلاسة مع PNG وJPG وSVG وWEBP وGIF وغيرها من تنسيقات الصور الشائعة.';

                // 4
                const h3_4 = features[3].querySelector('h3');
                const p_4 = features[3].querySelector('p');
                if (h3_4) h3_4.textContent = 'دعم شامل لجميع الأجهزة';
                if (p_4) p_4.textContent = 'ينشئ ملفات ICO التقليدية، وأيقونات Apple Touch وأيقونات Android Chrome وPWA في حزمة ZIP واحدة.';

                // 5
                const h3_5 = features[4].querySelector('h3');
                const p_5 = features[4].querySelector('p');
                if (h3_5) h3_5.textContent = 'آمن وخاص بنسبة 100%';
                if (p_5) p_5.textContent = 'تتم معالجة الصور بالكامل محلياً. لا يتم رفع ملفاتك إلى أي خادم، مما يضمن سرية أصولك تماماً.';

                // 6
                const h3_6 = features[5].querySelector('h3');
                const p_6 = features[5].querySelector('p');
                if (h3_6) h3_6.textContent = 'مجاني بالكامل ومفتوح للجميع';
                if (p_6) p_6.textContent = 'لا يلزم التسجيل أو البريد الإلكتروني. وصول غير محدود لجميع أدوات المطورين مجاناً.';
            }

            const footerBadge = whyGenerateSec.querySelector('.section-footer .badge');
            if (footerBadge) footerBadge.textContent = 'ميزات قوية بين يديك';
        }

        // Section 5: Use Cases
        let useCasesSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Perfect for Every Use Case')) {
                useCasesSec = sec;
            }
        });

        if (useCasesSec) {
            const h2 = useCasesSec.querySelector('h2');
            if (h2) h2.textContent = 'مثالي لجميع الاستخدامات';

            const p = useCasesSec.querySelector('p.section-subtitle');
            if (p) p.textContent = 'اكتشف كيف يساعدك مولد Emoji to Favicon في مختلف السيناريوهات.';

            const cards = useCasesSec.querySelectorAll('.use-case-card');
            if (cards.length >= 4) {
                // 1
                const h3_1 = cards[0].querySelector('h3');
                const p_1 = cards[0].querySelector('p');
                if (h3_1) h3_1.textContent = 'مطورو الويب';
                if (p_1) p_1.textContent = 'أنشئ بسرعة جميع أحجام favicon المطلوبة لمشاريع الويب الخاصة بك من رمز تعبيري بسيط.';

                // 2
                const h3_2 = cards[1].querySelector('h3');
                const p_2 = cards[1].querySelector('p');
                if (h3_2) h3_2.textContent = 'مصممو UI/UX';
                if (p_2) p_2.textContent = 'تأكد من أن هوية علامتك التجارية تبدو واضحة ومثالية عبر جميع علامات تبويب المتصفح وشاشات الأجهزة.';

                // 3
                const h3_3 = cards[2].querySelector('h3');
                const p_3 = cards[2].querySelector('p');
                if (h3_3) h3_3.textContent = 'المدونون وصناع المحتوى';
                if (p_3) p_3.textContent = 'قم بتخصيص مدونتك الشخصية أو معرض أعمالك بسهولة مع أيقونة احترافية خلال ثوانٍ معدودة.';

                // 4
                const h3_4 = cards[3].querySelector('h3');
                const p_4 = cards[3].querySelector('p');
                if (h3_4) h3_4.textContent = 'أصحاب الأعمال';
                if (p_4) p_4.textContent = 'امنح موقعك مظهراً أكثر تميزاً واحترافية باستخدام Favicon عالية الجودة تعزز ثقة الزوار.';
            }

            const footerBadge = useCasesSec.querySelector('.section-footer .badge');
            if (footerBadge) footerBadge.textContent = 'موثوق به من قبل محترفين حول العالم';
        }

        // Section 6: Comparison Table
        let compSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Emoji Favicon Generator vs Other Tools')) {
                compSec = sec;
            }
        });

        if (compSec) {
            const h2 = compSec.querySelector('h2');
            if (h2) h2.textContent = 'مقارنةً بالأدوات الأخرى';

            const subtitle = compSec.querySelector('.section-subtitle');
            if (subtitle) subtitle.textContent = 'اطّلع على كيفية تفوق أداتنا على مولدات Favicon الأخرى.';

            const table = compSec.querySelector('#comparisonTable');
            if (table) {
                // Headers
                const ths = table.querySelectorAll('thead th');
                if (ths.length >= 3) {
                    ths[0].textContent = 'الميزة';
                    ths[1].textContent = 'أداتنا (Emoji to Favicon)';
                    ths[2].textContent = 'الأدوات الأخرى';
                }

                // Body rows
                const rows = table.querySelectorAll('tbody tr');
                if (rows.length >= 8) {
                    // Row 1: Price
                    rows[0].querySelectorAll('td')[0].textContent = 'السعر';
                    rows[0].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> مجاني مدى الحياة';
                    rows[0].querySelectorAll('td')[2].textContent = 'خطط مجانية محدودة أو مدفوعة';

                    // Row 2: Privacy
                    rows[1].querySelectorAll('td')[0].textContent = 'الخصوصية';
                    rows[1].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> معالجة محلية 100% داخل المتصفح';
                    rows[1].querySelectorAll('td')[2].textContent = 'يتم رفع الملفات إلى الخوادم';

                    // Row 3: Speed
                    rows[2].querySelectorAll('td')[0].textContent = 'السرعة';
                    rows[2].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> معالجة فورية';
                    rows[2].querySelectorAll('td')[2].textContent = 'تعتمد على ضغط الخادم';

                    // Row 4: File Formats
                    rows[3].querySelectorAll('td')[0].textContent = 'تنسيقات الملفات';
                    rows[3].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> ICO + PNG + Manifest';
                    rows[3].querySelectorAll('td')[2].textContent = 'غالبًا تدعم ICO فقط';

                    // Row 5: Registration
                    rows[4].querySelectorAll('td')[0].textContent = 'بدون تسجيل';
                    rows[4].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> لا يتطلب إنشاء حساب';
                    rows[4].querySelectorAll('td')[2].textContent = 'قد يكون التسجيل مطلوبًا';

                    // Row 6: Platform Support
                    rows[5].querySelectorAll('td')[0].textContent = 'دعم المنصات';
                    rows[5].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> يعمل على جميع الأجهزة والمتصفحات';
                    rows[5].querySelectorAll('td')[2].textContent = 'دعم محدود لبعض المنصات';

                    // Row 7: HTML Code
                    rows[6].querySelectorAll('td')[0].textContent = 'مقتطف كود HTML';
                    rows[6].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> يتم إنشاؤه تلقائيًا';
                    rows[6].querySelectorAll('td')[2].textContent = 'يتطلب إضافته يدويًا';

                    // Row 8: Open Source
                    rows[7].querySelectorAll('td')[0].textContent = 'مفتوح المصدر';
                    rows[7].querySelectorAll('td')[1].innerHTML = '<span class="check-icon">✅</span> عملية شفافة';
                    rows[7].querySelectorAll('td')[2].textContent = 'حلول مغلقة المصدر';
                }
            }
        }

        // Section 7: Testimonials
        let testimonialsSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('What Our Users Say')) {
                testimonialsSec = sec;
            }
        });

        if (testimonialsSec) {
            const h2 = testimonialsSec.querySelector('h2');
            if (h2) h2.textContent = 'ماذا يقول مستخدمونا؟';

            const subtitle = testimonialsSec.querySelector('.section-subtitle') || testimonialsSec.querySelector('p');
            if (subtitle) subtitle.textContent = 'يثق أكثر من 50,000 مطور ومصمم وصانع محتوى في PNGtoFavicon لإنجاز مشاريعهم.';

            const cards = testimonialsSec.querySelectorAll('.review-card');
            cards.forEach(card => {
                const authorRoleEl = card.querySelector('.review-meta p');
                const dateEl = card.querySelector('.review-date');
                const quoteEl = card.querySelector('p:not(.review-meta p)');

                if (authorRoleEl) {
                    const roleText = authorRoleEl.textContent.trim();
                    if (roleText === 'Frontend Developer') authorRoleEl.textContent = 'مطوّر واجهات أمامية';
                    else if (roleText === 'UI/UX Designer') authorRoleEl.textContent = 'مصممة UI/UX';
                    else if (roleText === 'Indie Hacker') authorRoleEl.textContent = 'مطور مستقل (Indie Hacker)';
                    else if (roleText === 'Agency Owner') authorRoleEl.textContent = 'صاحب وكالة تصميم';
                    else if (roleText === 'Full Stack Dev') authorRoleEl.textContent = 'مطور Full Stack';
                    else if (roleText === 'Product Manager') authorRoleEl.textContent = 'مدير منتج';
                    else if (roleText === 'Software Engineer') authorRoleEl.textContent = 'مهندس برمجيات';
                    else if (roleText === 'Marketing Director') authorRoleEl.textContent = 'مديرة تسويق';
                    else if (roleText === 'Startup Founder') authorRoleEl.textContent = 'مؤسس شركة ناشئة';
                    else if (roleText === 'Freelance Web Designer') authorRoleEl.textContent = 'مصمم ويب مستقل';
                    else if (roleText === 'CTO') authorRoleEl.textContent = 'مدير تكنولوجيا (CTO)';
                    else if (roleText === 'Blogger') authorRoleEl.textContent = 'مدون';
                }

                if (dateEl) {
                    const dateText = dateEl.textContent.trim();
                    if (dateText.includes('Oct')) dateEl.textContent = dateText.replace('Oct', 'أكتوبر');
                    else if (dateText.includes('Sep')) dateEl.textContent = dateText.replace('Sep', 'سبتمبر');
                    else if (dateText.includes('Aug')) dateEl.textContent = dateText.replace('Aug', 'أغسطس');
                    else if (dateText.includes('Jul')) dateEl.textContent = dateText.replace('Jul', 'يوليو');
                    else if (dateText.includes('Jun')) dateEl.textContent = dateText.replace('Jun', 'يونيو');
                    else if (dateText.includes('May')) dateEl.textContent = dateText.replace('May', 'مايو');
                    else if (dateText.includes('Apr')) dateEl.textContent = dateText.replace('Apr', 'أبريل');
                    else if (dateText.includes('Mar')) dateEl.textContent = dateText.replace('Mar', 'مارس');
                    else if (dateText.includes('Feb')) dateEl.textContent = dateText.replace('Feb', 'فبراير');
                    else if (dateText.includes('Nov')) dateEl.textContent = dateText.replace('Nov', 'نوفمبر');
                }

                if (quoteEl) {
                    const text = quoteEl.textContent.trim();
                    if (text.includes("fastest way to get a clean favicon") || text.includes("fastest way to generate all favicon sizes")) {
                        quoteEl.textContent = '"أسرع طريقة لإنشاء جميع أحجام الأيقونات. يستغرق الأمر ثانيتين فقط ويتعامل مع ملف site.webmanifest الجديد بشكل مثالي."';
                    } else if (text.includes("I used to use 3 different tools") || text.includes("The transparency support is flawless")) {
                        quoteEl.textContent = '"دعم الشفافية لا تشوبه شائبة. الرمز التعبيري على لوح رسم شفاف تبدو مذهلة تماماً."';
                    } else if (text.includes("Clean interface, no ads, and it respects privacy") || text.includes("No subscriptions, no watermarks")) {
                        quoteEl.textContent = '"لا اشتراكات، ولا علامات مائية. أداة ممتازة ومباشرة للمطورين!"';
                    } else if (text.includes("We use this for all our client projects now") || text.includes("Having the site.webmanifest auto-generated")) {
                        quoteEl.textContent = '"توليد ملف site.webmanifest تلقائياً يوفر الكثير من الوقت لأجهزة Android."';
                    } else if (text.includes("Finally a favicon generator that understands") || text.includes("We build dozens of client landing pages")) {
                        quoteEl.textContent = '"نبني عشرات الصفحات الهبوط لعملائنا، وهذه الأداة أصبحت خيارنا الأساسي لإنشاء أيقونات favicon فورية."';
                    } else if (text.includes("Super reliable tool") || text.includes("Clean code output and immediate zip downloads")) {
                        quoteEl.textContent = '"مخرجات كود نظيفة وتنزيل ملف zip فوري. أداة رائعة ومتقنة جداً!"';
                    } else if (text.includes("Absolutely flawless execution") || text.includes("Perfect for bootstrapping new ideas")) {
                        quoteEl.textContent = '"مثالية لإطلاق الأفكار الجديدة بسرعة. بضع ثوانٍ والـ favicon جاهزة بالكامل."';
                    } else if (text.includes("It took me less than a minute") || text.includes("Love the simple user interface")) {
                        quoteEl.textContent = '"أعشق واجهة المستخدم البسيطة. لا تعقيد، فقط اختر الرمز التعبيري وقم بالتنزيل."';
                    } else if (text.includes("One less thing to worry about") || text.includes("It has saved me so much time")) {
                        quoteEl.textContent = '"لقد وفرت علي الكثير من الوقت مقارنة بفتح Photoshop لقص وتصدير الأيقونات."';
                    } else if (text.includes("I recommend this tool to all my peers") || text.includes("Beautifully designed and extremely fast")) {
                        quoteEl.textContent = '"تصميم جميل وسريع للغاية. أداة خفيفة ومريحة جداً للاستخدام."';
                    } else if (text.includes("Simple, effective, and does exactly") || text.includes("The Apple Touch Icon size works perfectly")) {
                        quoteEl.textContent = '"حجم أيقونة Apple Touch يعمل بشكل مثالي على أجهزة iOS. ممتاز!"';
                    } else if (text.includes("I am not very technical, but this tool made it so easy") || text.includes("Highly recommended tool for any blogger")) {
                        quoteEl.textContent = '"أداة موصى بها بشدة لأي مدون يريد تخصيص موقعه في ثوانٍ."';
                    }
                }
            });
        }

        // Section 8: What's Included in Your Download
        let whatsIncludedSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes("What's Included in Your Download")) {
                whatsIncludedSec = sec;
            }
        });

        if (whatsIncludedSec) {
            const h2 = whatsIncludedSec.querySelector('h2');
            if (h2) h2.textContent = 'ما الذي تتضمنه حزمة التنزيل؟';

            const subtitle = whatsIncludedSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'كل الملفات التي تحتاجها لضمان دعم كامل لـ Favicon عبر جميع المتصفحات والأجهزة.';

            // favicon.ico
            const fcIco = whatsIncludedSec.querySelector('#file-ico');
            if (fcIco) {
                const badge = fcIco.querySelector('.file-badge');
                const p = fcIco.querySelector('p');
                if (badge) badge.textContent = 'ICO';
                if (p) p.innerHTML = 'تنسيق <strong>ICO</strong> الكلاسيكي متعدد الأحجام، ويحتوي على أيقونات بمقاسات <strong>16×16</strong> و<strong>32×32</strong> و<strong>48×48</strong> بكسل. مطلوب لدعم المتصفحات القديمة.';
            }

            // favicon-16
            const fc16 = whatsIncludedSec.querySelector('#file-png-16');
            if (fc16) {
                const badge = fc16.querySelector('.file-badge');
                const p = fc16.querySelector('p');
                if (badge) badge.textContent = '16';
                if (p) p.innerHTML = 'أيقونة متصفح قياسية بمقاس <strong>16×16</strong> بكسل لعلامات التبويب. تستخدمها معظم المتصفحات كأيقونة رئيسية.';
            }

            // favicon-32
            const fc32 = whatsIncludedSec.querySelector('#file-png-32');
            if (fc32) {
                const badge = fc32.querySelector('.file-badge');
                const p = fc32.querySelector('p');
                if (badge) badge.textContent = '32';
                if (p) p.innerHTML = 'أيقونة متصفح عالية الدقة بمقاس <strong>32×32</strong> بكسل لعلامات التبويب، تُعرض على شاشات <strong>Retina</strong> و<strong>HiDPI</strong> لمنح وضوح إضافي.';
            }

            // apple-touch
            const fcApple = whatsIncludedSec.querySelector('#file-apple');
            if (fcApple) {
                const badge = fcApple.querySelector('.file-badge');
                const p = fcApple.querySelector('p');
                if (badge) badge.textContent = '180';
                if (p) p.innerHTML = 'أيقونة <strong>Apple Touch</strong> بمقاس <strong>180×180</strong> بكسل لأجهزة <strong>iPhone</strong> و<strong>iPad</strong>، تُعرض عند إضافة الموقع إلى الشاشة الرئيسية.';
            }

            // android-chrome-192
            const fc192 = whatsIncludedSec.querySelector('#file-android-192');
            if (fc192) {
                const badge = fc192.querySelector('.file-badge');
                const p = fc192.querySelector('p');
                if (badge) badge.textContent = '192';
                if (p) p.innerHTML = 'أيقونة الشاشة الرئيسية لنظام <strong>Android</strong> بحجم <strong>192×192</strong> بكسل، تُستخدم عند إضافة الموقع إلى الشاشة الرئيسية عبر <strong>Chrome</strong>.';
            }

            // android-chrome-512
            const fc512 = whatsIncludedSec.querySelector('#file-android-512');
            if (fc512) {
                const badge = fc512.querySelector('.file-badge');
                const p = fc512.querySelector('p');
                if (badge) badge.textContent = '512';
                if (p) p.innerHTML = 'أيقونة <strong>PWA</strong> عالية الدقة بحجم <strong>512×512</strong> بكسل، مطلوبة لتطبيقات الويب التقدمية وشاشات البدء.';
            }

            // site.webmanifest
            const fcManifest = whatsIncludedSec.querySelector('#file-manifest');
            if (fcManifest) {
                const badge = fcManifest.querySelector('.file-badge');
                const p = fcManifest.querySelector('p');
                if (badge) badge.textContent = 'JSON';
                if (p) p.innerHTML = 'ملف <strong>Web App Manifest</strong> الذي يحتوي على مراجع الأيقونات ولون السمة ولون الخلفية، ويُعد عنصرًا أساسيًا لدعم <strong>PWA</strong> والتكامل مع الشاشة الرئيسية في <strong>Android</strong>.';
            }
        }

        // Header Navbar Links
        const navLinksList = doc.querySelectorAll('#navLinks a');
        navLinksList.forEach(link => {
            const text = link.textContent.trim();
            if (text === 'Converter') link.textContent = 'المحول';
            else if (text === 'Text to Favicon') link.textContent = 'نص إلى أيقونة';
            else if (text === 'Emoji to Favicon') link.textContent = 'رمز تعبيري إلى أيقونة';
            else if (text === 'Favicon Checker') link.textContent = 'فاحص الأيقونات';
            else if (text === 'Tutorials') link.textContent = 'دروس تعليمية';
            else if (text === 'Blog') link.textContent = 'المدونة';
        });

        // FAQ Section
        let faqSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Frequently Asked Questions')) {
                faqSec = sec;
            }
        });

        if (faqSec) {
            const title = faqSec.querySelector('h2');
            if (title) title.textContent = 'الأسئلة الشائعة';

            const subtitle = faqSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'اعثر على إجابات للأسئلة الشائعة حول خدمة تحويل أيقونات المواقع الخاصة بنا';

            const items = faqSec.querySelectorAll('.faq-item');
            if (items.length >= 4) {
                // Item 1
                const q_1 = items[0].querySelector('summary h3') || items[0].querySelector('summary');
                const a_1 = items[0].querySelector('.faq-answer');
                if (q_1) q_1.textContent = 'لماذا أستخدم رمزاً تعبيرياً (Emoji) كأيقونة موقع؟';
                if (a_1) a_1.textContent = 'تعد أيقونات الرموز التعبيرية (Emoji) ممتعة ومعبرة وسهلة التعرف عليها على الفور. وهي رائعة لأدوات المطورين، والمدونات الشخصية، ومشاريع SaaS، وتطبيقات الويب الخفيفة. ونظراً لأن الرموز التعبيرية قياسية للغاية، فإنها تبدو متسقة عبر شاشات العرض المتنوعة.';

                // Item 2
                const q_2 = items[1].querySelector('summary h3') || items[1].querySelector('summary');
                const a_2 = items[1].querySelector('.faq-answer');
                if (q_2) q_2.textContent = 'هل تعمل هذه الأداة مع الرموز التعبيرية المخصصة للنظام؟';
                if (a_2) a_2.textContent = 'نعم! يمكنك كتابة أو لصق أي رمز تعبيري مفرد مباشرة في حقل "الرمز التعبيري المحدد"، وسيقوم لوح الرسم الخاص بنا برسمه على الفور.';

                // Item 3
                const q_3 = items[2].querySelector('summary h3') || items[2].querySelector('summary');
                const a_3 = items[2].querySelector('.faq-answer');
                if (q_3) q_3.textContent = 'هل يمكنني جعل الخلفية شفافة؟';
                if (a_3) a_3.textContent = 'نعم. حدد خيار "خلفية شفافة (أيقونة فقط)"، وستقوم الأداة برسم الرمز التعبيري مباشرة على لوح رسم شفاف، وحفظه كملفات PNG شفافة.';

                // Item 4
                const q_4 = items[3].querySelector('summary h3') || items[3].querySelector('summary');
                const a_4 = items[3].querySelector('.faq-answer');
                if (q_4) q_4.textContent = 'هل هذه الأيقونات مجانية للاستخدام التجاري؟';
                if (a_4) a_4.textContent = 'الرموز التعبيرية الأصلية للنظام التي يتم رسمها على لوح الرسم هي خطوط نظام قياسية، وهي آمنة للنشر والاستخدام الشخصي والتجاري على الويب.';
            }
        }

        // CTA Section
        let ctaSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Start Converting PNG to Favicon')) {
                ctaSec = sec;
            }
        });

        if (ctaSec) {
            const h2 = ctaSec.querySelector('h2');
            if (h2) h2.textContent = 'ابدأ بتحويل PNG إلى Favicon مجاناً اليوم';

            const p = ctaSec.querySelector('p');
            if (p) p.textContent = 'انضم إلى أكثر من 50,000 مستخدم يثقون بموقع PNGtoFavicon.com لإنشاء أيقونات دقيقة وسريعة ومجانية تماماً.';

            const btn = ctaSec.querySelector('.btn');
            if (btn) btn.textContent = 'ابدأ التحويل الآن - إنه مجاني!';
        }

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                waLink.childNodes.forEach(node => {
                    if (node.nodeType === 3 && node.textContent.trim().includes('Chat on WhatsApp')) {
                        node.textContent = 'دردشة عبر واتساب';
                    }
                });
            }

            // Columns headers
            const colHeaders = footer.querySelectorAll('h4');
            colHeaders.forEach(h4 => {
                const text = h4.textContent.trim();
                if (text === 'Tools') h4.textContent = 'الأدوات';
                else if (text === 'Resources') h4.textContent = 'المصادر';
                else if (text === 'Company') h4.textContent = 'الشركة';
            });

            // Links
            const footerLinks = footer.querySelectorAll('a');
            footerLinks.forEach(link => {
                const text = link.textContent.trim();
                if (text === 'PNG to Favicon Converter') link.textContent = 'محول PNG إلى Favicon';
                else if (text === 'Text to Favicon') link.textContent = 'نص إلى أيقونة';
                else if (text === 'Emoji to Favicon') link.textContent = 'رمز تعبيري إلى أيقونة';
                else if (text === 'Favicon Checker') link.textContent = 'فاحص الأيقونات';
                else if (text === 'Tutorials') link.textContent = 'دروس تعليمية';
                else if (text === 'Blog') link.textContent = 'المدونة';
                else if (text === 'Favicon Sizes Guide') link.textContent = 'دليل مقاسات الأيقونات';
                else if (text === 'What is a Favicon?') link.textContent = 'ما هو الفافيكون (Favicon)؟';
                else if (text === 'About') link.textContent = 'من نحن';
                else if (text === 'Contact') link.textContent = 'اتصل بنا';
                else if (text === 'Privacy Policy') link.textContent = 'سياسة الخصوصية';
                else if (text === 'Terms of Service') link.textContent = 'شروط الخدمة';
                else if (text === 'Cookie Policy') link.textContent = 'سياسة ملفات الارتباط';
            });

            // Copyright text
            const copyright = footer.querySelector('.footer-bottom p');
            if (copyright) {
                copyright.textContent = '© 2026 PNGtoFavicon.com — جميع الحقوق محفوظة.';
            }
        }
    }

    // Translate Head elements (title and meta tags)
    if (doc.title && dict[doc.title.trim()]) {
        doc.title = dict[doc.title.trim()];
    }
    doc.querySelectorAll('meta[name="description"], meta[name="keywords"], meta[property="og:title"], meta[property="og:description"], meta[property="twitter:title"], meta[property="twitter:description"]').forEach(meta => {
        const content = meta.getAttribute('content');
        if (content && dict[content.trim()]) {
            meta.setAttribute('content', dict[content.trim()]);
        }
    });

    // Translate specific attributes (aria-label, placeholder, alt, title)
    doc.querySelectorAll('[aria-label], [placeholder], [alt], [title]').forEach(el => {
        ['aria-label', 'placeholder', 'alt', 'title'].forEach(attr => {
            const val = el.getAttribute(attr);
            if (val && dict[val.trim()]) {
                el.setAttribute(attr, dict[val.trim()]);
            }
        });
    });

    // Translate JSON-LD scripts (structured schema data)
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
            const data = JSON.parse(script.textContent);
            
            const translateObject = (obj) => {
                if (typeof obj === 'string') {
                    const trimmed = obj.trim();
                    if (dict[trimmed]) {
                        return dict[trimmed];
                    }
                    return obj;
                } else if (Array.isArray(obj)) {
                    return obj.map(translateObject);
                } else if (typeof obj === 'object' && obj !== null) {
                    const newObj = {};
                    for (const key in obj) {
                        newObj[key] = translateObject(obj[key]);
                    }
                    return newObj;
                }
                return obj;
            };
            
            const translatedData = translateObject(data);
            script.textContent = JSON.stringify(translatedData, null, 2);
        } catch (e) {
            console.error("Error translating JSON-LD script", e);
        }
    });

    const treeWalker = doc.createTreeWalker(doc.body, dom.window.NodeFilter.SHOW_TEXT);
    let currentNode;
    while (currentNode = treeWalker.nextNode()) {
        if (isTranslatable(currentNode)) {
            const originalText = currentNode.nodeValue;
            const trimmedText = originalText.trim();
            if (dict[trimmedText]) {
                const leadingSpace = originalText.match(/^\s*/)[0];
                const trailingSpace = originalText.match(/\s*$/)[0];
                currentNode.nodeValue = leadingSpace + dict[trimmedText] + trailingSpace;
            }
        }
    }
    
    // Save file
    fs.writeFileSync(destPath, dom.serialize(), 'utf8');
}

async function run() {
    const files = getFilesToLocalize(__dirname);
    console.log(`Found ${files.length} HTML files to localize.`);
    
    // First, fix the English source files metadata
    fixEnglishSourceFiles(files);
    
    // Then generate the hreflang alternate tags and inject language switcher into English pages
    console.log("--- Generating hreflangs and dropdowns for English source files ---");
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        const html = fs.readFileSync(filePath, 'utf8');
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        generateHreflangTags(file, doc);
        injectLanguageDropdown(file, doc, 'en');
        fs.writeFileSync(filePath, dom.serialize(), 'utf8');
    });

    // Now generate the localized versions for all target languages
    for (const lang of languages) {
        console.log(`\n--- Starting localization for ${lang} ---`);
        for (const file of files) {
            console.log(`Localizing ${file} to ${lang}...`);
            await localizePage(file, lang);
        }
    }
    console.log("\n*** Multilingual Build Complete! ***");
}

run().catch(console.error);
