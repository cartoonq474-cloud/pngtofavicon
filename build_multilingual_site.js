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
    
    wrapper.innerHTML = `
        <div class="lang-dropdown">
            <a href="#" class="lang-dropdown-trigger" role="button" aria-haspopup="true" aria-expanded="false" aria-label="Select Language">
                <div class="lang-dropdown-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                    </svg>
                </div>
                <div class="lang-dropdown-label">
                    <span>Language</span>
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
