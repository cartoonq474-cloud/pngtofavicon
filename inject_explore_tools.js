const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Explore Section HTML from main index.html
const exploreSectionHtml = `
    <!-- ============================== -->
    <!--       OTHER TOOLS SECTION      -->
    <!-- ============================== -->
    <section class="section" id="other-tools">
      <div class="container">
        <h2 class="section-title">Explore More Favicon Tools</h2>
        <p class="section-subtitle">PNGtoFavicon offers a complete suite of tools for all your favicon needs</p>
        <div class="tools-grid">
          <a href="/text-to-favicon/" class="tool-card" id="tool-text">
            <div class="tool-card-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <polyline points="4 7 4 4 20 4 20 7"/>
                <line x1="9" y1="20" x2="15" y2="20"/>
                <line x1="12" y1="4" x2="12" y2="20"/>
              </svg>
            </div>
            <h3>Text to Favicon</h3>
            <p>Create a favicon from letters, initials, or any text. Choose fonts, colors, and styles to generate a unique text-based favicon for your brand.</p>
            <span class="tool-card-link">Try it free ➔</span>
          </a>
          <a href="/emoji-to-favicon/" class="tool-card" id="tool-emoji">
            <div class="tool-card-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </div>
            <h3>Emoji to Favicon</h3>
            <p>Choose from hundreds of emojis to instantly create a colorful, expressive favicon. Perfect for personal projects, blogs, and quick prototypes.</p>
            <span class="tool-card-link">Try it free ➔</span>
          </a>
          <a href="/favicon-checker/" class="tool-card" id="tool-checker">
            <div class="tool-card-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <h3>Favicon Checker</h3>
            <p>Validate your website's favicon setup. Enter any URL to check for missing sizes, incorrect formats, and cross-platform compatibility issues.</p>
            <span class="tool-card-link">Check now ➔</span>
          </a>
        </div>
      </div>
    </section>
`;

