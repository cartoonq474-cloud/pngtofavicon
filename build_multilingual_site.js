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
        const badgeStyle = doc.getElementById('badge-custom');
        if (badgeStyle) badgeStyle.textContent = '⚙️ التنسيق التفاعلي';
        const badgePrivate = doc.getElementById('badge-private');
        if (badgePrivate) badgePrivate.textContent = '🔒 خاص وآمن 100%';

        // Controls Card / Settings Card Title
        const controlsTitle = doc.querySelector('.tool-input h3');
        if (controlsTitle) controlsTitle.textContent = '🚀 اختر ونسق الرمز التعبيري';

        // Labels
        doc.querySelectorAll('label').forEach(label => {
            const text = label.textContent.trim();
            if (text.includes('Selected Emoji')) {
                label.textContent = 'الرمز التعبيري المحدد';
            } else if (text.includes('Background Color')) {
                label.textContent = 'لون الخلفية';
            } else if (text.includes('Keep transparent (Icon only)')) {
                if (label.childNodes[2]) label.childNodes[2].textContent = ' خلفية شفافة (أيقونة فقط)';
            } else if (text.includes('Background Shape')) {
                label.textContent = 'شكل الخلفية';
            } else if (text.includes('Emoji Scale')) {
                label.textContent = 'حجم الرمز التعبيري';
            } else if (text.includes('Include site.webmanifest')) {
                if (label.childNodes[2]) label.childNodes[2].textContent = ' تضمين ملف site.webmanifest (PWA)';
            }
        });

        // Select Options
        doc.querySelectorAll('select option').forEach(opt => {
            const text = opt.textContent.trim();
            if (text === 'Circle') opt.textContent = 'دائرة';
            else if (text === 'Rounded Square') opt.textContent = 'مربع بحواف مستديرة';
            else if (text === 'Square') opt.textContent = 'مربع';
        });

        // Preview & Copy panels
        const toolOutput = doc.querySelector('.tool-output');
        if (toolOutput) {
            const h3List = toolOutput.querySelectorAll('h3');
            if (h3List.length >= 2) {
                h3List[0].textContent = '📦 المعاينة المباشرة';
                h3List[1].textContent = '🔗 نسخ ولصق كود HTML';
            }
            
            const zipBtn = toolOutput.querySelector('#downloadAllBtn');
            if (zipBtn) zipBtn.textContent = 'تنزيل حزمة Favicon (ZIP)';

            toolOutput.querySelectorAll('p').forEach(p => {
                if (p.textContent.includes('Add this to your HTML')) {
                    p.textContent = 'أضف هذا الكود إلى قسم <head> في صفحة HTML الخاصة بك:';
                }
            });

            const copyBtn = toolOutput.querySelector('.copy-btn');
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
            if (p) p.textContent = 'اكتشف كيف يساعدك مولد الرموز التعبيرية إلى Favicon في مختلف السيناريوهات.';

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
            const accent = testimonialsSec.querySelector('.section-subtitle-accent');
            if (accent) accent.textContent = 'آراء المستخدمين';

            const h2 = testimonialsSec.querySelector('h2');
            if (h2) h2.textContent = 'ماذا يقول مستخدمونا؟';

            const subtitle = testimonialsSec.querySelector('.section-subtitle') || testimonialsSec.querySelector('p');
            if (subtitle) subtitle.textContent = 'يثق أكثر من 50,000 مطور ومصمم وصانع محتوى في PNGtoFavicon لإنجاز مشاريعهم.';

            // Rating Details
            const ratingDetails = testimonialsSec.querySelectorAll('.rating-details');
            ratingDetails.forEach(detail => {
                const count = detail.querySelector('.rating-count');
                if (count) {
                    const text = count.textContent.trim();
                    if (text.includes('Trustpilot')) {
                        count.textContent = 'تقييمات موثقة على Trustpilot';
                    } else if (text.includes('Capterra')) {
                        count.textContent = 'تقييمات موثقة على Capterra';
                    }
                }
            });

            const cards = testimonialsSec.querySelectorAll('.review-card');
            cards.forEach(card => {
                const authorEl = card.querySelector('h3');
                if (authorEl) {
                    const name = authorEl.textContent.trim();
                    if (name === 'Alex M.') authorEl.textContent = 'أليكس م.';
                    else if (name === 'Sarah J.') authorEl.textContent = 'سارة ج.';
                    else if (name === 'David K.') authorEl.textContent = 'ديفيد ك.';
                    else if (name === 'Elena R.') authorEl.textContent = 'إيلينا ر.';
                    else if (name === 'Michael T.') authorEl.textContent = 'مايكل ت.';
                    else if (name === 'Jessica L.') authorEl.textContent = 'جيسيكا ل.';
                    else if (name === 'Ryan P.') authorEl.textContent = 'رايان ب.';
                    else if (name === 'Amanda B.') authorEl.textContent = 'أماندا ب.';
                    else if (name === 'Chris W.') authorEl.textContent = 'كريس و.';
                    else if (name === 'Nina S.') authorEl.textContent = 'نينا س.';
                    else if (name === 'Tom H.') authorEl.textContent = 'توم هـ.';
                    else if (name === 'Laura C.') authorEl.textContent = 'لورا ك.';
                }

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

        // Steps Badges & Trusted Badge
        doc.querySelectorAll('.steps-badge').forEach(badge => {
            const text = badge.textContent.trim();
            if (text.includes('Free & secure') || text.includes('أصول مطور')) {
                badge.innerHTML = '<span class="badge-dot"></span>أدوات مجانية وآمنة للمطورين بنسبة 100%';
            } else if (text.includes('Powerful features') || text.includes('ميزات قوية')) {
                badge.innerHTML = '<span class="badge-dot"></span>ميزات قوية بين يديك';
            }
        });

        doc.querySelectorAll('.trusted-badge').forEach(badge => {
            const text = badge.textContent.trim();
            if (text.includes('Trusted by professionals') || text.includes('موثوق به')) {
                badge.innerHTML = `
            <div class="dots-group">
              <span class="dot blue-dot"></span>
              <span class="dot purple-dot"></span>
              <span class="dot pink-dot"></span>
            </div>
            موثوق به من قبل محترفين حول العالم
                `;
            }
        });

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
            const fcIco = whatsIncludedSec.querySelector('#file-favicon-ico');
            if (fcIco) {
                const badge = fcIco.querySelector('.file-badge');
                const p = fcIco.querySelector('p');
                if (badge) badge.textContent = 'ICO';
                if (p) p.innerHTML = 'صيغة <strong>ICO</strong> الكلاسيكية متعددة الأحجام، تحتوي على أيقونات بأحجام <strong>16×16</strong> و<strong>32×32</strong> و<strong>48×48</strong> بكسل. مطلوبة لدعم المتصفحات القديمة، بما في ذلك الإصدارات الأقدم من إنترنت إكسبلورر.';
            }

            // favicon-16
            const fc16 = whatsIncludedSec.querySelector('#file-favicon-16');
            if (fc16) {
                const badge = fc16.querySelector('.file-badge');
                const p = fc16.querySelector('p');
                if (badge) badge.textContent = '16';
                if (p) p.innerHTML = 'أيقونة تبويب المتصفح القياسية بحجم <strong>16×16</strong> بكسل. تستخدمها معظم المتصفحات الحديثة كأيقونة تبويب رئيسية للشاشات ذات الكثافة القياسية.';
            }

            // favicon-32
            const fc32 = whatsIncludedSec.querySelector('#file-favicon-32');
            if (fc32) {
                const badge = fc32.querySelector('.file-badge');
                const p = fc32.querySelector('p');
                if (badge) badge.textContent = '32';
                if (p) p.innerHTML = 'أيقونة تبويب المتصفح عالية الدقة بحجم <strong>32×32</strong> بكسل. تُعرض على شاشات <strong>Retina</strong> و<strong>HiDPI</strong> لعرض أيقونات واضحة وحادة في علامات تبويب المتصفح.';
            }

            // apple-touch
            const fcApple = whatsIncludedSec.querySelector('#file-apple-touch');
            if (fcApple) {
                const badge = fcApple.querySelector('.file-badge');
                const p = fcApple.querySelector('p');
                if (badge) badge.textContent = '180';
                if (p) p.innerHTML = 'أيقونة <strong>Apple Touch</strong> بمقاس <strong>180×180</strong> بكسل لأجهزة <strong>iPhone</strong> و<strong>iPad</strong> و<strong>iPod Touch</strong>. تُعرض عندما يضيف المستخدمون موقع الويب الخاص بك إلى الشاشة الرئيسية لجهاز <strong>iOS</strong>.';
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
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic favicon-checker page translation
    if (targetLang === 'ar' && normPath === 'favicon-checker/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'أداة فحص والتحقق من أيقونات الموقع (Favicon) | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'تقوم الأداة بفحص أي موقع إلكتروني مباشر للتحقق من الإعداد الصحيح وقابلية اكتشاف متصفحات الويب لأيقونات المتصفح (favicons)، وأيقونات Apple Touch، وملفات بيان تطبيقات الويب التقدمية (PWA manifest).');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'أداة فحص والتحقق من <span class="gradient-text">أيقونات الموقع (Favicon)</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'تقوم الأداة بفحص أي موقع إلكتروني مباشر للتحقق من الإعداد الصحيح وقابلية اكتشاف متصفحات الويب لأيقونات المتصفح (favicons)، وأيقونات Apple Touch، وملفات بيان تطبيقات الويب التقدمية (PWA manifest).';
        }

        // Badges
        const badgeFree = doc.getElementById('badge-free');
        if (badgeFree) badgeFree.textContent = '💰 مجانية 100%';
        const badgeInstant = doc.getElementById('badge-instant');
        if (badgeInstant) badgeInstant.textContent = '⚡ فحص فوري';
        const badgeDetails = doc.getElementById('badge-details');
        if (badgeDetails) badgeDetails.textContent = '📋 تقرير مفصل';
        const badgeGuide = doc.getElementById('badge-guide');
        if (badgeGuide) badgeGuide.textContent = '💡 نصائح عملية';

        // Form search area
        const searchCard = doc.querySelector('.tool-input') || doc.querySelector('.glass-card');
        if (searchCard) {
            const h3 = searchCard.querySelector('h3');
            if (h3) h3.textContent = '🔍 فحص رابط الموقع';

            const p = searchCard.querySelector('p');
            if (p) p.textContent = 'أدخل اسم النطاق (الدومين) الخاص بك للتحقق من سلامة الأيقونات وكود التثبيت:';

            const input = searchCard.querySelector('#checkerUrl');
            if (input) input.setAttribute('placeholder', 'https://example.com');

            const btn = searchCard.querySelector('#auditBtn');
            if (btn) btn.textContent = 'فحص أيقونة الموقع';
        }

        // How Favicon Validation Works
        let howItWorksSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('How Favicon Validation Works')) {
                howItWorksSec = sec;
            }
        });

        if (howItWorksSec) {
            const h2 = howItWorksSec.querySelector('h2');
            if (h2) h2.textContent = 'كيف تعمل عملية التحقق من الأيقونات؟';

            const subtitle = howItWorksSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'اتبع هذه الخطوات البسيطة لفحص أيقونات موقعك:';

            const steps = howItWorksSec.querySelectorAll('.step');
            if (steps.length >= 4) {
                // Step 1
                const h3_1 = steps[0].querySelector('h3');
                const p_1 = steps[0].querySelector('p');
                if (h3_1) h3_1.textContent = 'إدخال رابط الموقع';
                if (p_1) p_1.textContent = 'ألصق العنوان الكامل (HTTP أو HTTPS) للموقع الذي ترغب في تحليله.';

                // Step 2
                const h3_2 = steps[1].querySelector('h3');
                const p_2 = steps[1].querySelector('p');
                if (h3_2) h3_2.textContent = 'جلب وتحليل المصدر';
                if (p_2) p_2.textContent = 'تقوم الأداة (التي تعمل من جانب المتصفح) بجلب كود المصدر للصفحة وفحص قسم الرأس (head) بحثاً عن الروابط المطابقة.';

                // Step 3
                const h3_3 = steps[2].querySelector('h3');
                const p_3 = steps[2].querySelector('p');
                if (h3_3) h3_3.textContent = 'التحقق من الملفات';
                if (p_3) p_3.textContent = 'تتحقق مما إذا كانت ملفات favicon.ico و apple-touch-icon وملفات manifest مثبتة بشكل صحيح ويمكن الوصول إليها.';

                // Step 4
                const h3_4 = steps[3].querySelector('h3');
                const p_4 = steps[3].querySelector('p');
                if (h3_4) h3_4.textContent = 'الحصول على التقرير';
                if (p_4) p_4.textContent = 'احصل فوراً على نتائج الفحص التي تشمل الملفات الاحتياطية (fallback)، وإعدادات شاشات Retina، وتوصيات عملية.';
            }
        }

        // Why Audit Favicons Here?
        let whyAuditSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Why Audit Favicons Here?')) {
                whyAuditSec = sec;
            }
        });

        if (whyAuditSec) {
            const h2 = whyAuditSec.querySelector('h2');
            if (h2) h2.textContent = 'لماذا تفحص أيقونات موقعك هنا؟';

            const subtitle = whyAuditSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'أقوى أداة مجانية عبر الإنترنت لإنشاء أيقونات المواقع، حيث تحوّل الصور إلى أصول متوافقة مع معايير المتصفحات بدقة احترافية وسرعة فائقة.';

            const cards = whyAuditSec.querySelectorAll('.feature-card');
            if (cards.length >= 6) {
                // 1
                const h3_1 = cards[0].querySelector('h3');
                const p_1 = cards[0].querySelector('p');
                if (h3_1) h3_1.textContent = 'محرك فوري يعمل داخل المتصفح';
                if (p_1) p_1.textContent = 'احصل على نتائج فحص فورية دون الحاجة للانتظار في طوابير المعالجة.';

                // 2
                const h3_2 = cards[1].querySelector('h3');
                const p_2 = cards[1].querySelector('p');
                if (h3_2) h3_2.textContent = 'تغيير الحجم بدقة متناهية (Pixel-Perfect)';
                if (p_2) p_2.textContent = 'تقليل دقة الصورة بجودة عالية تحافظ على حدة الحواف ووضوح التفاصيل حتى عند الأحجام الصغيرة (مثل 16×16 بكسل).';

                // 3
                const h3_3 = cards[2].querySelector('h3');
                const p_3 = cards[2].querySelector('p');
                if (h3_3) h3_3.textContent = 'دعم جميع صيغ الصور';
                if (p_3) p_3.textContent = 'تعمل بسهولة مع صيغ PNG و JPG و SVG و WEBP و GIF وغيرها من الصيغ الشائعة.';

                // 4
                const h3_4 = cards[3].querySelector('h3');
                const p_4 = cards[3].querySelector('p');
                if (h3_4) h3_4.textContent = 'دعم شامل لجميع الأجهزة';
                if (p_4) p_4.textContent = 'تنشئ ملفات ICO التقليدية، وأيقونات Apple Touch، وأحجام Android Chrome، وملفات PWA، وتجمعها جميعاً في حزمة ZIP واحدة.';

                // 5
                const h3_5 = cards[4].querySelector('h3');
                const p_5 = cards[4].querySelector('p');
                if (h3_5) h3_5.textContent = 'آمنة وخصوصية تامة (100%)';
                if (p_5) p_5.textContent = 'تعمل الأداة بالكامل داخل متصفحك باستخدام تقنية HTML5 Canvas؛ ولا يتم رفع صورتك أبداً إلى أي خادم خارجي.';

                // 6
                const h3_6 = cards[5].querySelector('h3');
                const p_6 = cards[5].querySelector('p');
                if (h3_6) h3_6.textContent = 'مجانية ومفتوحة بالكامل';
                if (p_6) p_6.textContent = 'لا حاجة لتسجيل البريد الإلكتروني، ولا اشتراكات، ولا حواجز دفع. أدوات مجانية تماماً للمطورين.';
            }
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
            if (p) p.textContent = 'تأكد من إعداد أيقونات favicon بشكل مثالي لجميع مشاريع الويب الخاصة بك.';

            const cards = useCasesSec.querySelectorAll('.use-case-card');
            if (cards.length >= 4) {
                // 1
                const h3_1 = cards[0].querySelector('h3');
                const p_1 = cards[0].querySelector('p');
                if (h3_1) h3_1.textContent = 'مطور ويب';
                if (p_1) p_1.textContent = 'تحقق فوراً من سلامة جميع أحجام الأيقونات المطلوبة لمشاريع الويب الخاصة بك.';

                // 2
                const h3_2 = cards[1].querySelector('h3');
                const p_2 = cards[1].querySelector('p');
                if (h3_2) h3_2.textContent = 'مصممو UI/UX';
                if (p_2) p_2.textContent = 'تأكد من ظهور هوية علامتك التجارية بدقة ووضوح في جميع علامات تبويب المتصفح وشاشات الأجهزة.';

                // 3
                const h3_3 = cards[2].querySelector('h3');
                const p_3 = cards[2].querySelector('p');
                if (h3_3) h3_3.textContent = 'المدونون وصناع المحتوى';
                if (p_3) p_3.textContent = 'خصص مدونتك الشخصية أو محفظة أعمالك بسهولة مع أيقونة احترافية في ثوانٍ معدودة.';

                // 4
                const h3_4 = cards[3].querySelector('h3');
                const p_4 = cards[3].querySelector('p');
                if (h3_4) h3_4.textContent = 'أصحاب الأعمال';
                if (p_4) p_4.textContent = 'عزز مظهرك الاحترافي بموقع إلكتروني ذي أيقونة عالية الجودة تبني الثقة لدى العملاء.';
            }
        }

        // Section 6: Comparison Table
        let tableSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Favicon Checker vs Other Tools')) {
                tableSec = sec;
            }
        });

        if (tableSec) {
            const h2 = tableSec.querySelector('h2');
            if (h2) h2.textContent = 'مقارنة فاحص الأيقونات مع الأدوات الأخرى';

            const subtitle = tableSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'شاهد كيف تتفوق أداة فحص الأيقونات الخاصة بنا على الحلول الأخرى في السوق.';

            const thList = tableSec.querySelectorAll('th');
            if (thList.length >= 3) {
                thList[0].textContent = 'الميزة';
                thList[1].textContent = 'PNGtoFavicon';
                thList[2].textContent = 'الأدوات الأخرى';
            }

            const rows = tableSec.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const tds = row.querySelectorAll('td');
                if (tds.length >= 3) {
                    const featureText = tds[0].textContent.trim();
                    if (featureText === 'Price') {
                        tds[0].textContent = 'السعر';
                        tds[1].innerHTML = '<span class="check-icon">✅</span> مجاني مدى الحياة';
                        tds[2].textContent = 'خطط مجانية محدودة أو مدفوعة';
                    } else if (featureText === 'Privacy') {
                        tds[0].textContent = 'الخصوصية';
                        tds[1].innerHTML = '<span class="check-icon">✅</span> معالجة محلية 100% داخل المتصفح';
                        tds[2].textContent = 'يتم رفع الملفات إلى الخوادم';
                    } else if (featureText === 'Speed') {
                        tds[0].textContent = 'السرعة';
                        tds[1].innerHTML = '<span class="check-icon">✅</span> معالجة فورية';
                        tds[2].textContent = 'تعتمد على ضغط الخادم';
                    } else if (featureText === 'File Formats') {
                        tds[0].textContent = 'تنسيقات الملفات';
                        tds[1].innerHTML = '<span class="check-icon">✅</span> ICO + PNG + Manifest';
                        tds[2].textContent = 'غالبًا تدعم ICO فقط';
                    } else if (featureText === 'No Registration') {
                        tds[0].textContent = 'بدون تسجيل';
                        tds[1].innerHTML = '<span class="check-icon">✅</span> لا يتطلب إنشاء حساب';
                        tds[2].textContent = 'قد يكون التسجيل مطلوبًا';
                    } else if (featureText === 'Multi-platform') {
                        tds[0].textContent = 'دعم المنصات';
                        tds[1].innerHTML = '<span class="check-icon">✅</span> يعمل على جميع الأجهزة والمتصفحات';
                        tds[2].textContent = 'دعم محدود لبعض المنصات';
                    } else if (featureText === 'HTML Code Snippet') {
                        tds[0].textContent = 'مقتطف كود HTML';
                        tds[1].innerHTML = '<span class="check-icon">✅</span> يتم إنشاؤه تلقائيًا';
                        tds[2].textContent = 'يتطلب إضافته يدويًا';
                    } else if (featureText === 'Open Source') {
                        tds[0].textContent = 'مفتوح المصدر';
                        tds[1].innerHTML = '<span class="check-icon">✅</span> عملية شفافة';
                        tds[2].textContent = 'حلول مغلقة المصدر';
                    }
                }
            });
        }

        // Section 7: What's Included in Your Download
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
                if (p) p.innerHTML = 'صيغة <strong>ICO</strong> الكلاسيكية متعددة الأحجام، تحتوي على أيقونات بأحجام <strong>16×16</strong> و<strong>32×32</strong> و<strong>48×48</strong> بكسل. مطلوبة لدعم المتصفحات القديمة، بما في ذلك الإصدارات الأقدم من إنترنت إكسبلورر.';
            }

            // favicon-16
            const fc16 = whatsIncludedSec.querySelector('#file-favicon-16');
            if (fc16) {
                const badge = fc16.querySelector('.file-badge');
                const p = fc16.querySelector('p');
                if (badge) badge.textContent = '16';
                if (p) p.innerHTML = 'أيقونة تبويب المتصفح القياسية بحجم <strong>16×16</strong> بكسل. تستخدمها معظم المتصفحات الحديثة كأيقونة تبويب رئيسية للشاشات ذات الكثافة القياسية.';
            }

            // favicon-32
            const fc32 = whatsIncludedSec.querySelector('#file-favicon-32');
            if (fc32) {
                const badge = fc32.querySelector('.file-badge');
                const p = fc32.querySelector('p');
                if (badge) badge.textContent = '32';
                if (p) p.innerHTML = 'أيقونة تبويب المتصفح عالية الدقة بحجم <strong>32×32</strong> بكسل. تُعرض على شاشات <strong>Retina</strong> و<strong>HiDPI</strong> لعرض أيقونات واضحة وحادة في علامات تبويب المتصفح.';
            }

            // apple-touch
            const fcApple = whatsIncludedSec.querySelector('#file-apple-touch');
            if (fcApple) {
                const badge = fcApple.querySelector('.file-badge');
                const p = fcApple.querySelector('p');
                if (badge) badge.textContent = '180';
                if (p) p.innerHTML = 'أيقونة <strong>Apple Touch</strong> بمقاس <strong>180×180</strong> بكسل لأجهزة <strong>iPhone</strong> و<strong>iPad</strong> و<strong>iPod Touch</strong>. تُعرض عندما يضيف المستخدمون موقع الويب الخاص بك إلى الشاشة الرئيسية لجهاز <strong>iOS</strong>.';
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
            if (accent) accent.textContent = 'آراء المستخدمين';

            const h2 = testimonialsSec.querySelector('h2');
            if (h2) h2.textContent = 'ماذا يقول مستخدمونا؟';

            const subtitle = testimonialsSec.querySelector('.section-subtitle') || testimonialsSec.querySelector('p');
            if (subtitle) subtitle.textContent = 'يثق أكثر من 50,000 مطور ومصمم وصانع محتوى في PNGtoFavicon لإنجاز مشاريعهم.';

            // Rating Details
            const ratingDetails = testimonialsSec.querySelectorAll('.rating-details');
            ratingDetails.forEach(detail => {
                const count = detail.querySelector('.rating-count');
                if (count) {
                    const text = count.textContent.trim();
                    if (text.includes('Trustpilot')) {
                        count.textContent = 'تقييمات موثقة على Trustpilot';
                    } else if (text.includes('Capterra')) {
                        count.textContent = 'تقييمات موثقة على Capterra';
                    }
                }
            });

            const cards = testimonialsSec.querySelectorAll('.review-card');
            cards.forEach(card => {
                const authorEl = card.querySelector('h3');
                if (authorEl) {
                    const name = authorEl.textContent.trim();
                    if (name === 'Alex M.') authorEl.textContent = 'أليكس م.';
                    else if (name === 'Sarah J.') authorEl.textContent = 'سارة ج.';
                    else if (name === 'David K.') authorEl.textContent = 'ديفيد ك.';
                    else if (name === 'Elena R.') authorEl.textContent = 'إيلينا ر.';
                    else if (name === 'Michael T.') authorEl.textContent = 'مايكل ت.';
                    else if (name === 'Jessica L.') authorEl.textContent = 'جيسيكا ل.';
                    else if (name === 'Ryan P.') authorEl.textContent = 'رايان ب.';
                    else if (name === 'Amanda B.') authorEl.textContent = 'أماندا ب.';
                    else if (name === 'Chris W.') authorEl.textContent = 'كريس و.';
                    else if (name === 'Nina S.') authorEl.textContent = 'نينا س.';
                    else if (name === 'Tom H.') authorEl.textContent = 'توم هـ.';
                    else if (name === 'Laura C.') authorEl.textContent = 'لورا ك.';
                }

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
            if (subtitle) subtitle.textContent = 'اعثر على إجابات للأسئلة الشائعة حول خدمة فحص الأيقونات الخاصة بنا';

            const items = faqSec.querySelectorAll('.faq-item');
            if (items.length >= 3) {
                // Item 1
                const q_1 = items[0].querySelector('summary h3') || items[0].querySelector('summary');
                const a_1 = items[0].querySelector('.faq-answer');
                if (q_1) q_1.textContent = 'لماذا يقول فاحص الأيقونات أن أيقونة موقعي مفقودة رغم أنني أراها؟';
                if (a_1) a_1.textContent = 'غالباً ما تقوم المتصفحات بتخزين أيقونات المواقع مؤقتاً وبشكل مكثف، لذلك قد ترى أيقونة قديمة مخزنة مؤقتاً حتى لو كان الملف مفقوداً من خادمك، أو إذا كان كود HTML يحتوي على أخطاء في التثبيت. يقوم فاحصنا بطلب كود HTML المباشر وتحليله من جديد لتجاوز ذاكرة التخزين المؤقت للمتصفح.';

                // Item 2
                const q_2 = items[1].querySelector('summary h3') || items[1].querySelector('summary');
                const a_2 = items[1].querySelector('.faq-answer');
                if (q_2) q_2.textContent = 'كيف يمكنني إصلاح أيقونة apple-touch-icon المفقودة؟';
                if (a_2) a_2.innerHTML = 'قم بإنشاء صورة PNG بمقاس 180×180 بكسل، وارفعها إلى المجلد الرئيسي لخادمك باسم <strong>apple-touch-icon.png</strong>، وأضف <code>&lt;link rel="apple-touch-icon" href="/apple-touch-icon.png"&gt;</code> داخل رأس صفحة HTML. يمكنك استخدام محول PNG في صفحتنا الرئيسية لإنشاء هذا الملف تلقائياً.';

                // Item 3
                const q_3 = items[2].querySelector('summary h3') || items[2].querySelector('summary');
                const a_3 = items[2].querySelector('.faq-answer');
                if (q_3) q_3.textContent = 'هل تؤثر أيقونة الموقع المفقودة على سيو (SEO) محركات البحث؟';
                if (a_3) a_3.textContent = 'نعم. يعرض بحث Google أيقونات المواقع بجانب نتائج البحث على أجهزة الهاتف والكمبيوتر. إذا لم يتمكن روبوت Google من جلب أيقونتك، فسيعرض أيقونة افتراضية عامة، مما قد يقلل بشكل كبير من نسبة النقر إلى الظهور (CTR).';
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

        // Steps Badges & Trusted Badge
        doc.querySelectorAll('.steps-badge').forEach(badge => {
            const text = badge.textContent.trim();
            if (text.includes('Free & secure') || text.includes('أصول مطور')) {
                badge.innerHTML = '<span class="badge-dot"></span>أدوات مجانية وآمنة للمطورين بنسبة 100%';
            } else if (text.includes('Powerful features') || text.includes('ميزات قوية')) {
                badge.innerHTML = '<span class="badge-dot"></span>ميزات قوية بين يديك';
            }
        });

        doc.querySelectorAll('.trusted-badge').forEach(badge => {
            const text = badge.textContent.trim();
            if (text.includes('Trusted by professionals') || text.includes('موثوق به')) {
                badge.innerHTML = `
            <div class="dots-group">
              <span class="dot blue-dot"></span>
              <span class="dot purple-dot"></span>
              <span class="dot pink-dot"></span>
            </div>
            موثوق به من قبل محترفين حول العالم
                `;
            }
        });
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic tutorials/index.html page translation
    if (targetLang === 'ar' && normPath === 'tutorials/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'دليل وإرشادات أيقونات المواقع (Favicon) | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'تعلم كيفية إنشاء وتثبيت وتحسين أيقونات المواقع (favicons) لتحقيق أقصى قدر من التوافق مع المتصفحات وتحسين سيو (SEO) محركات البحث.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'أدلة وإرشادات <span class="gradient-text">أيقونات المواقع (Favicon)</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'تعلم كيفية إنشاء وتثبيت وتحسين أيقونات المواقع لضمان التوافق التام مع المتصفحات وظهورها بشكل مثالي في نتائج البحث (SEO).';
        }

        // Cards
        const cards = doc.querySelectorAll('.tools-grid .tool-card');
        if (cards.length >= 4) {
            // Card 1
            const h3_1 = cards[0].querySelector('h3');
            const p_1 = cards[0].querySelector('p');
            if (h3_1) h3_1.textContent = '❓ ما هو الفافيكون (Favicon)؟';
            if (p_1) p_1.textContent = 'تعرف على تاريخ وفائدة أيقونات تبويب المتصفح ولماذا تعتبر بالغة الأهمية للهوية الرقمية.';

            // Card 2
            const h3_2 = cards[1].querySelector('h3');
            const p_2 = cards[1].querySelector('p');
            if (h3_2) h3_2.textContent = '📏 دليل مقاسات الأيقونات (Favicon)';
            if (p_2) p_2.textContent = 'تعرف على مقاسات الأيقونات المطلوبة لشاشات retina الحديثة، وتطبيقات Android، وإشارات المرجعية لنظام iOS.';

            // Card 3
            const h3_3 = cards[2].querySelector('h3');
            const p_3 = cards[2].querySelector('p');
            if (h3_3) h3_3.textContent = '➕ كيفية إضافة أيقونة Favicon';
            if (p_3) p_3.textContent = 'مقتطفات كود HTML عامة قابلة للنسخ واللصق وإرشادات الرفع على الخادم لتثبيت ملفات الأيقونة الخاصة بك.';

            // Card 4
            const h3_4 = cards[3].querySelector('h3');
            const p_4 = cards[3].querySelector('p');
            if (h3_4) h3_4.textContent = '💡 أفضل الممارسات لأيقونة Favicon';
            if (p_4) p_4.textContent = 'نصائح حول ملاءمة حجم التصاميم، وتقليل حجم الملف، وإرشادات سيو (SEO) للأيقونة لتحسين نسبة النقر إلى الظهور في Google.';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic blog/index.html page translation
    if (targetLang === 'ar' && normPath === 'blog/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'مدونة الأيقونات وتحسين المواقع | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'تابع أحدث معايير الويب، وقوائم مراجعة سيو (SEO)، ونصائح التصميم الخاصة بمقتطفات نتائج البحث وعلامات تبويب المتصفح.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'مدونة <span class="gradient-text">الهوية والأيقونات</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'تابع أحدث معايير الويب، وقوائم مراجعة سيو (SEO)، ونصائح التصميم الخاصة بمقتطفات نتائج البحث وعلامات تبويب المتصفح.';
        }

        // Cards
        const cards = doc.querySelectorAll('.glass-card');
        if (cards.length >= 2) {
            // Card 1
            const span1 = cards[0].querySelector('span');
            if (span1) span1.textContent = 'سيو والعلامة التجارية';
            const h2_1 = cards[0].querySelector('h2 a');
            if (h2_1) h2_1.textContent = 'دليل سيو الأيقونات (Favicon SEO): تحسين نسب النقر إلى الظهور في نتائج البحث';
            const p1 = cards[0].querySelector('p');
            if (p1) p1.textContent = 'تعرف على كيفية قيام Google بتحليل أيقونات المواقع لصفحات نتائج البحث على أجهزة الهاتف والكمبيوتر وكيف تؤثر الأيقونة على نسبة النقر إلى الظهور.';
            const metaDiv1 = cards[0].querySelector('div:last-of-type');
            if (metaDiv1) {
                const dateSpan = metaDiv1.querySelector('span');
                if (dateSpan) dateSpan.textContent = '10 يوليو 2026 · قراءة لمدة 6 دقائق';
                const readLink = metaDiv1.querySelector('a');
                if (readLink) {
                    readLink.textContent = 'اقرأ المقال ←';
                }
            }

            // Card 2
            const span2 = cards[1].querySelector('span');
            if (span2) span2.textContent = 'صيغ الملفات';
            const h2_2 = cards[1].querySelector('h2 a');
            if (h2_2) h2_2.textContent = 'PNG مقابل ICO مقابل SVG: اختيار الصيغة المناسبة لأيقونة موقعك';
            const p2 = cards[1].querySelector('p');
            if (p2) p2.textContent = 'تحليل عميق لصيغ أيقونات المتصفح. قارن بين صيغة ICO الكلاسيكية الاحتياطية، وأيقونات تبويب PNG الواضحة، وأصول SVG المتجاوبة والمتجهة الحديثة.';
            const metaDiv2 = cards[1].querySelector('div:last-of-type');
            if (metaDiv2) {
                const dateSpan = metaDiv2.querySelector('span');
                if (dateSpan) dateSpan.textContent = '5 يوليو 2026 · قراءة لمدة 8 دقائق';
                const readLink = metaDiv2.querySelector('a');
                if (readLink) {
                    readLink.textContent = 'اقرأ المقال ←';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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
 
    // Custom logic for German blog/index.html page translation
    if (targetLang === 'de' && normPath === 'blog/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'Blog zu Branding & Favicons | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'Bleiben Sie auf dem Laufenden über moderne Webstandards, SEO-Checklisten sowie Design-Tipps für Such-Snippets und Browser-Tabs.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'Blog zu <span class="gradient-text">Branding & Favicons</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'Bleiben Sie auf dem Laufenden über moderne Webstandards, SEO-Checklisten sowie Design-Tipps für Such-Snippets und Browser-Tabs.';
        }

        // Cards
        const cards = doc.querySelectorAll('.glass-card');
        if (cards.length >= 2) {
            // Card 1
            const span1 = cards[0].querySelector('span');
            if (span1) span1.textContent = 'SEO & BRANDING';
            const h2_1 = cards[0].querySelector('h2 a');
            if (h2_1) h2_1.textContent = 'SEO-Leitfaden für Favicons: Steigerung der Klickraten bei Such-Snippets';
            const p1 = cards[0].querySelector('p');
            if (p1) p1.textContent = 'Erfahren Sie, wie Google Favicons für Suchergebnisseiten auf Desktop und Mobilgeräten verarbeitet und wie sich konfigurierte Tab-Icons auf die visuelle SEO-Klickrate (CTR) auswirken.';
            const metaDiv1 = cards[0].querySelector('div:last-of-type');
            if (metaDiv1) {
                const dateSpan = metaDiv1.querySelector('span');
                if (dateSpan) dateSpan.textContent = '10. Juli 2026 · 6 Min. Lesezeit';
                const readLink = metaDiv1.querySelector('a');
                if (readLink) {
                    readLink.textContent = 'Artikel lesen →';
                }
            }

            // Card 2
            const span2 = cards[1].querySelector('span');
            if (span2) span2.textContent = 'DATEIFORMATE';
            const h2_2 = cards[1].querySelector('h2 a');
            if (h2_2) h2_2.textContent = 'PNG vs. ICO vs. SVG: Das richtige Favicon-Format wählen';
            const p2 = cards[1].querySelector('p');
            if (p2) p2.textContent = 'Ein detaillierter Einblick in Browser-Icon-Formate. Vergleichen Sie das klassische ICO-Fallback, scharfe PNG-Tab-Icons und moderne, responsive SVG-Vektorgrafiken.';
            const metaDiv2 = cards[1].querySelector('div:last-of-type');
            if (metaDiv2) {
                const dateSpan = metaDiv2.querySelector('span');
                if (dateSpan) dateSpan.textContent = '05. Juli 2026 · 8 Min. Lesezeit';
                const readLink = metaDiv2.querySelector('a');
                if (readLink) {
                    readLink.textContent = 'Artikel lesen →';
                }
            }
        }

        // Header Navbar Links
        const navLinksList = doc.querySelectorAll('#navLinks a');
        navLinksList.forEach(link => {
            const text = link.textContent.trim();
            if (text === 'Converter') link.textContent = 'Konverter';
            else if (text === 'Text to Favicon') link.textContent = 'Text zu Favicon';
            else if (text === 'Emoji to Favicon') link.textContent = 'Emoji zu Favicon';
            else if (text === 'Favicon Checker') link.textContent = 'Favicon-Tester';
            else if (text === 'Tutorials') link.textContent = 'Tutorials';
            else if (text === 'Blog') link.textContent = 'Blog';
        });

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'Konvertieren Sie PNG sofort in Favicon — ein kostenloses Online-Tool.';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'Auf WhatsApp chatten';
            }

            // Columns headers
            const colHeaders = footer.querySelectorAll('h4');
            colHeaders.forEach(h4 => {
                const text = h4.textContent.trim();
                if (text === 'Tools') h4.textContent = 'Tools';
                else if (text === 'Resources') h4.textContent = 'Ressourcen';
                else if (text === 'Company') h4.textContent = 'Unternehmen';
            });

            // Links
            const footerLinks = footer.querySelectorAll('a');
            footerLinks.forEach(link => {
                const text = link.textContent.trim();
                if (text === 'PNG to Favicon Converter') link.textContent = 'PNG-zu-Favicon-Konverter';
                else if (text === 'Text to Favicon') link.textContent = 'Text zu Favicon';
                else if (text === 'Emoji to Favicon') link.textContent = 'Emoji zu Favicon';
                else if (text === 'Favicon Checker') link.textContent = 'Favicon-Tester';
                else if (text === 'Tutorials') link.textContent = 'Tutorials';
                else if (text === 'Blog') link.textContent = 'Blog';
                else if (text === 'Favicon Sizes Guide') link.textContent = 'Leitfaden für Favicon-Größen';
                else if (text === 'What is a Favicon?') link.textContent = 'Was ist ein Favicon?';
                else if (text === 'About') link.textContent = 'Über uns';
                else if (text === 'Contact') link.textContent = 'Kontakt';
                else if (text === 'Privacy Policy') link.textContent = 'Datenschutzerklärung';
                else if (text === 'Terms of Service') link.textContent = 'Nutzungsbedingungen';
                else if (text === 'Cookie Policy') link.textContent = 'Cookie-Richtlinie';
            });

            // Copyright text
            const copyright = footer.querySelector('.footer-bottom p');
            if (copyright) {
                copyright.textContent = '© 2026 PNGtoFavicon.com — Alle Rechte vorbehalten.';
            }
        }
    }

    // Custom logic for Arabic tutorials/how-to-add-favicon/index.html page translation
    if (targetLang === 'ar' && normPath === 'tutorials/how-to-add-favicon/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'كيفية إضافة أيقونة الموقع (Favicon) إلى موقعك الإلكتروني | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'تعرّف على كيفية تثبيت حزم أيقونات الموقع على خوادم الاستضافة الثابتة (static hosting) أو أنظمة إدارة المحتوى (CMS) المخصصة.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'كيفية إضافة <span class="gradient-text">أيقونة الموقع (Favicon)</span> إلى موقعك الإلكتروني';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'تعرّف على كيفية تثبيت حزم أيقونات الموقع على خوادم الاستضافة الثابتة (static hosting) أو أنظمة إدارة المحتوى (CMS) المخصصة.';
        }

        // Steps cards
        const stepsSec = doc.querySelector('.section');
        if (stepsSec) {
            const cards = stepsSec.querySelectorAll('.glass-card');
            if (cards.length >= 3) {
                // Step 1
                const h2_1 = cards[0].querySelector('h2');
                const p_1 = cards[0].querySelector('p');
                if (h2_1) h2_1.textContent = 'الخطوة 1: إنشاء الملفات';
                if (p_1) p_1.textContent = 'ارفع تصميمك إلى الأداة الموجودة في صفحتنا الرئيسية لإنشاء ملف مضغوط (ZIP). قم بفك ضغط الملف لاستخراج الملفات بداخله.';

                // Step 2
                const h2_2 = cards[1].querySelector('h2');
                const p_2 = cards[1].querySelector('p');
                if (h2_2) h2_2.textContent = 'الخطوة 2: رفع الملفات إلى المجلد الجذري للخادم';
                if (p_2) p_2.innerHTML = 'ارفع جميع ملفات الأيقونة المستخرجة (مثل <code>favicon.ico</code> و <code>apple-touch-icon.png</code> وغيرها) مباشرةً إلى المجلد الجذري العام الرئيسي لموقعك (والذي عادة ما يحمل الاسم <code>public_html</code> أو <code>public</code>). على سبيل المثال، يجب أن تكون الملفات متاحة للوصول عبر الرابط: <code>yoursite.com/favicon.ico</code>.';

                // Step 3
                const h2_3 = cards[2].querySelector('h2');
                const p_3 = cards[2].querySelector('p');
                if (h2_3) h2_3.textContent = 'الخطوة 3: لصق كود الترويسة (Header Markup)';
                if (p_3) p_3.textContent = 'انسخ والصق هذه الروابط القياسية في منطقة الترويسة (header) داخل جميع ملفات صفحات موقعك:';
                
                const copyBtn = cards[2].querySelector('.copy-btn');
                if (copyBtn) copyBtn.textContent = 'نسخ';
            }
        }

        // Bottom CTA Section
        let bottomCta = null;
        doc.querySelectorAll('section').forEach(sec => {
            if (sec.className.includes('bottom-cta')) {
                bottomCta = sec;
            }
        });

        if (bottomCta) {
            const h2 = bottomCta.querySelector('h2');
            if (h2) h2.textContent = 'ابدأ تحويل صور PNG إلى أيقونات مواقع (Favicon) مجانًا اليوم';

            const p = bottomCta.querySelector('p');
            if (p) p.textContent = 'انضم إلى أكثر من 50,000 مستخدم يثقون في موقع PNGtoFavicon.com للحصول على خدمة دقيقة وسريعة ومجانية تماماً لإنشاء أيقونات المواقع.';

            const btn = bottomCta.querySelector('.btn');
            if (btn) btn.textContent = 'ابدأ التحويل الآن - الخدمة مجانية!';
        }

        // Explore More Favicon Tools
        let toolsSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Explore More Favicon Tools')) {
                toolsSec = sec;
            }
        });

        if (toolsSec) {
            const h2 = toolsSec.querySelector('h2');
            if (h2) h2.textContent = 'استكشف المزيد من أدوات الأيقونات';

            const subtitle = toolsSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'يقدم موقع PNGtoFavicon مجموعة كاملة من الأدوات لتلبية جميع احتياجات الأيقونات الخاصة بك';

            const cards = toolsSec.querySelectorAll('.tool-card');
            if (cards.length >= 3) {
                // Card 1: Text to Favicon
                const h3_1 = cards[0].querySelector('h3');
                const p_1 = cards[0].querySelector('p');
                const link_1 = cards[0].querySelector('.tool-card-link');
                if (h3_1) h3_1.textContent = 'نص إلى أيقونة';
                if (p_1) p_1.textContent = 'أنشئ أيقونة موقع من الأحرف أو الأحرف الأولى لاسم شركتك أو أي نص آخر. اختر الخطوط والألوان والأنماط لإنشاء أيقونة فريدة لعلامتك التجارية.';
                if (link_1) link_1.textContent = 'جربها مجاناً ←';

                // Card 2: Emoji to Favicon
                const h3_2 = cards[1].querySelector('h3');
                const p_2 = cards[1].querySelector('p');
                const link_2 = cards[1].querySelector('.tool-card-link');
                if (h3_2) h3_2.textContent = 'رمز تعبيري إلى أيقونة';
                if (p_2) p_2.textContent = 'حول أي رمز تعبيري (Emoji) إلى أيقونة favicon متوافقة مع جميع الأجهزة. اختر الخلفية والأشكال والأحجام وقم بالتنزيل فوراً.';
                if (link_2) link_2.textContent = 'جربها مجاناً ←';

                // Card 3: Favicon Checker
                const h3_3 = cards[2].querySelector('h3');
                const p_3 = cards[2].querySelector('p');
                const link_3 = cards[2].querySelector('.tool-card-link');
                if (h3_3) h3_3.textContent = 'فاحص الأيقونات';
                if (p_3) p_3.textContent = 'افحص أي موقع إلكتروني مباشر للتحقق من الإعداد الصحيح وقابلية اكتشاف متصفحات الويب لأيقونة الموقع وأيقونة Apple وملف manifest.';
                if (link_3) link_3.textContent = 'جربها مجاناً ←';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic tutorials/favicon-sizes/index.html page translation
    if (targetLang === 'ar' && normPath === 'tutorials/favicon-sizes/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'دليل مقاسات الأيقونات (معايير عام 2026) | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'تعرف على المقاسات والأبعاد المطلوبة لكل متصفح وجهاز ومنصة تطبيقات الويب التقدمية (PWA) في عام 2026.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'دليل مقاسات الأيقونات <span class="gradient-text">الكامل لعام 2026</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'تعرف على المقاسات والأبعاد المطلوبة لكل متصفح وجهاز ومنصة تطبيقات الويب التقدمية (PWA) لضمان العرض الدقيق والاحترافي للأيقونة.';
        }

        // Table
        const tableSec = doc.querySelector('.section') || doc.querySelector('section');
        if (tableSec) {
            const h2 = tableSec.querySelector('h2');
            if (h2) h2.textContent = 'جدول مقاسات الأيقونات (Favicon) القياسية';

            const table = tableSec.querySelector('table');
            if (table) {
                const thList = table.querySelectorAll('th');
                if (thList.length >= 3) {
                    thList[0].textContent = 'المقاس';
                    thList[1].textContent = 'الصيغة';
                    thList[2].textContent = 'المنصة المستهدفة / الاستخدام';
                }

                const rows = table.querySelectorAll('tbody tr');
                if (rows.length >= 6) {
                    // Row 1
                    const tds_1 = rows[0].querySelectorAll('td');
                    if (tds_1.length >= 3) {
                        tds_1[0].textContent = '16 × 16 بكسل';
                        tds_1[1].textContent = 'PNG / ICO';
                        tds_1[2].textContent = 'أيقونة تبويب متصفح الكمبيوتر القياسية الاحتياطية';
                    }

                    // Row 2
                    const tds_2 = rows[1].querySelectorAll('td');
                    if (tds_2.length >= 3) {
                        tds_2[0].textContent = '32 × 32 بكسل';
                        tds_2[1].textContent = 'PNG / ICO';
                        tds_2[2].textContent = 'أيقونات تبويب متصفح الكمبيوتر شاشات Retina / HiDPI عالية الدقة';
                    }

                    // Row 3
                    const tds_3 = rows[2].querySelectorAll('td');
                    if (tds_3.length >= 3) {
                        tds_3[0].textContent = '48 × 48 بكسل';
                        tds_3[1].textContent = 'ICO';
                        tds_3[2].textContent = 'شريط مهام Windows / أيقونات اختصارات سطح المكتب الاحتياطية';
                    }

                    // Row 4
                    const tds_4 = rows[3].querySelectorAll('td');
                    if (tds_4.length >= 3) {
                        tds_4[0].textContent = '180 × 180 بكسل';
                        tds_4[1].textContent = 'PNG';
                        tds_4[2].textContent = 'أيقونة Apple iOS Touch (إشارات المرجعية للشاشة الرئيسية لأجهزة iPhone و iPad)';
                    }

                    // Row 5
                    const tds_5 = rows[4].querySelectorAll('td');
                    if (tds_5.length >= 3) {
                        tds_5[0].textContent = '192 × 192 بكسل';
                        tds_5[1].textContent = 'PNG';
                        tds_5[2].textContent = 'أيقونة الشاشة الرئيسية لمتصفح Chrome على Android / شارة تشغيل تطبيقات PWA';
                    }

                    // Row 6
                    const tds_6 = rows[5].querySelectorAll('td');
                    if (tds_6.length >= 3) {
                        tds_6[0].textContent = '512 × 512 بكسل';
                        tds_6[1].textContent = 'PNG';
                        tds_6[2].textContent = 'شاشات البدء (Splash screens) لتطبيقات PWA / مشغل تطبيقات عالي الدقة';
                    }
                }
            }
        }

        // Bottom CTA Section
        let bottomCta = null;
        doc.querySelectorAll('section').forEach(sec => {
            if (sec.className.includes('bottom-cta')) {
                bottomCta = sec;
            }
        });

        if (bottomCta) {
            const h2 = bottomCta.querySelector('h2');
            if (h2) h2.textContent = 'ابدأ تحويل صور PNG إلى أيقونات مواقع (Favicon) مجانًا اليوم';

            const p = bottomCta.querySelector('p');
            if (p) p.textContent = 'انضم إلى أكثر من 50,000 مستخدم يثقون في موقع PNGtoFavicon.com للحصول على خدمة دقيقة وسريعة ومجانية تماماً لإنشاء أيقونات المواقع.';

            const btn = bottomCta.querySelector('.btn');
            if (btn) btn.textContent = 'ابدأ التحويل الآن - الخدمة مجانية!';
        }

        // Explore More Favicon Tools
        let toolsSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Explore More Favicon Tools')) {
                toolsSec = sec;
            }
        });

        if (toolsSec) {
            const h2 = toolsSec.querySelector('h2');
            if (h2) h2.textContent = 'استكشف المزيد من أدوات الأيقونات';

            const subtitle = toolsSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'يقدم موقع PNGtoFavicon مجموعة كاملة من الأدوات لتلبية جميع احتياجات الأيقونات الخاصة بك';

            const cards = toolsSec.querySelectorAll('.tool-card');
            if (cards.length >= 3) {
                // Card 1: Text to Favicon
                const h3_1 = cards[0].querySelector('h3');
                const p_1 = cards[0].querySelector('p');
                const link_1 = cards[0].querySelector('.tool-card-link');
                if (h3_1) h3_1.textContent = 'نص إلى أيقونة';
                if (p_1) p_1.textContent = 'أنشئ أيقونة موقع من الأحرف أو الأحرف الأولى لاسم شركتك أو أي نص آخر. اختر الخطوط والألوان والأنماط لإنشاء أيقونة فريدة لعلامتك التجارية.';
                if (link_1) link_1.textContent = 'جربها مجاناً ←';

                // Card 2: Emoji to Favicon
                const h3_2 = cards[1].querySelector('h3');
                const p_2 = cards[1].querySelector('p');
                const link_2 = cards[1].querySelector('.tool-card-link');
                if (h3_2) h3_2.textContent = 'رمز تعبيري إلى أيقونة';
                if (p_2) p_2.textContent = 'حول أي رمز تعبيري (Emoji) إلى أيقونة favicon متوافقة مع جميع الأجهزة. اختر الخلفية والأشكال والأحجام وقم بالتنزيل فوراً.';
                if (link_2) link_2.textContent = 'جربها مجاناً ←';

                // Card 3: Favicon Checker
                const h3_3 = cards[2].querySelector('h3');
                const p_3 = cards[2].querySelector('p');
                const link_3 = cards[2].querySelector('.tool-card-link');
                if (h3_3) h3_3.textContent = 'فاحص الأيقونات';
                if (p_3) p_3.textContent = 'افحص أي موقع إلكتروني مباشر للتحقق من الإعداد الصحيح وقابلية اكتشاف متصفحات الويب لأيقونة الموقع وأيقونة Apple وملف manifest.';
                if (link_3) link_3.textContent = 'جربها مجاناً ←';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic tutorials/what-is-a-favicon/index.html page translation
    if (targetLang === 'ar' && normPath === 'tutorials/what-is-a-favicon/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'ما هو الفافيكون (Favicon)؟ الدليل الكامل للمبتدئين | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'تعرف على تاريخ وفائدة وأهمية أيقونات المواقع (favicons)، وأين تظهر، وكيف يمكنها تحسين تجربة المستخدم وعلامتك التجارية.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'ما هو <span class="gradient-text">الفافيكون (Favicon)</span>؟';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'تعرف على تاريخ وفائدة وأهمية أيقونات المواقع (favicons)، وأين تظهر، وكيف يمكنها تحسين تجربة المستخدم وعلامتك التجارية.';
        }

        // Cards
        const cards = doc.querySelectorAll('.glass-card');
        if (cards.length >= 6) {
            // Card 1: Intro
            const pList_1 = cards[0].querySelectorAll('p');
            if (pList_1.length >= 2) {
                pList_1[0].textContent = 'كل موقع إلكتروني له هوية مميزة، وأيقونة الموقع (Favicon) هي واحدة من أصغر عناصر الهوية التجارية وأكثرها تمييزاً وسهولة في التعرف عليها. الأيقونة هي الرمز الصغير المعروض بجانب عنوان صفحة الويب في علامات تبويب المتصفح، والإشارات المرجعية، وسجل المتصفح، ونتائج البحث على الأجهزة المدعومة. على الرغم من أنها تشغل بضعة بكسلات فقط، إلا أنها تلعب دوراً هاماً في مساعدة المستخدمين على تحديد موقع الويب الخاص بك بسرعة وتعزيز علامتك التجارية عبر تجارب التصفح المختلفة.';
                pList_1[1].textContent = 'يركز العديد من أصحاب المواقع على الشعارات، والخطوط، ومخططات الألوان ولكنهم يغفلون عن أيقونة الموقع (Favicon) أثناء تطوير الموقع. يمكن أن تؤدي الأيقونات المفقودة أو سيئة التصميم إلى جعل الموقع يبدو غير مكتمل أو أقل جدارة بالثقة. في المقابل، تساعد الأيقونة الواضحة والمميزة الزوار على تمييز موقعك من بين عشرات التبويب المفتوحة، وتحسن من ظهور الإشارات المرجعية، وتخلق حضوراً أكثر احترافية على الإنترنت.';
            }

            // Card 2: What is a favicon?
            const h2_2 = cards[1].querySelector('h2');
            if (h2_2) h2_2.textContent = 'ما هي أيقونة الموقع (Favicon)؟';
            
            const pList_2 = cards[1].querySelectorAll('p');
            if (pList_2.length >= 9) {
                pList_2[0].textContent = 'أيقونة الموقع (Favicon - اختصار لـ favorite icon) هي رسم صغير يمثل موقع ويب أو تطبيق ويب. وتعمل كمعرف مرئي، مما يسهل على المستخدمين التعرف على موقعك من بين العديد من علامات تبويب المتصفح، والإشارات المرجعية، وسجلات المتصفح، والمواقع الأخرى التي تدرج فيها مواقع الويب.';
                pList_2[1].textContent = 'على عكس الشعار كامل الحجم، تم تصميم أيقونة favicon لتظل واضحة ومميزة حتى في الأبعاد الصغيرة جداً، والتي غالباً ما تكون صغيرة مثل 16 × 16 بكسل. وبسبب هذه المساحة المحدودة، تستخدم الأيقونات الفعالة أشكالاً بسيطة، وتبايناً قوياً، وتفاصيل دنيوية.';
                pList_2[2].textContent = 'عندما يزور شخص ما موقعك، يطلب متصفحه ملف الأيقونة مع موارد الموقع الأخرى مثل HTML و CSS و JavaScript والصور. بمجرد تحميلها، يعرض المتصفح الأيقونة في الأماكن المناسبة، مما يساعد على بناء اتساق الهوية التجارية.';
                pList_2[3].innerHTML = 'تأتي كلمة "Favicon" (أيقونة الموقع المفضلة) من دمج كلمتي "favorite" (مفضلة) و"icon" (أيقونة).';
                pList_2[4].textContent = 'ظهر هذا المصطلح لأول مرة في أواخر التسعينيات عندما أتاحت شركة مايكروسوفت دعم أيقونة صغيرة مرتبطة بمواقع الويب. في البداية، كانت هذه الأيقونات تظهر فقط عندما يضيف المستخدمون المواقع إلى قائمة "المفضلة" (Favorites) في متصفح "إنترنت إكسبلورر" (Internet Explorer). ومع مرور الوقت، تبنت متصفحات أخرى هذا المفهوم ووسعت نطاق استخدامه ليشمل علامات التبويب، والإشارات المرجعية (bookmarks)، وصفحات السجل، واختصارات الأجهزة المحمولة، وتطبيقات الويب المثبتة.';
                pList_2[5].textContent = 'يتمثل الغرض الأساسي من أيقونة الموقع في توفير هوية بصرية للموقع الإلكتروني.';
                pList_2[6].textContent = 'فبدلاً من الاعتماد فقط على عناوين الصفحات، يمكن للمستخدمين التعرف على الموقع بسرعة من خلال أيقونته. وتبرز أهمية ذلك بشكل خاص عند فتح عدة علامات تبويب، أو ازدحام نوافذ المتصفح، أو عندما تحتوي قائمة الإشارات المرجعية على مئات المواقع المحفوظة.';
                pList_2[7].textContent = 'تساعد أيقونة الموقع في:';
                pList_2[8].textContent = 'على الرغم من أن أيقونة الموقع لا ترفع ترتيب الموقع في محركات البحث بشكل مباشر، إلا أنها تساهم في تحسين سهولة استخدام الموقع واتساق العلامة التجارية، وكلاهما يدعم توفير تجربة مستخدم إيجابية.';
            }

            const h3List_2 = cards[1].querySelectorAll('h3');
            if (h3List_2.length >= 2) {
                h3List_2[0].textContent = 'أصل مصطلح "Favicon"';
                h3List_2[1].textContent = 'ما هو الغرض الأساسي من أيقونة الموقع (Favicon)؟';
            }

            const ulList_2 = cards[1].querySelectorAll('ul li');
            if (ulList_2.length >= 5) {
                ulList_2[0].textContent = 'تعزيز التعرف على العلامة التجارية';
                ulList_2[1].textContent = 'تسهيل تمييز علامات تبويب المتصفح';
                ulList_2[2].textContent = 'التمييز بين موقعك ومواقع المنافسين';
                ulList_2[3].textContent = 'تحسين تجربة المستخدم';
                ulList_2[4].textContent = 'إضفاء مظهر احترافي ومتقن';
            }

            // Card 3: Where Favicons Appear
            const h2_3 = cards[2].querySelector('h2');
            if (h2_3) h2_3.textContent = 'أين تظهر أيقونات المواقع (Favicons)؟';
            const pList_3 = cards[2].querySelectorAll('p');
            if (pList_3.length >= 2) {
                pList_3[0].textContent = 'يعتقد الكثير من الناس أن أيقونة الموقع تظهر فقط في علامات تبويب المتصفح، ولكن المتصفحات وأنظمة التشغيل ومحركات البحث الحديثة تعرض أيقونات المواقع في عدة أماكن.';
                pList_3[1].textContent = 'إن فهم مكان ظهور أيقونة موقعك يوضح سبب أهمية اختيار التصميم وصيغة الملف المناسبين.';
            }
            const gridItems = cards[2].querySelectorAll('div > div');
            if (gridItems.length >= 9) {
                // Item 1
                const h4_1 = gridItems[0].querySelector('h4');
                const gp_1 = gridItems[0].querySelector('p');
                if (h4_1) h4_1.textContent = 'علامات تبويب المتصفح';
                if (gp_1) gp_1.textContent = 'المكان الأكثر شيوعاً لأيقونة الموقع هو علامة تبويب المتصفح. عندما تكون هناك علامات تبويب متعددة مفتوحة، غالباً ما يعتمد المستخدمون على الأيقونات بدلاً من عناوين الصفحات لتحديد موقع الويب الذي يريدونه. الأيقونة المميزة تجعل التنقل أسرع وتقلل من الارتباك.';

                // Item 2
                const h4_2 = gridItems[1].querySelector('h4');
                const gp_2 = gridItems[1].querySelector('p');
                if (h4_2) h4_2.textContent = 'الإشارات المرجعية للمتصفح';
                if (gp_2) gp_2.textContent = 'تظهر أيقونات المواقع أيضاً بجانب الصفحات المحفوظة في الإشارات المرجعية. تعرض معظم المتصفحات أيقونة الموقع بجانب كل إشارة مرجعية، مما يتيح للمستخدمين تصفح مجلدات الإشارات المرجعية بسرعة دون قراءة كل عنوان.';

                // Item 3
                const h4_3 = gridItems[2].querySelector('h4');
                const gp_3 = gridItems[2].querySelector('p');
                if (h4_3) h4_3.textContent = 'سجل المتصفح';
                if (gp_3) gp_3.textContent = 'تعرض العديد من متصفحات الكمبيوتر والهواتف أيقونات المواقع داخل سجل التصفح. وبدلاً من عرض أيقونة مستند افتراضية عامة، تستخدم المتصفحات الأيقونة لتمييز المواقع بصرياً، مما يسهل فحص سجل التصفح.';

                // Item 4
                const h4_4 = gridItems[3].querySelector('h4');
                const gp_4 = gridItems[3].querySelector('p');
                if (h4_4) h4_4.textContent = 'شريط العنوان وواجهة المتصفح';
                if (gp_4) gp_4.textContent = 'تعرض بعض المتصفحات أيقونات المواقع داخل شريط العنوان، أو منطقة معلومات الصفحة، أو واجهة إدارة علامات التبويب. وعلى الرغم من اختلاف طريقة التثبيت بين المتصفحات، إلا أن دعم هذه البيئات يساعد في الحفاظ على اتساق العلامة التجارية عبر الأنظمة المختلفة.';

                // Item 5
                const h4_5 = gridItems[4].querySelector('h4');
                const gp_5 = gridItems[4].querySelector('p');
                if (h4_5) h4_5.textContent = 'نتائج بحث Google';
                if (gp_5) gp_5.textContent = 'قد يعرض Google أيقونة الموقع في نتائج البحث على الهواتف وبعض تجارب البحث على أجهزة الكمبيوتر. عند ظهورها بجانب عنوان صفحتك واسم النطاق، توفر الأيقونة إشارة إضافية للعلامة التجارية تساعد المستخدمين على التعرف على موقعك.';

                // Item 6
                const h4_6 = gridItems[5].querySelector('h4');
                const gp_6 = gridItems[5].querySelector('p');
                if (h4_6) h4_6.textContent = 'اختصارات الشاشة الرئيسية للهواتف';
                if (gp_6) gp_6.textContent = 'عندما يحفظ المستخدمون موقع ويب على الشاشة الرئيسية لهواتفهم الذكية، تستخدم المتصفحات عادةً أيقونة مخصصة بناءً على الأيقونة أو أيقونة Apple Touch الخاصة بموقعك. إذا كان موقعك يتضمن أيقونات معدة بشكل صحيح، فإن الاختصار سيبدو مشابهاً لتطبيق الهاتف الأصلي.';

                // Item 7
                const h4_7 = gridItems[6].querySelector('h4');
                const gp_7 = gridItems[6].querySelector('p');
                if (h4_7) h4_7.textContent = 'تطبيقات الويب التقدمية (PWA)';
                if (gp_7) gp_7.textContent = 'تستخدم تطبيقات الويب التقدمية مقاسات أيقونات متعددة مشتقة من مجموعة أيقونات الموقع. عندما يقوم المستخدمون بتثبيت تطبيق ويب تقدمي، تصبح هذه الأيقونات هي أيقونة تشغيل التطبيق، وأيقونة شاشة البدء، وأيقونة مبدل المهام، وأيقونة الإشعارات.';

                // Item 8
                const h4_8 = gridItems[7].querySelector('h4');
                const gp_8 = gridItems[7].querySelector('p');
                if (h4_8) h4_8.textContent = 'صفحات بدء المتصفح';
                if (gp_8) gp_8.textContent = 'تعرض العديد من المتصفحات المواقع التي تتم زيارتها بشكل متكرر في صفحات التبويب الجديدة أو لوحات معلومات الصفحة الرئيسية. تُستخدم أيقونات المواقع بشكل شائع كمعرف مرئي لكل موقع ويب، مما يسهل التعرف عليها بلمحة بصر.';

                // Item 9
                const h4_9 = gridItems[8].querySelector('h4');
                const gp_9 = gridItems[8].querySelector('p');
                if (h4_9) h4_9.textContent = 'مديرو كلمات المرور والتعبئة التلقائية للمتصفح';
                if (gp_9) gp_9.textContent = 'يعرض بعض مديري كلمات المرور ومديري بيانات اعتبار المتصفح أيقونات المواقع بجانب بيانات تسجيل الدخول المحفوظة. ويساعد هذا المستخدمين على تحديد موقع الويب الصحيح بسرعة قبل التعبئة التلقائية لأسماء المستخدمين وكلمات المرور.';
            }

            // Card 4: Why is a favicon important?
            const h2_4 = cards[3].querySelector('h2');
            if (h2_4) h2_4.textContent = 'لماذا تعتبر أيقونة الموقع (Favicon) مهمة؟';
            const pList_4 = cards[3].querySelectorAll('p');
            if (pList_4.length >= 2) {
                pList_4[0].textContent = 'للوهلة الأولى، قد تبدو أيقونة الموقع عنصراً ثانوياً في التصميم. ففي النهاية، غالباً ما تكون أبعادها 16 × 16 أو 32 × 32 بكسل فقط. ومع ذلك، فإن تأثيرها يمتد إلى ما هو أبعد بكثير من حجمها. تعمل الأيقونة كمعرف مرئي لموقعك عبر المتصفحات، والإشارات المرجعية، ونتائج البحث، والأجهزة المحمولة، مما يساعد المستخدمين على التعرف على علامتك التجارية والوثوق بها.';
                pList_4[1].textContent = 'بالنسبة للشركات، والمدونين، ومتاجر التجارة الإلكترونية، وشركات البرمجيات كخدمة (SaaS)، والمواقع الشخصية، تعد أيقونة الموقع جزءاً أساسياً من تصميم الويب الاحترافي. وبدونها، غالباً ما تعرض المتصفحات أيقونة افتراضية عامة، مما قد يجعل الموقع يبدو غير مكتمل أو أقل مصداقية.';
            }
            const h3List_4 = cards[3].querySelectorAll('h3');
            if (h3List_4.length >= 8) {
                h3List_4[0].textContent = 'تحسين التعرف على العلامة التجارية';
                h3List_4[1].textContent = 'تسهيل التعرف على علامات تبويب المتصفح';
                h3List_4[2].textContent = 'تحسين تجربة المستخدم (UX)';
                h3List_4[3].textContent = 'بناء الثقة والاحترافية';
                h3List_4[4].textContent = 'تحسين ظهور الإشارات المرجعية';
                h3List_4[5].textContent = 'دعم تجربة مستخدم الهاتف المحمول';
                h3List_4[6].textContent = 'دعم اتساق العلامة التجارية عبر المنصات المختلفة';
                h3List_4[7].textContent = 'يمكن أن تحسن نسب النقر إلى الظهور بشكل غير مباشر';
            }
            const pWithH3_List = cards[3].querySelectorAll('p:not([style*="font-size: 1.15rem"])');
            pWithH3_List.forEach(p => {
                const text = p.textContent.trim();
                if (text.includes("One of the biggest advantages of a favicon")) {
                    p.textContent = 'واحدة من أكبر مزايا أيقونة الموقع هي أنها تعزز التعرف على العلامة التجارية. يربط الناس بشكل طبيعي الرموز المرئية بالعلامات التجارية بشكل أسرع من النصوص. تعزز الأيقونة المصممة جيداً هوية موقعك في كل مرة يفتح فيها شخص ما علامة تبويب متصفح، أو يتحقق من إشاراته المرجعية، أو يرى موقعك في نتائج البحث المدعومة.';
                } else if (text.includes("Modern internet users rarely keep")) {
                    p.textContent = 'نادراً ما يكتفي مستخدمو الإنترنت المعاصرون بفتح علامة تبويب متصفح واحدة فقط. يعمل الكثير من الأشخاص على عشرات التبويب في وقت واحد، وينتقلون بين المواقع طوال اليوم. وعندما يتم تقصير عناوين الصفحات بسبب ضيق مساحة التبويب، غالباً ما تصبح الأيقونة هي الدليل المرئي الأساسي الذي يساعد المستخدمين على تحديد علامة التبويب الصحيحة.';
                } else if (text.includes("User experience is influenced by many")) {
                    p.textContent = 'تتأثر تجربة المستخدم بالعديد من التفاصيل الصغيرة، وأيقونة الموقع هي واحدة منها. على الرغم من أنها لا تغير طريقة عمل موقعك، إلا أنها تحسن كيفية تفاعل المستخدمين معه من خلال توفير سياق مرئي واضح.';
                } else if (text.includes("A missing favicon may not prevent visitors")) {
                    p.textContent = 'قد لا تمنع أيقونة الموقع المفقودة الزوار من استخدام موقعك، ولكنها قد تؤثر بشكل خفي على الانطباع الأول. عندما تعرض المتصفحات أيقونة افتراضية عامة بدلاً من أيقونة مخصصة لعلامتك التجارية، قد يرى المستخدمون الموقع غير مكتمل أو قديماً أو أقل موثوقية. تشير الأيقونة المخصصة إلى الاهتمام بالتفاصيل والاحترافية.';
                } else if (text.includes("Many users bookmark websites they plan")) {
                    p.textContent = 'يقوم العديد من المستخدمين بحفظ المواقع التي يخططون لإعادة زيارتها في الإشارات المرجعية. تعرض المتصفحات الأيقونات بجانب عناوين الإشارات المرجعية. عندما يتم تنظيم الإشارات المرجعية في مجلدات تحتوي على عشرات المواقع، فإن الأيقونة الممينة تساعد موقعك على البروز، مما يزيد من احتمالية تكرار الزيارات.';
                } else if (text.includes("Favicons are no longer limited to desktop")) {
                    p.textContent = 'لم تعد أيقونات المواقع مقتصرة على متصفحات الكمبيوتر. فعلى الهواتف الذكية والأجهزة اللوحية، تستخدم المتصفحات أيقونات المواقع عندما يضيف المستخدمون صفحات إلى شاشاتهم الرئيسية. وتعتمد تطبيقات الويب التقدمية (PWAs) أيضاً على هذه الأيقونات لتشغيل التطبيق، وشاشات البدء، والإشعارات، ومبدلات المهام.';
                } else if (text.includes("A consistent favicon ensures your brand remains")) {
                    p.textContent = 'تضمن الأيقونة المتسقة بقاء علامتك التجارية قابلة للتمييز بغض النظر عن المكان الذي يواجه فيه المستخدمون موقعك: متصفحات الكمبيوتر، الشاشات الرئيسية للهواتف، سجل المتصفح، مديرو كلمات المرور، أو نتائج البحث.';
                } else if (text.includes("In supported search experiences, a recognizable")) {
                    p.textContent = 'في تجارب البحث المدعومة، تساعد أيقونة الموقع المميزة المعروضة بجانب عنوان موقعك ورابط URL المستخدمين على تحديد علامتك التجارية بسرعة. يمكن أن تؤدي الهوية التجارية المألوفة إلى زيادة الثقة وتشجيع النقر في نتائج البحث.';
                }
            });
            const listItems_4 = cards[3].querySelectorAll('ul li');
            listItems_4.forEach(li => {
                const text = li.innerHTML;
                if (text.includes("Reinforces visual identity")) {
                    li.innerHTML = '<strong>تعزيز الهوية البصرية:</strong> يخلق صلة لا تُنسى مع الزوار.';
                } else if (text.includes("Increases brand recall")) {
                    li.innerHTML = '<strong>زيادة تذكر العلامة التجارية:</strong> يساعد المستخدمين على تذكر اسم علامتك التجارية وأسلوب شعارك.';
                } else if (text.includes("Creates consistency")) {
                    li.innerHTML = '<strong>خلق الاتساق والتكامل:</strong> يحافظ على أسلوب موحد عبر المتصفحات والأجهزة.';
                } else if (text.includes("Makes website memorable")) {
                    li.innerHTML = '<strong>جعل الموقع مميزاً:</strong> يميز علامتك التجارية بصرياً.';
                } else if (text.includes("Simplify navigation")) {
                    li.textContent = 'تبسيط التنقل بين عدة علامات تبويب مفتوحة';
                } else if (text.includes("Improve bookmark organization")) {
                    li.textContent = 'تحسين تنظيم الإشارات المرجعية';
                } else if (text.includes("Make browser history easier to scan")) {
                    li.textContent = 'تسهيل فحص سجل المتصفح';
                } else if (text.includes("Help users quickly locate")) {
                    li.textContent = 'مساعدة المستخدمين في تحديد موقع المواقع المحفوظة بسرعة';
                } else if (text.includes("Provide visual continuity")) {
                    li.textContent = 'توفير الاستمرارية البصرية عبر الأجهزة المختلفة';
                }
            });
            const noFaviconHeader = cards[3].querySelector('h5[style*="color: #ef4444"]');
            if (noFaviconHeader) noFaviconHeader.textContent = 'بدون أيقونة موقع';
            const noFaviconP = noFaviconHeader?.nextElementSibling;
            if (noFaviconP) noFaviconP.textContent = 'تعرض علامات التبويب المتعددة أيقونات افتراضية عامة متطابقة. ويجب على المستخدمين قراءة العناوين المبتورة، مما يجعل العثور على الموقع الصحيح أبطأ وأكثر إرباكاً.';

            const withFaviconHeader = cards[3].querySelector('h5[style*="color: #06d6a0"]');
            if (withFaviconHeader) withFaviconHeader.textContent = 'مع أيقونة موقع';
            const withFaviconP = withFaviconHeader?.nextElementSibling;
            if (withFaviconP) withFaviconP.textContent = 'كل موقع ويب له معرف مرئي فريد. يمكن للمستخدمين تحديد موقع علامة التبويب الصحيحة بشكل فوري تقريباً، مما يجعل التنقل أسرع وأكثر سهولة.';

            // Card 5: Does a favicon directly improve SEO?
            const h2_5 = cards[4].querySelector('h2');
            if (h2_5) h2_5.textContent = 'هل تعمل أيقونة الموقع (Favicon) على تحسين سيو (SEO) بشكل مباشر؟';
            const pList_5 = cards[4].querySelectorAll('p');
            if (pList_5.length >= 3) {
                pList_5[0].innerHTML = 'أيقونة الموقع ليست عامل ترتيب <strong>مباشر</strong> في Google. وجود الأيقونة بمفرده لن يحسن ترتيبك في نتائج محرك البحث.';
                pList_5[1].textContent = 'ومع ذلك، يمكنها دعم سيو (SEO) بشكل غير مباشر من خلال تعزيز تجربة المستخدم العامة وتقوية علامتك التجارية:';
                pList_5[2].textContent = 'تكافئ محركات البحث بشكل متزايد مواقع الويب التي توفر تجربة مستخدم إيجابية. بينما تعد أيقونة الموقع مجرد مكون صغير واحد، إلا أنها تكمل التحسينات الفنية والتصميمية الأخرى التي تساهم في إنشاء موقع ويب عالي الجودة.';
            }
            const listItems_5 = cards[4].querySelectorAll('ul li');
            if (listItems_5.length >= 6) {
                listItems_5[0].textContent = 'تعرف أفضل على العلامة التجارية وثقة أكبر من المستخدمين';
                listItems_5[1].textContent = 'تحسين ثقة المستخدمين والمصداقية المهنية';
                listItems_5[2].textContent = 'زيادة الوضوح والظهور في علامات التبويب والإشارات المرجعية للمتصفح';
                listItems_5[3].textContent = 'اتساق وتكامل أقوى للعلامة التجارية عبر المنصات المختلفة';
                listItems_5[4].textContent = 'احتمالية أعلى لنسب النقر إلى الظهور في نتائج البحث المدعومة';
                listItems_5[5].textContent = 'تنقل أسهل للزوار المتكررين';
            }

            // Card 6: Key Takeaways
            const h2_6 = cards[5].querySelector('h2');
            if (h2_6) h2_6.textContent = 'النقاط الرئيسية المستخلصة';
            const pList_6 = cards[5].querySelectorAll('p');
            if (pList_6.length >= 3) {
                pList_6[0].textContent = 'أيقونة الموقع (Favicon) هي أكثر بكثير من مجرد رمز زخرفي. إنها أصل أساسي للهوية التجارية يعمل على تحسين التعرف والسهولة والاحترافية عبر المتصفحات، والإشارات المرجعية، والأجهزة المحمولة، وواجهات البحث.';
                pList_6[1].textContent = 'من خلال تثبيت أيقونة موقع مصممة جيداً، يمكنك:';
                pList_6[2].textContent = 'على الرغم من أنها تشغل بضعة بكسلات فقط، إلا أن أيقونة الموقع لها تأثير دائم على كيفية إدراك المستخدمين لموقعك وتفاعلهم معه.';
            }
            const listItems_6 = cards[5].querySelectorAll('ul li');
            if (listItems_6.length >= 6) {
                listItems_6[0].textContent = 'تقوية هوية علامتك التجارية';
                listItems_6[1].textContent = 'مساعدة المستخدمين في التعرف على موقعك فوراً';
                listItems_6[2].textContent = 'تحسين التنقل عبر علامات التبويب والإشارات المرجعية للمتصفح';
                listItems_6[3].textContent = 'إنشاء مظهر أكثر صقلاً وجدارة بالثقة';
                listItems_6[4].textContent = 'دعم تجربة مستخدم أفضل بشكل عام';
                listItems_6[5].textContent = 'المساهمة بشكل غير مباشر في تفاعل المستخدمين وأداء سيو (SEO)';
            }
        }

        // Bottom CTA Section
        let bottomCta = null;
        doc.querySelectorAll('section').forEach(sec => {
            if (sec.className.includes('bottom-cta')) {
                bottomCta = sec;
            }
        });

        if (bottomCta) {
            const h2 = bottomCta.querySelector('h2');
            if (h2) h2.textContent = 'ابدأ تحويل صور PNG إلى أيقونات مواقع (Favicon) مجانًا اليوم';

            const p = bottomCta.querySelector('p');
            if (p) p.textContent = 'انضم إلى أكثر من 50,000 مستخدم يثقون في موقع PNGtoFavicon.com للحصول على خدمة دقيقة وسريعة ومجانية تماماً لإنشاء أيقونات المواقع.';

            const btn = bottomCta.querySelector('.btn');
            if (btn) btn.textContent = 'ابدأ التحويل الآن - الخدمة مجانية!';
        }

        // Explore More Favicon Tools
        let toolsSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Explore More Favicon Tools')) {
                toolsSec = sec;
            }
        });

        if (toolsSec) {
            const h2 = toolsSec.querySelector('h2');
            if (h2) h2.textContent = 'استكشف المزيد من أدوات الأيقونات';

            const subtitle = toolsSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'يقدم موقع PNGtoFavicon مجموعة كاملة من الأدوات لتلبية جميع احتياجات الأيقونات الخاصة بك';

            const cardsList = toolsSec.querySelectorAll('.tool-card');
            if (cardsList.length >= 3) {
                // Card 1: Text to Favicon
                const h3_1 = cardsList[0].querySelector('h3');
                const p_1 = cardsList[0].querySelector('p');
                const link_1 = cardsList[0].querySelector('.tool-card-link');
                if (h3_1) h3_1.textContent = 'نص إلى أيقونة';
                if (p_1) p_1.textContent = 'أنشئ أيقونة موقع من الأحرف أو الأحرف الأولى لاسم شركتك أو أي نص آخر. اختر الخطوط والألوان والأنماط لإنشاء أيقونة فريدة لعلامتك التجارية.';
                if (link_1) link_1.textContent = 'جربها مجاناً ←';

                // Card 2: Emoji to Favicon
                const h3_2 = cardsList[1].querySelector('h3');
                const p_2 = cardsList[1].querySelector('p');
                const link_2 = cardsList[1].querySelector('.tool-card-link');
                if (h3_2) h3_2.textContent = 'رمز تعبيري إلى أيقونة';
                if (p_2) p_2.textContent = 'حول أي رمز تعبيري (Emoji) إلى أيقونة favicon متوافقة مع جميع الأجهزة. اختر الخلفية والأشكال والأحجام وقم بالتنزيل فوراً.';
                if (link_2) link_2.textContent = 'جربها مجاناً ←';

                // Card 3: Favicon Checker
                const h3_3 = cardsList[2].querySelector('h3');
                const p_3 = cardsList[2].querySelector('p');
                const link_3 = cardsList[2].querySelector('.tool-card-link');
                if (h3_3) h3_3.textContent = 'فاحص الأيقونات';
                if (p_3) p_3.textContent = 'افحص أي موقع إلكتروني مباشر للتحقق من الإعداد الصحيح وقابلية اكتشاف متصفحات الويب لأيقونة الموقع وأيقونة Apple وملف manifest.';
                if (link_3) link_3.textContent = 'جربها مجاناً ←';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic tutorials/favicon-best-practices/index.html page translation
    if (targetLang === 'ar' && normPath === 'tutorials/favicon-best-practices/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'تصميم أيقونة الموقع (Favicon) وأفضل ممارسات تحسين محركات البحث (SEO) | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'صمّم أيقونة موقع تبرز بوضوح في علامات تبويب المتصفح وتلبي معايير محركات البحث.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'تصميم أيقونة الموقع (Favicon) وأفضل ممارسات <span class="gradient-text">تحسين محركات البحث (SEO)</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'صمّم أيقونة موقع تبرز بوضوح في علامات تبويب المتصفح وتلبي معايير محركات البحث.';
        }

        // Steps cards
        const stepsSec = doc.querySelector('.section');
        if (stepsSec) {
            const cards = stepsSec.querySelectorAll('.glass-card');
            if (cards.length >= 3) {
                // Card 1
                const h2_1 = cards[0].querySelector('h2');
                const p_1 = cards[0].querySelector('p');
                if (h2_1) h2_1.textContent = '1. اجعل التصميم بسيطاً وسهل التمييز';
                if (p_1) p_1.textContent = 'نظراً لأن حجم الأيقونة يُصغّر ليصل إلى 16×16 بكسل، فإن التفاصيل المعقدة وخطوط النصوص الدقيقة تصبح غير واضحة أو مقروءة. لذا، ركّز على الأشكال الأساسية، أو الحروف المميزة، أو الرمز الرئيسي لشعار علامتك التجارية.';

                // Card 2
                const h2_2 = cards[1].querySelector('h2');
                const p_2 = cards[1].querySelector('p');
                if (h2_2) h2_2.textContent = '2. اختبر التباين في "الوضع الداكن" (Dark Mode)';
                if (p_2) p_2.textContent = 'قد تظهر علامات تبويب المتصفح بألوان مختلفة مثل الرمادي الفاتح، أو الأبيض الناصع، أو الأزرق الداكن، أو الأسود. تأكد من أن شعارك (ذي الخلفية الشفافة) يحتوي على توهج محيطي أو تعبئة لونية صلبة لضمان عدم اختفائه عند عرضه على خلفيات داكنة.';

                // Card 3
                const h2_3 = cards[2].querySelector('h2');
                const p_3 = cards[2].querySelector('p');
                if (h2_3) h2_3.textContent = '3. متطلبات Google لتحسين محركات البحث (SEO)';
                if (p_3) p_3.textContent = 'لدى Google قواعد رسمية لعرض أيقونات المواقع بجوار نتائج البحث:';

                const listItems = cards[2].querySelectorAll('ul li');
                if (listItems.length >= 3) {
                    listItems[0].textContent = 'يجب أن تعبّر الأيقونة بصرياً عن العلامة التجارية للموقع.';
                    listItems[1].textContent = 'يجب أن تكون أبعاد الملف ونسبة العرض إلى الارتفاع من مضاعفات 48 بكسل (مربع)، مثل 48×48 أو 96×96 بكسل، إلخ.';
                    listItems[2].textContent = 'يجب أن يكون رابط الأيقونة (URL) قابلاً للزحف والفهرسة (تجنب حظر Googlebot-Image في ملف robots.txt).';
                }
            }
        }

        // Bottom CTA Section
        let bottomCta = null;
        doc.querySelectorAll('section').forEach(sec => {
            if (sec.className.includes('bottom-cta')) {
                bottomCta = sec;
            }
        });

        if (bottomCta) {
            const h2 = bottomCta.querySelector('h2');
            if (h2) h2.textContent = 'ابدأ تحويل ملفات PNG إلى أيقونات مواقع مجاناً اليوم';

            const p = bottomCta.querySelector('p');
            if (p) p.textContent = 'انضم إلى أكثر من 50,000 مستخدم يثقون في موقع PNGtoFavicon.com لإنشاء أيقونات مواقع بدقة وسرعة ومجانًا بالكامل.';

            const btn = bottomCta.querySelector('.btn');
            if (btn) btn.textContent = 'ابدأ التحويل الآن - الخدمة مجانية!';
        }

        // Explore More Favicon Tools
        let toolsSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Explore More Favicon Tools')) {
                toolsSec = sec;
            }
        });

        if (toolsSec) {
            const h2 = toolsSec.querySelector('h2');
            if (h2) h2.textContent = 'استكشف المزيد من أدوات الأيقونات';

            const subtitle = toolsSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'يقدم موقع PNGtoFavicon مجموعة كاملة من الأدوات لتلبية جميع احتياجات الأيقونات الخاصة بك';

            const cardsList = toolsSec.querySelectorAll('.tool-card');
            if (cardsList.length >= 3) {
                // Card 1: Text to Favicon
                const h3_1 = cardsList[0].querySelector('h3');
                const p_1 = cardsList[0].querySelector('p');
                const link_1 = cardsList[0].querySelector('.tool-card-link');
                if (h3_1) h3_1.textContent = 'نص إلى أيقونة';
                if (p_1) p_1.textContent = 'أنشئ أيقونة موقع من الأحرف أو الأحرف الأولى لاسم شركتك أو أي نص آخر. اختر الخطوط والألوان والأنماط لإنشاء أيقونة فريدة لعلامتك التجارية.';
                if (link_1) link_1.textContent = 'جربها مجاناً ←';

                // Card 2: Emoji to Favicon
                const h3_2 = cardsList[1].querySelector('h3');
                const p_2 = cardsList[1].querySelector('p');
                const link_2 = cardsList[1].querySelector('.tool-card-link');
                if (h3_2) h3_2.textContent = 'رمز تعبيري إلى أيقونة';
                if (p_2) p_2.textContent = 'حول أي رمز تعبيري (Emoji) إلى أيقونة favicon متوافقة مع جميع الأجهزة. اختر الخلفية والأشكال والأحجام وقم بالتنزيل فوراً.';
                if (link_2) link_2.textContent = 'جربها مجاناً ←';

                // Card 3: Favicon Checker
                const h3_3 = cardsList[2].querySelector('h3');
                const p_3 = cardsList[2].querySelector('p');
                const link_3 = cardsList[2].querySelector('.tool-card-link');
                if (h3_3) h3_3.textContent = 'فاحص الأيقونات';
                if (p_3) p_3.textContent = 'افحص أي موقع إلكتروني مباشر للتحقق من الإعداد الصحيح وقابلية اكتشاف متصفحات الويب لأيقونة الموقع وأيقونة Apple وملف manifest.';
                if (link_3) link_3.textContent = 'جربها مجاناً ←';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic blog/favicon-seo-guide/index.html page translation
    if (targetLang === 'ar' && normPath === 'blog/favicon-seo-guide/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'دليل سيو (SEO) لأيقونة الموقع: زيادة نسبة النقر إلى الظهور لمقتطفات البحث | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'تعرض مقتطفات نتائج بحث Google (SERP) أيقونات المواقع بجانب أسماء المواقع. تعلّم كيفية تحسين أيقونتك لكسب المزيد من النقرات في البحث المجاني.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'دليل سيو (SEO) <span class="gradient-text">لأيقونة الموقع</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'تعرض مقتطفات نتائج بحث Google (SERP) أيقونات المواقع بجانب أسماء المواقع. تعلّم كيفية تحسين أيقونتك لكسب المزيد من النقرات في البحث المجاني.';
        }

        // Post meta
        const postMeta = doc.querySelector('.post-meta');
        if (postMeta) {
            postMeta.innerHTML = '<span>نشر في: 15 يناير 2026</span> • <span>وقت القراءة: 4 دقائق</span>';
        }

        // Main content card
        const card = doc.querySelector('.glass-card');
        if (card) {
            const pList = card.querySelectorAll('p');
            if (pList.length >= 2) {
                pList[0].textContent = 'لم تعد أيقونات المواقع مجرد عناصر جمالية في علامات تبويب المتصفح. ففي مشهد البحث المجاني اليوم، تعمل كمعرفات بارزة للهوية التجارية مباشرة داخل صفحات نتائج محرك البحث (SERPs).';
                pList[1].textContent = 'على الرغم من أن Google لا يرتب موقعك في مرتبة أعلى لمجرد وجود أيقونة موقع، إلا أن الرمز المرئي يؤثر بشكل مباشر على سلوك الباحثين. تزيد الأيقونة الاحترافية والواضحة وذات التباين العالي بجانب عنوان صفحتك من مصداقية العلامة التجارية والملاءمة البصرية، مما يؤدي إلى زيادة نسبة النقر إلى الظهور (CTR). وتشير نسبة النقر إلى الظهور العالية في البحث المجاني إلى جودة الصفحة لخوارزميات البحث، مما يعزز ترتيب موقعك بشكل غير مباشر.';
            }

            const h2List = card.querySelectorAll('h2');
            if (h2List.length >= 2) {
                h2List[0].textContent = 'لماذا تعتبر أيقونة الموقع مهمة لتحسين محركات البحث سيو (SEO)؟';
                h2List[1].textContent = 'إرشادات Google الخاصة بأيقونات المواقع';
            }

            const listItems = card.querySelectorAll('ul li');
            if (listItems.length >= 3) {
                listItems[0].innerHTML = '<strong>أن تكون ممثلة للعلامة التجارية:</strong> يجب أن تشبه الأيقونة شعار علامتك التجارية أو رمزها. قد يتم استبدال الأيقونات العامة أو المضللة بأيقونة الكرة الأرضية الافتراضية.';
                listItems[1].innerHTML = '<strong>رابط URL قابل للزحف:</strong> تأكد من أن مسار أيقونتك غير محظور بواسطة ملف robots.txt الخاص بك، خاصةً لبرنامج الزحف Googlebot-Image.';
                listItems[2].innerHTML = '<strong>نسبة عرض إلى ارتفاع مربعة:</strong> على سبيل المثال، 48×48 بكسل أو 96×96 بكسل أو 192×192 بكسل. يقوم Google تلقائياً بتصغير الأيقونة إلى 16×16 بكسل لعرضها في نتائج البحث.';
            }
        }

        // Bottom CTA Section
        let bottomCta = null;
        doc.querySelectorAll('section').forEach(sec => {
            if (sec.className.includes('bottom-cta')) {
                bottomCta = sec;
            }
        });

        if (bottomCta) {
            const h2 = bottomCta.querySelector('h2');
            if (h2) h2.textContent = 'ابدأ تحويل ملفات PNG إلى أيقونات مواقع مجاناً اليوم';

            const p = bottomCta.querySelector('p');
            if (p) p.textContent = 'انضم إلى أكثر من 50,000 مستخدم يثقون في موقع PNGtoFavicon.com لإنشاء أيقونات مواقع بدقة وسرعة ومجانًا بالكامل.';

            const btn = bottomCta.querySelector('.btn');
            if (btn) btn.textContent = 'ابدأ التحويل الآن - الخدمة مجانية!';
        }

        // Explore More Favicon Tools
        let toolsSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Explore More Favicon Tools')) {
                toolsSec = sec;
            }
        });

        if (toolsSec) {
            const h2 = toolsSec.querySelector('h2');
            if (h2) h2.textContent = 'استكشف المزيد من أدوات الأيقونات';

            const subtitle = toolsSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'يقدم موقع PNGtoFavicon مجموعة كاملة من الأدوات لتلبية جميع احتياجات الأيقونات الخاصة بك';

            const cardsList = toolsSec.querySelectorAll('.tool-card');
            if (cardsList.length >= 3) {
                // Card 1: Text to Favicon
                const h3_1 = cardsList[0].querySelector('h3');
                const p_1 = cardsList[0].querySelector('p');
                const link_1 = cardsList[0].querySelector('.tool-card-link');
                if (h3_1) h3_1.textContent = 'نص إلى أيقونة';
                if (p_1) p_1.textContent = 'أنشئ أيقونة موقع من الأحرف أو الأحرف الأولى لاسم شركتك أو أي نص آخر. اختر الخطوط والألوان والأنماط لإنشاء أيقونة فريدة لعلامتك التجارية.';
                if (link_1) link_1.textContent = 'جربها مجاناً ←';

                // Card 2: Emoji to Favicon
                const h3_2 = cardsList[1].querySelector('h3');
                const p_2 = cardsList[1].querySelector('p');
                const link_2 = cardsList[1].querySelector('.tool-card-link');
                if (h3_2) h3_2.textContent = 'رمز تعبيري إلى أيقونة';
                if (p_2) p_2.textContent = 'حول أي رمز تعبيري (Emoji) إلى أيقونة favicon متوافقة مع جميع الأجهزة. اختر الخلفية والأشكال والأحجام وقم بالتنزيل فوراً.';
                if (link_2) link_2.textContent = 'جربها مجاناً ←';

                // Card 3: Favicon Checker
                const h3_3 = cardsList[2].querySelector('h3');
                const p_3 = cardsList[2].querySelector('p');
                const link_3 = cardsList[2].querySelector('.tool-card-link');
                if (h3_3) h3_3.textContent = 'فاحص الأيقونات';
                if (p_3) p_3.textContent = 'افحص أي موقع إلكتروني مباشر للتحقق من الإعداد الصحيح وقابلية اكتشاف متصفحات الويب لأيقونة الموقع وأيقونة Apple وملف manifest.';
                if (link_3) link_3.textContent = 'جربها مجاناً ←';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic blog/png-vs-ico-vs-svg-favicons/index.html page translation
    if (targetLang === 'ar' && normPath === 'blog/png-vs-ico-vs-svg-favicons/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'مقارنة بين PNG و ICO و SVG: اختيار أفضل صيغة لأيقونة الموقع | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'أي صيغة لأيقونة تبويب المتصفح هي الأنسب لموقعك؟ تحليل فني مفصل لمقارنة صيغ PNG و ICO و SVG.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'مقارنة بين صيغ <span class="gradient-text">PNG و ICO و SVG</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'أي صيغة لأيقونة تبويب المتصفح هي الأنسب لموقعك؟ تحليل فني مفصل.';
        }

        // Post meta
        const postMeta = doc.querySelector('.post-meta');
        if (postMeta) {
            postMeta.innerHTML = '<span>نشر في: 12 يناير 2026</span> • <span>وقت القراءة: 5 دقائق</span>';
        }

        // Main content card
        const card = doc.querySelector('.glass-card');
        if (card) {
            const pList = card.querySelectorAll('p');
            if (pList.length >= 4) {
                pList[0].textContent = 'قد يكون اتخاذ القرار بشأن ملفات أيقونة الموقع (favicon) التي يجب تضمينها في أدلة الخادم أمراً محيراً. دعنا نلقي نظرة على الصيغ الثلاث الرئيسية: ICO و PNG و SVG.';
                pList[1].textContent = 'صيغة .ico من Microsoft هي عبارة عن حاوية تحتوي على مقاسات متعددة (عادةً 16×16 و32×32 و48×48 بكسل) داخل ملف واحد. في حين أن المتصفحات القديمة مثل Internet Explorer كانت تتطلب هذه الصيغة حصرياً، إلا أنها تُحفظ اليوم كبديل عالمي للأنظمة القديمة.';
                pList[2].textContent = 'تدعم ملفات PNG الشفافية ولوحات الألوان الغنية بمعدل 24 بت، وتتميز بنسب ضغط ممتازة. تفضل المتصفحات الحديثة ملفات PNG عالية الدقة على ملفات ICO لأنها تتكيف بشكل جميل على شاشات retina. عادةً ما تقوم بتحديد ملفات PNG بمقاسات 16×16 و32×32 لأيقونات تبويب متصفحات الكمبيوتر.';
                pList[3].textContent = 'تعتمد ملفات SVG على المتجهات، مما يعني أنها تتكيف وتكبر بشكل غير محدود دون بكسلة. وتتميز بحجم ملفات صغير للغاية. بالإضافة إلى ذلك، تدعم ملفات SVG استعلامات وسائط CSS (media queries) داخل الأكواد، مما يسمح للأيقونة بتغيير نظام الألوان ديناميكياً عندما يقوم المستخدم بتفعيل الوضع الداكن في نظام تشغيله.';
            }

            const h2List = card.querySelectorAll('h2');
            if (h2List.length >= 3) {
                h2List[0].textContent = '1. ICO (الخيار البديل المتوافق مع الأنظمة القديمة)';
                h2List[1].textContent = '2. PNG (المعيار الحديث)';
                h2List[2].textContent = '3. SVG (مستقبل الرسوميات المتجهة)';
            }
        }

        // Bottom CTA Section
        let bottomCta = null;
        doc.querySelectorAll('section').forEach(sec => {
            if (sec.className.includes('bottom-cta')) {
                bottomCta = sec;
            }
        });

        if (bottomCta) {
            const h2 = bottomCta.querySelector('h2');
            if (h2) h2.textContent = 'ابدأ تحويل ملفات PNG إلى أيقونات مواقع مجاناً اليوم';

            const p = bottomCta.querySelector('p');
            if (p) p.textContent = 'انضم إلى أكثر من 50,000 مستخدم يثقون في موقع PNGtoFavicon.com لإنشاء أيقونات مواقع بدقة وسرعة ومجانًا بالكامل.';

            const btn = bottomCta.querySelector('.btn');
            if (btn) btn.textContent = 'ابدأ التحويل الآن - الخدمة مجانية!';
        }

        // Explore More Favicon Tools
        let toolsSec = null;
        doc.querySelectorAll('section').forEach(sec => {
            const h2 = sec.querySelector('h2');
            if (h2 && h2.textContent.includes('Explore More Favicon Tools')) {
                toolsSec = sec;
            }
        });

        if (toolsSec) {
            const h2 = toolsSec.querySelector('h2');
            if (h2) h2.textContent = 'استكشف المزيد من أدوات الأيقونات';

            const subtitle = toolsSec.querySelector('p.section-subtitle');
            if (subtitle) subtitle.textContent = 'يقدم موقع PNGtoFavicon مجموعة كاملة من الأدوات لتلبية جميع احتياجات الأيقونات الخاصة بك';

            const cardsList = toolsSec.querySelectorAll('.tool-card');
            if (cardsList.length >= 3) {
                // Card 1: Text to Favicon
                const h3_1 = cardsList[0].querySelector('h3');
                const p_1 = cardsList[0].querySelector('p');
                const link_1 = cardsList[0].querySelector('.tool-card-link');
                if (h3_1) h3_1.textContent = 'نص إلى أيقونة';
                if (p_1) p_1.textContent = 'أنشئ أيقونة موقع من الأحرف أو الأحرف الأولى لاسم شركتك أو أي نص آخر. اختر الخطوط والألوان والأنماط لإنشاء أيقونة فريدة لعلامتك التجارية.';
                if (link_1) link_1.textContent = 'جربها مجاناً ←';

                // Card 2: Emoji to Favicon
                const h3_2 = cardsList[1].querySelector('h3');
                const p_2 = cardsList[1].querySelector('p');
                const link_2 = cardsList[1].querySelector('.tool-card-link');
                if (h3_2) h3_2.textContent = 'رمز تعبيري إلى أيقونة';
                if (p_2) p_2.textContent = 'حول أي رمز تعبيري (Emoji) إلى أيقونة favicon متوافقة مع جميع الأجهزة. اختر الخلفية والأشكال والأحجام وقم بالتنزيل فوراً.';
                if (link_2) link_2.textContent = 'جربها مجاناً ←';

                // Card 3: Favicon Checker
                const h3_3 = cardsList[2].querySelector('h3');
                const p_3 = cardsList[2].querySelector('p');
                const link_3 = cardsList[2].querySelector('.tool-card-link');
                if (h3_3) h3_3.textContent = 'فاحص الأيقونات';
                if (p_3) p_3.textContent = 'افحص أي موقع إلكتروني مباشر للتحقق من الإعداد الصحيح وقابلية اكتشاف متصفحات الويب لأيقونة الموقع وأيقونة Apple وملف manifest.';
                if (link_3) link_3.textContent = 'جربها مجاناً ←';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic about/index.html page translation
    if (targetLang === 'ar' && normPath === 'about/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'من نحن | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'نحن نؤمن بأن أدوات تصميم الويب يجب أن تكون سريعة، ومحسنة للغاية، وتحترم خصوصية المستخدم. تعرف على رسالتنا وطرق الاتصال بنا.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'حول موقع <span class="gradient-text">PNGtoFavicon</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'نحن نؤمن بأن أدوات تصميم الويب يجب أن تكون سريعة، ومحسنة للغاية، وتحترم خصوصية المستخدم.';
        }

        // Cards
        const cards = doc.querySelectorAll('.glass-card');
        if (cards.length >= 2) {
            // Card 1: Our Mission
            const h2_1 = cards[0].querySelector('h2');
            if (h2_1) h2_1.textContent = 'رسالتنا';
            const pList_1 = cards[0].querySelectorAll('p');
            if (pList_1.length >= 2) {
                pList_1[0].textContent = 'لقد أنشأنا موقع PNGtoFavicon لحل مشكلة بسيطة: معظم مولدات الأيقونات (favicon) عبر الإنترنت تقوم برفع رسومات علامتك التجارية الخاصة إلى خوادمها، وتعمل ببطء، وتملأ صفحاتها بالإعلانات المنبثقة المزعجة.';
                pList_1[1].textContent = 'تعمل أداتنا محلياً بنسبة 100% داخل متصفح الويب الخاص بك باستخدام HTML5 Canvas. لا تغادر ملفات شعارك جهاز الكمبيوتر الخاص بك أبداً، وتتم عملية المعالجة والتصدير بشكل فوري، كما أن صيغ الملفات الناتجة محسنة لتتوافق مع معايير سيو (SEO) الحديثة.';
            }

            // Card 2: Contact & Support
            const h2_2 = cards[1].querySelector('h2');
            if (h2_2) h2_2.textContent = 'الاتصال والدعم';
            const p_2 = cards[1].querySelector('p');
            if (p_2) p_2.textContent = 'هل لديك أسئلة، أو ملاحظات، أو تحتاج إلى مساعدة مباشرة في استخدام أدواتنا؟ تواصل معنا عبر أي من القنوات التالية:';

            const h3List = cards[1].querySelectorAll('h3');
            if (h3List.length >= 2) {
                h3List[0].textContent = 'الاتصال المباشر';
                h3List[1].textContent = 'قنوات الدعم';
            }

            const waSpan = cards[1].querySelector('a[href*="wa.me"] span');
            if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic contact/index.html page translation
    if (targetLang === 'ar' && normPath === 'contact/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'اتصل بنا | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'هل لديك أسئلة، أو ملاحظات، أو اقتراحات لميزات جديدة؟ أرسل لنا رسالة من خلال نموذج الاتصال.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'تواصل <span class="gradient-text">معنا</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'هل لديك أسئلة، أو ملاحظات، أو اقتراحات لميزات جديدة؟ أرسل لنا رسالة.';
        }

        // Contact info blocks
        const card = doc.querySelector('.glass-card');
        if (card) {
            const h2List = card.querySelectorAll('h2');
            if (h2List.length >= 2) {
                h2List[0].textContent = 'الاتصال المباشر';
                h2List[1].textContent = 'قنوات الدعم';
            }

            const waSpan = card.querySelector('a[href*="wa.me"] span');
            if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';

            // Form translation
            const labels = card.querySelectorAll('form label');
            if (labels.length >= 3) {
                labels[0].textContent = 'الاسم';
                labels[1].textContent = 'البريد الإلكتروني';
                labels[2].textContent = 'الرسالة';
            }

            const inputs = card.querySelectorAll('form input, form textarea');
            if (inputs.length >= 3) {
                inputs[0].setAttribute('placeholder', 'جون دو');
                inputs[1].setAttribute('placeholder', 'mail@example.com');
                inputs[2].setAttribute('placeholder', 'اكتب رسالتك هنا...');
            }

            const submitBtn = card.querySelector('form button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'إرسال الرسالة';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic privacy/index.html page translation
    if (targetLang === 'ar' && normPath === 'privacy/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'سياسة الخصوصية | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'خصوصيتك هي أولويتنا القصوى. تعرف على سبب وكيفية معالجة رسوماتك وملفاتك محلياً بالكامل.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'سياسة <span class="gradient-text">الخصوصية</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'خصوصيتك هي أولويتنا القصوى. تعرف على سبب معالجة ملفاتك ورسوماتك محلياً.';
        }

        // Cards
        const card = doc.querySelector('.glass-card');
        if (card) {
            const h2List = card.querySelectorAll('h2');
            if (h2List.length >= 2) {
                h2List[0].textContent = 'معالجة البيانات';
                h2List[1].textContent = 'ملفات تعريف الارتباط (Cookies)';
            }

            const pList = card.querySelectorAll('p');
            if (pList.length >= 2) {
                pList[0].textContent = 'يعمل موقع PNGtoFavicon.com بالكامل كتطبيق من جانب العميل (Client-Side). يتم معالجة أي صور تقوم برفعها، أو نصوص تقوم بإدخالها، أو رموز تعبيرية تقوم بتنسيقها محلياً داخل ذاكرة التخزين المؤقت لمتصفحك. نحن لا ننقل أو ننسخ أو نخزن أصولك ورسوماتك البصرية على خوادم الويب الخاصة بنا أبداً.';
                pList[1].textContent = 'نحن نستخدم الحد الأدنى من ملفات تعريف الارتباط لإحصاءات أداء الموقع وحفظ إعدادات المظهر المفضل لديك. لا يتم جمع أي بيانات تعريف شخصية على الإطلاق.';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic terms/index.html page translation
    if (targetLang === 'ar' && normPath === 'terms/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'شروط الاستخدام | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'اتفاقيات الخدمة وشروط الاستخدام للأدوات والميزات المتوفرة على موقعنا.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'شروط <span class="gradient-text">الاستخدام</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'اتفاقيات الخدمة وشروط الاستخدام للأدوات والميزات عبر الإنترنت.';
        }

        // Cards
        const card = doc.querySelector('.glass-card');
        if (card) {
            const h2List = card.querySelectorAll('h2');
            if (h2List.length >= 2) {
                h2List[0].textContent = 'اتفاقية الاستخدام';
                h2List[1].textContent = 'إخلاء المسؤولية';
            }

            const pList = card.querySelectorAll('p');
            if (pList.length >= 2) {
                pList[0].textContent = 'أنت حر في استخدام موقع PNGtoFavicon.com للمشاريع الشخصية أو التجارية. أصول الأيقونات (favicon) التي يتم إنشاؤها هي ملكك لتثبيتها واستخدامها دون أي قيود.';
                pList[1].textContent = 'يتم توفير ملفات التحويل الخاصة بنا "كما هي" دون أي ضمانات. نحن لسنا مسؤولين عن أي أخطاء في عرض الموقع أو إعدادات تثبيت الخادم الخاصة بك.';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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

    // Custom logic for Arabic cookie-policy/index.html page translation
    if (targetLang === 'ar' && normPath === 'cookie-policy/index.html') {
        // Title & Description
        if (doc.title) doc.title = 'سياسة ملفات تعريف الارتباط | PNGtoFavicon';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'تعرّف على سياسة استخدام ملفات تعريف الارتباط (Cookies) الخاصة بموقعنا وكيفية معالجتها لحفظ إعداداتك.');

        // H1 & Subtitle
        const h1 = doc.querySelector('h1');
        if (h1) {
            h1.innerHTML = 'سياسة <span class="gradient-text">ملفات تعريف الارتباط</span>';
        }
        const subtitle = doc.querySelector('p.subtitle');
        if (subtitle) {
            subtitle.textContent = 'تعرّف على سياسة استخدام ملفات تعريف الارتباط (Cookies) الخاصة بنا.';
        }

        // Cards
        const card = doc.querySelector('.glass-card');
        if (card) {
            const h2 = card.querySelector('h2');
            if (h2) h2.textContent = 'كيف نستخدم ملفات تعريف الارتباط (Cookies)؟';

            const p = card.querySelector('p');
            if (p) p.textContent = 'نحن نستخدم ملفات تعريف ارتباط صغيرة في المتصفح لحفظ تكوينات تفضيلات المستخدم الخاصة بك (مثل لوحات الألوان وخيارات الأشكال) ولجمع إحصاءات حركة المرور المجهولة عبر Google Analytics.';
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

        // Footer Section
        const footer = doc.querySelector('footer');
        if (footer) {
            // Brand description
            const brandDesc = footer.querySelector('.footer-brand-col p') || footer.querySelector('p');
            if (brandDesc && brandDesc.textContent.trim().includes('Convert PNG to Favicon')) {
                brandDesc.textContent = 'حوّل صور PNG إلى Favicon فوراً — أداة مجانية عبر الإنترنت';
            }

            // WhatsApp Link
            const waLink = footer.querySelector('a[href*="wa.me"]');
            if (waLink) {
                const waSpan = waLink.querySelector('span');
                if (waSpan) waSpan.textContent = 'دردشة عبر واتساب';
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
