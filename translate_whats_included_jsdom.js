const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const translations = {
  ar: {
    "title": "ما الذي يتضمنه التنزيل",
    "subtitle": "كل ملف تحتاجه لدعم كامل للأيقونات المفضلة عبر جميع المتصفحات والأجهزة",
    "favicon.ico": "تنسيق ICO الكلاسيكي متعدد الأحجام، يحتوي على أيقونات 16x16 و 32x32 و 48x48. مطلوب لدعم المتصفحات القديمة بما في ذلك الإصدارات القديمة من Internet Explorer.",
    "favicon-16x16.png": "أيقونة علامة تبويب المتصفح القياسية بحجم 16x16 بكسل. تستخدم بواسطة معظم المتصفحات الحديثة كأيقونة أساسية للشاشات ذات الكثافة القياسية.",
    "favicon-32x32.png": "أيقونة عالية الدقة بحجم 32x32 بكسل. تُعرض على شاشات Retina و HiDPI لعرض أيقونة واضحة وحادة في علامات تبويب المتصفح.",
    "apple-touch-icon.png": "أيقونة Apple Touch بحجم 180x180 بكسل لأجهزة iPhone و iPad و iPod Touch. تُعرض عندما يضيف المستخدمون موقعك إلى شاشتهم الرئيسية في iOS.",
    "android-chrome-192x192.png": "أيقونة الشاشة الرئيسية لنظام Android بحجم 192x192 بكسل. تُستخدم عندما يضيف مستخدمو Android موقعك إلى شاشتهم الرئيسية عبر Chrome أو المتصفحات الأخرى.",
    "android-chrome-512x512.png": "أيقونة PWA عالية الدقة بحجم 512x512 بكسل. مطلوبة لمطالبات تثبيت تطبيقات الويب التقدمية وشاشات البداية على أجهزة Android."
  },
  de: {
    "title": "Was in Ihrem Download enthalten ist",
    "subtitle": "Jede Datei, die Sie für vollständige Cross-Browser- und Cross-Device-Favicon-Unterstützung benötigen",
    "favicon.ico": "Das klassische Multi-Size-ICO-Format mit 16x16-, 32x32- und 48x48-Symbolen. Erforderlich für die Unterstützung älterer Browser einschließlich älterer Versionen von Internet Explorer.",
    "favicon-16x16.png": "Standard-Browser-Tab-Symbol mit 16x16 Pixeln. Wird von den meisten modernen Browsern als primäres Tab-Favicon für Displays mit Standarddichte verwendet.",
    "favicon-32x32.png": "High-DPI-Browser-Tab-Symbol mit 32x32 Pixeln. Wird auf Retina- und HiDPI-Bildschirmen für gestochen scharfe Favicon-Darstellung in Browser-Tabs angezeigt.",
    "apple-touch-icon.png": "Apple Touch Icon mit 180x180 Pixeln für iPhone, iPad und iPod Touch. Wird angezeigt, wenn Benutzer Ihre Website zu ihrem iOS-Startbildschirm hinzufügen.",
    "android-chrome-192x192.png": "Android-Startbildschirmsymbol mit 192x192 Pixeln. Wird verwendet, wenn Android-Benutzer Ihre Website über Chrome oder andere Browser zu ihrem Startbildschirm hinzufügen.",
    "android-chrome-512x512.png": "Hochauflösendes PWA-Symbol mit 512x512 Pixeln. Erforderlich für Installationsaufforderungen für Progressive Web Apps und Startbildschirme auf Android-Geräten."
  },
  es: {
    "title": "Qué incluye tu descarga",
    "subtitle": "Todos los archivos que necesitas para el soporte completo de favicons en navegadores y dispositivos",
    "favicon.ico": "El clásico formato ICO multiresolución, que contiene iconos de 16x16, 32x32 y 48x48. Necesario para la compatibilidad con navegadores heredados, incluidas las versiones antiguas de Internet Explorer.",
    "favicon-16x16.png": "Icono de pestaña de navegador estándar de 16x16 píxeles. Utilizado por la mayoría de los navegadores modernos como el favicon de la pestaña principal para pantallas de densidad estándar.",
    "favicon-32x32.png": "Icono de pestaña del navegador de alto DPI de 32x32 píxeles. Se muestra en pantallas Retina y HiDPI para una representación nítida y clara del favicon en las pestañas del navegador.",
    "apple-touch-icon.png": "Icono Apple Touch de 180x180 píxeles para iPhone, iPad y iPod Touch. Se muestra cuando los usuarios agregan su sitio web a su pantalla de inicio de iOS.",
    "android-chrome-192x192.png": "Icono de la pantalla de inicio de Android a 192x192 píxeles. Se utiliza cuando los usuarios de Android agregan su sitio a su pantalla de inicio a través de Chrome u otros navegadores.",
    "android-chrome-512x512.png": "Icono PWA de alta resolución de 512x512 píxeles. Necesario para avisos de instalación de aplicaciones web progresivas y pantallas de inicio en dispositivos Android."
  },
  fr: {
    "title": "Ce qui est inclus dans votre téléchargement",
    "subtitle": "Chaque fichier dont vous avez besoin pour un support complet des favicons sur tous les navigateurs et appareils",
    "favicon.ico": "Le format ICO multi-tailles classique, contenant des icônes 16x16, 32x32 et 48x48. Requis pour la prise en charge des anciens navigateurs, y compris les anciennes versions d'Internet Explorer.",
    "favicon-16x16.png": "Icône d'onglet de navigateur standard de 16x16 pixels. Utilisé par la plupart des navigateurs modernes comme favicon d'onglet principal pour les écrans à densité standard.",
    "favicon-32x32.png": "Icône d'onglet de navigateur High-DPI à 32x32 pixels. Affiché sur les écrans Retina et HiDPI pour un rendu net et précis des favicons dans les onglets du navigateur.",
    "apple-touch-icon.png": "Apple Touch Icon à 180x180 pixels pour iPhone, iPad et iPod Touch. Affiché lorsque les utilisateurs ajoutent votre site Web à leur écran d'accueil iOS.",
    "android-chrome-192x192.png": "Icône d'écran d'accueil Android à 192x192 pixels. Utilisé lorsque les utilisateurs d'Android ajoutent votre site à leur écran d'accueil via Chrome ou d'autres navigateurs.",
    "android-chrome-512x512.png": "Icône PWA haute résolution de 512x512 pixels. Requis pour les invites d'installation d'applications Web progressives et les écrans de démarrage sur les appareils Android."
  },
  hi: {
    "title": "आपके डाउनलोड में क्या शामिल है",
    "subtitle": "पूर्ण क्रॉस-ब्राउज़र और क्रॉस-डिवाइस फ़ेविकॉन समर्थन के लिए आवश्यक हर फ़ाइल",
    "favicon.ico": "क्लासिक बहु-आकार ICO प्रारूप, जिसमें 16x16, 32x32 और 48x48 आइकन शामिल हैं। पुराने इंटरनेट एक्सप्लोरर संस्करणों सहित पुराने ब्राउज़र समर्थन के लिए आवश्यक।",
    "favicon-16x16.png": "16x16 पिक्सेल पर मानक ब्राउज़र टैब आइकन। मानक-घनत्व वाले डिस्प्ले के लिए अधिकांश आधुनिक ब्राउज़रों द्वारा प्राथमिक टैब फ़ेविकॉन के रूप में उपयोग किया जाता है।",
    "favicon-32x32.png": "32x32 पिक्सेल पर उच्च-DPI ब्राउज़र टैब आइकन। ब्राउज़र टैब में स्पष्ट, तीखे फ़ेविकॉन रेंडरिंग के लिए रेटिना और HiDPI स्क्रीन पर प्रदर्शित किया जाता है।",
    "apple-touch-icon.png": "iPhone, iPad और iPod Touch के लिए 180x180 पिक्सेल पर Apple Touch आइकन। जब उपयोगकर्ता आपकी वेबसाइट को अपने iOS होम स्क्रीन पर जोड़ते हैं तो प्रदर्शित होता है।",
    "android-chrome-192x192.png": "192x192 पिक्सेल पर Android होम स्क्रीन आइकन। इसका उपयोग तब किया जाता है जब Android उपयोगकर्ता Chrome या अन्य ब्राउज़रों के माध्यम से आपकी साइट को अपनी होम स्क्रीन में जोड़ते हैं।",
    "android-chrome-512x512.png": "512x512 पिक्सेल पर उच्च-रिज़ॉल्यूशन PWA आइकन। Android उपकरणों पर प्रोग्रेसिव वेब ऐप इंस्टाल संकेत और स्प्लैश स्क्रीन के लिए आवश्यक है।"
  },
  id: {
    "title": "Apa Saja yang Disertakan dalam Unduhan Anda",
    "subtitle": "Setiap file yang Anda perlukan untuk dukungan favicon lintas browser dan lintas perangkat yang lengkap",
    "favicon.ico": "Format ICO multi-ukuran klasik, berisi ikon 16x16, 32x32, dan 48x48. Diperlukan untuk dukungan peramban lawas termasuk Internet Explorer versi lama.",
    "favicon-16x16.png": "Ikon tab peramban standar pada 16x16 piksel. Digunakan oleh sebagian besar peramban modern sebagai favicon tab utama untuk layar dengan kepadatan standar.",
    "favicon-32x32.png": "Ikon tab browser High-DPI pada 32x32 piksel. Ditampilkan di layar Retina dan HiDPI untuk rendering favicon yang tajam dan jernih di tab browser.",
    "apple-touch-icon.png": "Ikon Apple Touch pada 180x180 piksel untuk iPhone, iPad, dan iPod Touch. Ditampilkan ketika pengguna menambahkan situs web Anda ke layar beranda iOS mereka.",
    "android-chrome-192x192.png": "Ikon layar beranda Android pada 192x192 piksel. Digunakan ketika pengguna Android menambahkan situs Anda ke layar beranda mereka melalui Chrome atau browser lain.",
    "android-chrome-512x512.png": "Ikon PWA resolusi tinggi pada 512x512 piksel. Diperlukan untuk permintaan penginstalan Aplikasi Web Progresif dan layar splash pada perangkat Android."
  },
  pt: {
    "title": "O que está incluído no seu download",
    "subtitle": "Todos os arquivos que você precisa para suporte completo de favicon em vários navegadores e dispositivos",
    "favicon.ico": "O clássico formato ICO de vários tamanhos, contendo ícones 16x16, 32x32 e 48x48. Necessário para suporte de navegador legado, incluindo versões mais antigas do Internet Explorer.",
    "favicon-16x16.png": "Ícone da guia do navegador padrão em 16x16 pixels. Usado pela maioria dos navegadores modernos como o favicon da guia principal para exibições de densidade padrão.",
    "favicon-32x32.png": "Ícone da guia do navegador de alto DPI em 32x32 pixels. Exibido em telas Retina e HiDPI para uma renderização de favicon nítida e definida nas guias do navegador.",
    "apple-touch-icon.png": "Apple Touch Icon em 180x180 pixels para iPhone, iPad e iPod Touch. Exibido quando os usuários adicionam seu site à tela inicial do iOS.",
    "android-chrome-192x192.png": "Ícone da tela inicial do Android em 192x192 pixels. Usado quando usuários do Android adicionam seu site à tela inicial através do Chrome ou de outros navegadores.",
    "android-chrome-512x512.png": "Ícone PWA de alta resolução em 512x512 pixels. Necessário para prompts de instalação de Progressive Web App e telas de inicialização em dispositivos Android."
  },
  tr: {
    "title": "İndirmenize Neler Dahil",
    "subtitle": "Tam tarayıcı ve cihazlar arası favicon desteği için ihtiyacınız olan her dosya",
    "favicon.ico": "16x16, 32x32 ve 48x48 simgelerini içeren klasik çok boyutlu ICO formatı. Internet Explorer'ın eski sürümleri de dahil olmak üzere eski tarayıcı desteği için gereklidir.",
    "favicon-16x16.png": "16x16 pikselde standart tarayıcı sekmesi simgesi. Çoğu modern tarayıcı tarafından standart yoğunluklu ekranlar için birincil sekme favicon'u olarak kullanılır.",
    "favicon-32x32.png": "32x32 pikselde Yüksek DPI tarayıcı sekmesi simgesi. Tarayıcı sekmelerinde canlı, keskin favicon oluşturma için Retina ve HiDPI ekranlarda görüntülenir.",
    "apple-touch-icon.png": "iPhone, iPad ve iPod Touch için 180x180 piksel boyutunda Apple Touch Simgesi. Kullanıcılar web sitenizi iOS ana ekranlarına eklediklerinde görüntülenir.",
    "android-chrome-192x192.png": "192x192 piksel boyutunda Android ana ekran simgesi. Android kullanıcıları Chrome veya diğer tarayıcılar aracılığıyla sitenizi ana ekranlarına eklediğinde kullanılır.",
    "android-chrome-512x512.png": "512x512 pikselde yüksek çözünürlüklü PWA simgesi. Android cihazlarda Aşamalı Web Uygulaması yükleme istemleri ve başlangıç ekranları için gereklidir."
  },
  ur: {
    "title": "آپ کے ڈاؤن لوڈ میں کیا شامل ہے",
    "subtitle": "کراس براؤزر اور کراس ڈیوائس فیویکن سپورٹ کے لیے آپ کو درکار ہر فائل",
    "favicon.ico": "کلاسک کثیر سائز کا ICO فارمیٹ، جس میں 16x16، 32x32، اور 48x48 آئیکنز شامل ہیں۔ پرانے براؤزر سپورٹ کے لیے درکار ہے جس میں انٹرنیٹ ایکسپلورر کے پرانے ورژن بھی شامل ہیں۔",
    "favicon-16x16.png": "16x16 پکسلز پر معیاری براؤزر ٹیب آئیکن۔ زیادہ تر جدید براؤزرز کی طرف سے معیاری کثافت والے ڈسپلے کے لیے بنیادی ٹیب فیویکن کے طور پر استعمال کیا جاتا ہے۔",
    "favicon-32x32.png": "32x32 پکسلز پر ہائی ڈی پی آئی براؤزر ٹیب آئیکن۔ براؤزر کے ٹیبز میں کرکرا، تیز فیویکن پیش کرنے کے لیے ریٹینا اور ہائی ڈی پی آئی اسکرینوں پر دکھایا گیا ہے۔",
    "apple-touch-icon.png": "آئی فون، آئی پیڈ اور آئی پاڈ ٹچ کے لیے 180x180 پکسلز پر ایپل ٹچ آئیکن۔ اس وقت ظاہر ہوتا ہے جب صارفین آپ کی ویب سائٹ کو اپنی iOS ہوم اسکرین میں شامل کرتے ہیں۔",
    "android-chrome-192x192.png": "192x192 پکسلز پر اینڈرائیڈ ہوم اسکرین آئیکن۔ اس وقت استعمال کیا جاتا ہے جب Android صارفین Chrome یا دیگر براؤزرز کے ذریعے آپ کی سائٹ کو اپنی ہوم اسکرین میں شامل کرتے ہیں۔",
    "android-chrome-512x512.png": "512x512 پکسلز پر ہائی ریزولوشن PWA آئیکن۔ اینڈرائیڈ ڈیوائسز پر پروگریسو ویب ایپ انسٹال کے اشارے اور سپلیش اسکرینز کے لیے درکار ہے۔"
  }
};

Object.keys(translations).forEach(lang => {
  const filePath = path.join(__dirname, lang, 'index.html');
  if (fs.existsSync(filePath)) {
    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const section = document.getElementById('whats-included');
    if (section) {
      const dict = translations[lang];
      
      const title = section.querySelector('.section-title');
      if (title) title.textContent = dict["title"];
      
      const subtitle = section.querySelector('.section-subtitle');
      if (subtitle) subtitle.textContent = dict["subtitle"];
      
      const cards = section.querySelectorAll('.file-card');
      cards.forEach(card => {
        const h3 = card.querySelector('h3');
        const p = card.querySelector('p');
        if (h3 && p) {
          const key = h3.textContent.trim();
          if (dict[key]) {
            p.textContent = dict[key];
          }
        }
      });
      
      fs.writeFileSync(filePath, dom.serialize(), 'utf8');
      console.log(`Translated What's Included in ${lang}/index.html using jsdom`);
    } else {
      console.log(`Section not found in ${lang}/index.html`);
    }
  }
});