const translations = {
  ar: {
    "Explore More Favicon Tools": "استكشف المزيد من أدوات الأيقونات",
    "PNGtoFavicon offers a complete suite of tools for all your favicon needs": "يقدم PNGtoFavicon مجموعة كاملة من الأدوات لجميع احتياجات الأيقونات الخاصة بك",
    "Text to Favicon": "نص إلى أيقونة",
    "Create a favicon from letters, initials, or any text. Choose fonts, colors, and styles to generate a unique text-based favicon for your brand.": "قم بإنشاء أيقونة من الحروف أو الأحرف الأولى أو أي نص. اختر الخطوط والألوان والأنماط لإنشاء أيقونة نصية فريدة لعلامتك التجارية.",
    "Try it free ➔": "جربه مجانًا ➔",
    "Emoji to Favicon": "رمز تعبيري إلى أيقونة",
    "Choose from hundreds of emojis to instantly create a colorful, expressive favicon. Perfect for personal projects, blogs, and quick prototypes.": "اختر من بين مئات الرموز التعبيرية لإنشاء أيقونة ملونة ومعبرة على الفور. مثالي للمشاريع الشخصية والمدونات والنماذج الأولية السريعة.",
    "Favicon Checker": "فاحص الأيقونات",
    "Validate your website's favicon setup. Enter any URL to check for missing sizes, incorrect formats, and cross-platform compatibility issues.": "تحقق من إعداد أيقونة موقع الويب الخاص بك. أدخل أي عنوان URL للتحقق من الأحجام المفقودة والتنسيقات غير الصحيحة ومشكلات التوافق عبر الأنظمة الأساسية.",
    "Check now ➔": "تحقق الآن ➔"
  },
  de: {
    "Explore More Favicon Tools": "Weitere Favicon-Tools entdecken",
    "PNGtoFavicon offers a complete suite of tools for all your favicon needs": "PNGtoFavicon bietet eine vollständige Suite von Tools für alle Ihre Favicon-Anforderungen",
    "Text to Favicon": "Text zu Favicon",
    "Create a favicon from letters, initials, or any text. Choose fonts, colors, and styles to generate a unique text-based favicon for your brand.": "Erstellen Sie ein Favicon aus Buchstaben, Initialen oder beliebigem Text. Wählen Sie Schriftarten, Farben und Stile, um ein einzigartiges textbasiertes Favicon für Ihre Marke zu erstellen.",
    "Try it free ➔": "Kostenlos testen ➔",
    "Emoji to Favicon": "Emoji zu Favicon",
    "Choose from hundreds of emojis to instantly create a colorful, expressive favicon. Perfect for personal projects, blogs, and quick prototypes.": "Wählen Sie aus Hunderten von Emojis, um sofort ein farbenfrohes, ausdrucksstarkes Favicon zu erstellen. Perfekt für persönliche Projekte, Blogs und schnelle Prototypen.",
    "Favicon Checker": "Favicon-Prüfer",
    "Validate your website's favicon setup. Enter any URL to check for missing sizes, incorrect formats, and cross-platform compatibility issues.": "Validieren Sie das Favicon-Setup Ihrer Website. Geben Sie eine beliebige URL ein, um auf fehlende Größen, falsche Formate und plattformübergreifende Kompatibilitätsprobleme zu prüfen.",
    "Check now ➔": "Jetzt prüfen ➔"
  },
  es: {
    "Explore More Favicon Tools": "Explora Más Herramientas de Favicon",
    "PNGtoFavicon offers a complete suite of tools for all your favicon needs": "PNGtoFavicon ofrece un conjunto completo de herramientas para todas sus necesidades de favicon",
    "Text to Favicon": "Texto a Favicon",
    "Create a favicon from letters, initials, or any text. Choose fonts, colors, and styles to generate a unique text-based favicon for your brand.": "Crea un favicon a partir de letras, iniciales o cualquier texto. Elige fuentes, colores y estilos para generar un favicon único basado en texto para tu marca.",
    "Try it free ➔": "Pruébalo gratis ➔",
    "Emoji to Favicon": "Emoji a Favicon",
    "Choose from hundreds of emojis to instantly create a colorful, expressive favicon. Perfect for personal projects, blogs, and quick prototypes.": "Elige entre cientos de emojis para crear instantáneamente un favicon colorido y expresivo. Perfecto para proyectos personales, blogs y prototipos rápidos.",
    "Favicon Checker": "Comprobador de Favicon",
    "Validate your website's favicon setup. Enter any URL to check for missing sizes, incorrect formats, and cross-platform compatibility issues.": "Valida la configuración del favicon de tu sitio web. Introduce cualquier URL para comprobar si faltan tamaños, formatos incorrectos y problemas de compatibilidad multiplataforma.",
    "Check now ➔": "Comprobar ahora ➔"
  },
  fr: {
    "Explore More Favicon Tools": "Découvrez d'Autres Outils Favicon",
    "PNGtoFavicon offers a complete suite of tools for all your favicon needs": "PNGtoFavicon propose une suite complète d'outils pour tous vos besoins en matière de favicon",
    "Text to Favicon": "Texte en Favicon",
    "Create a favicon from letters, initials, or any text. Choose fonts, colors, and styles to generate a unique text-based favicon for your brand.": "Créez un favicon à partir de lettres, d'initiales ou de n'importe quel texte. Choisissez des polices, des couleurs et des styles pour générer un favicon unique basé sur du texte pour votre marque.",
    "Try it free ➔": "Essayez-le gratuitement ➔",
    "Emoji to Favicon": "Emoji en Favicon",
    "Choose from hundreds of emojis to instantly create a colorful, expressive favicon. Parfait pour les projets personnels, les blogs et les prototypes rapides.": "Choisissez parmi des centaines d'emojis pour créer instantanément un favicon coloré et expressif. Parfait pour les projets personnels, les blogs et les prototypes rapides.",
    "Favicon Checker": "Vérificateur de Favicon",
    "Validate your website's favicon setup. Enter any URL to check for missing sizes, incorrect formats, and cross-platform compatibility issues.": "Validez la configuration de la favicon de votre site Web. Saisissez n'importe quelle URL pour vérifier les tailles manquantes, les formats incorrects et les problèmes de compatibilité multiplateforme.",
    "Check now ➔": "Vérifier maintenant ➔"
  },
  hi: {
    "Explore More Favicon Tools": "अधिक फ़ेविकॉन टूल एक्सप्लोर करें",
    "PNGtoFavicon offers a complete suite of tools for all your favicon needs": "PNGtoFavicon आपकी सभी फ़ेविकॉन आवश्यकताओं के लिए टूल का एक पूरा सूट प्रदान करता है",
    "Text to Favicon": "टेक्स्ट से फ़ेविकॉन",
    "Create a favicon from letters, initials, or any text. Choose fonts, colors, and styles to generate a unique text-based favicon for your brand.": "अक्षरों, आद्याक्षरों या किसी भी टेक्स्ट से एक फ़ेविकॉन बनाएँ। अपने ब्रांड के लिए एक अद्वितीय टेक्स्ट-आधारित फ़ेविकॉन उत्पन्न करने के लिए फ़ॉन्ट, रंग और शैली चुनें।",
    "Try it free ➔": "इसे मुफ़्त आज़माएँ ➔",
    "Emoji to Favicon": "इमोजी से फ़ेविकॉन",
    "Choose from hundreds of emojis to instantly create a colorful, expressive favicon. Perfect for personal projects, blogs, and quick prototypes.": "तुरंत एक रंगीन, अभिव्यंजक फ़ेविकॉन बनाने के लिए सैकड़ों इमोजी में से चुनें। व्यक्तिगत परियोजनाओं, ब्लॉगों और त्वरित प्रोटोटाइप के लिए बिल्कुल सही।",
    "Favicon Checker": "फ़ेविकॉन चेकर",
    "Validate your website's favicon setup. Enter any URL to check for missing sizes, incorrect formats, and cross-platform compatibility issues.": "अपनी वेबसाइट के फ़ेविकॉन सेटअप को मान्य करें। अनुपलब्ध आकारों, गलत स्वरूपों और क्रॉस-प्लेटफ़ॉर्म संगतता समस्याओं की जाँच करने के लिए कोई भी URL दर्ज करें।",
    "Check now ➔": "अभी चेक करें ➔"
  },
  id: {
    "Explore More Favicon Tools": "Jelajahi Lebih Banyak Alat Favicon",
    "PNGtoFavicon offers a complete suite of tools for all your favicon needs": "PNGtoFavicon menawarkan rangkaian alat lengkap untuk semua kebutuhan favicon Anda",
    "Text to Favicon": "Teks ke Favicon",
    "Create a favicon from letters, initials, or any text. Choose fonts, colors, and styles to generate a unique text-based favicon for your brand.": "Buat favicon dari huruf, inisial, atau teks apa pun. Pilih font, warna, dan gaya untuk menghasilkan favicon berbasis teks yang unik untuk merek Anda.",
    "Try it free ➔": "Coba gratis ➔",
    "Emoji to Favicon": "Emoji ke Favicon",
    "Choose from hundreds of emojis to instantly create a colorful, expressive favicon. Perfect for personal projects, blogs, and quick prototypes.": "Pilih dari ratusan emoji untuk langsung membuat favicon yang penuh warna dan ekspresif. Sempurna untuk proyek pribadi, blog, dan prototipe cepat.",
    "Favicon Checker": "Pemeriksa Favicon",
    "Validate your website's favicon setup. Enter any URL to check for missing sizes, incorrect formats, and cross-platform compatibility issues.": "Validasi pengaturan favicon situs web Anda. Masukkan URL apa pun untuk memeriksa ukuran yang hilang, format yang salah, dan masalah kompatibilitas lintas platform.",
    "Check now ➔": "Periksa sekarang ➔"
  },
  pt: {
    "Explore More Favicon Tools": "Explore Mais Ferramentas de Favicon",
    "PNGtoFavicon offers a complete suite of tools for all your favicon needs": "PNGtoFavicon oferece um conjunto completo de ferramentas para todas as suas necessidades de favicon",
    "Text to Favicon": "Texto para Favicon",
    "Create a favicon from letters, initials, or any text. Choose fonts, colors, and styles to generate a unique text-based favicon for your brand.": "Crie um favicon a partir de letras, iniciais ou qualquer texto. Escolha fontes, cores e estilos para gerar um favicon baseado em texto exclusivo para sua marca.",
    "Try it free ➔": "Experimente grátis ➔",
    "Emoji to Favicon": "Emoji para Favicon",
    "Choose from hundreds of emojis to instantly create a colorful, expressive favicon. Perfect for personal projects, blogs, and quick prototypes.": "Escolha entre centenas de emojis para criar instantaneamente um favicon colorido e expressivo. Perfeito para projetos pessoais, blogs e protótipos rápidos.",
    "Favicon Checker": "Verificador de Favicon",
    "Validate your website's favicon setup. Enter any URL to check for missing sizes, incorrect formats, and cross-platform compatibility issues.": "Valide a configuração de favicon do seu site. Insira qualquer URL para verificar se há tamanhos ausentes, formatos incorretos e problemas de compatibilidade entre plataformas.",
    "Check now ➔": "Verificar agora ➔"
  },
  tr: {
    "Explore More Favicon Tools": "Daha Fazla Favicon Aracını Keşfedin",
    "PNGtoFavicon offers a complete suite of tools for all your favicon needs": "PNGtoFavicon, tüm favicon ihtiyaçlarınız için eksiksiz bir araç paketi sunar",
    "Text to Favicon": "Metinden Favicon'a",
    "Create a favicon from letters, initials, or any text. Choose fonts, colors, and styles to generate a unique text-based favicon for your brand.": "Harflerden, baş harflerden veya herhangi bir metinden bir favicon oluşturun. Markanız için benzersiz, metin tabanlı bir favicon oluşturmak için yazı tiplerini, renkleri ve stilleri seçin.",
    "Try it free ➔": "Ücretsiz deneyin ➔",
    "Emoji to Favicon": "Emoji'den Favicon'a",
    "Choose from hundreds of emojis to instantly create a colorful, expressive favicon. Perfect for personal projects, blogs, and quick prototypes.": "Anında renkli, etkileyici bir favicon oluşturmak için yüzlerce emoji arasından seçim yapın. Kişisel projeler, bloglar ve hızlı prototipler için mükemmeldir.",
    "Favicon Checker": "Favicon Denetleyici",
    "Validate your website's favicon setup. Enter any URL to check for missing sizes, incorrect formats, and cross-platform compatibility issues.": "Web sitenizin favicon kurulumunu doğrulayın. Eksik boyutları, yanlış biçimleri ve çapraz platform uyumluluk sorunlarını kontrol etmek için herhangi bir URL girin.",
    "Check now ➔": "Şimdi kontrol et ➔"
  },
  ur: {
    "Explore More Favicon Tools": "مزید فیویکن ٹولز دریافت کریں۔",
    "PNGtoFavicon offers a complete suite of tools for all your favicon needs": "PNGtoFavicon آپ کی تمام فیویکن کی ضروریات کے لیے ٹولز کا ایک مکمل مجموعہ پیش کرتا ہے۔",
    "Text to Favicon": "ٹیکسٹ سے فیویکن",
    "Create a favicon from letters, initials, or any text. Choose fonts, colors, and styles to generate a unique text-based favicon for your brand.": "حروف، ابتدائیہ، یا کسی بھی متن سے ایک فیویکن بنائیں۔ اپنے برانڈ کے لیے ایک منفرد ٹیکسٹ پر مبنی فیویکن بنانے کے لیے فونٹس، رنگوں اور طرزوں کا انتخاب کریں۔",
    "Try it free ➔": "اسے مفت آزمائیں ➔",
    "Emoji to Favicon": "ایموجی سے فیویکن",
    "Choose from hundreds of emojis to instantly create a colorful, expressive favicon. Perfect for personal projects, blogs, and quick prototypes.": "رنگین، تاثراتی فیویکن بنانے کے لیے سینکڑوں ایموجیز میں سے انتخاب کریں۔ ذاتی پروجیکٹس، بلاگز، اور فوری پروٹو ٹائپس کے لیے بہترین۔",
    "Favicon Checker": "فیویکن چیکر",
    "Validate your website's favicon setup. Enter any URL to check for missing sizes, incorrect formats, and cross-platform compatibility issues.": "اپنی ویب سائٹ کے فیویکن سیٹ اپ کی توثیق کریں۔ غائب سائز، غلط فارمیٹس، اور کراس پلیٹ فارم مطابقت کے مسائل کو چیک کرنے کے لیے کوئی بھی URL درج کریں۔",
    "Check now ➔": "ابھی چیک کریں ➔"
  }
};

Object.keys(translations).forEach(lang => {
  const filePath = path.join(__dirname, lang, 'index.html');
  if (fs.existsSync(filePath)) {
    let html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Check if section already exists
    let exploreSection = document.getElementById('other-tools');
    
    if (!exploreSection) {
      // Create it from HTML template
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = exploreSectionHtml;
      const newSection = tempDiv.querySelector('#other-tools');
      
      // Find where to insert it: after the main container or before the footer
      const mainElement = document.querySelector('main');
      if (mainElement) {
        // Insert right after the main tag
        mainElement.insertAdjacentElement('afterend', newSection);
        exploreSection = document.getElementById('other-tools');
      } else {
        const footer = document.querySelector('footer');
        if (footer) {
          footer.parentNode.insertBefore(newSection, footer);
          exploreSection = document.getElementById('other-tools');
        } else {
          // just append to body if we can't find better place
          document.body.appendChild(newSection);
          exploreSection = document.getElementById('other-tools');
        }
      }
      
      console.log(`Injected Explore Tools section into ${lang}/index.html`);
    } else {
      console.log(`Explore Tools section already exists in ${lang}/index.html`);
    }
    
    // Now translate the section
    if (exploreSection) {
      const dict = translations[lang];
      
      // We will traverse only the exploreSection
      const walk = document.createTreeWalker(exploreSection, 4, null, false);
      let n;
      while ((n = walk.nextNode())) {
        const txt = n.nodeValue.trim();
        // Since there is a unicode arrow '➔' or '&#10140;', sometimes JS might match it awkwardly
        // Let's do a loose replace to catch "Try it free ➔" etc.
        if (dict[txt]) {
          n.nodeValue = n.nodeValue.replace(txt, dict[txt]);
        } else {
          // Check if any key matches a substring
          for (const key in dict) {
             if (txt.includes(key)) {
                n.nodeValue = n.nodeValue.replace(key, dict[key]);
             }
          }
        }
      }
      
      fs.writeFileSync(filePath, dom.serialize(), 'utf8');
      console.log(`Translated Explore Tools section in ${lang}/index.html`);
    }
  }
});
