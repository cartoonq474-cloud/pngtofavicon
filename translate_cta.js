const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const translations = {
  ar: {
    "Start Converting PNG to Favicon for Free Today": "ابدأ في تحويل PNG إلى أيقونة مجانًا اليوم",
    "Join 50,000+ users who trust PNGtoFavicon.com for accurate, fast, and completely free favicon generation.": "انضم إلى أكثر من 50,000 مستخدم يثقون في PNGtoFavicon.com لإنشاء أيقونات دقيقة وسريعة ومجانية تمامًا.",
    "Start Converting Now - It's Free!": "ابدأ التحويل الآن - إنه مجاني!"
  },
  de: {
    "Start Converting PNG to Favicon for Free Today": "Starten Sie noch heute mit der kostenlosen Konvertierung von PNG zu Favicon",
    "Join 50,000+ users who trust PNGtoFavicon.com for accurate, fast, and completely free favicon generation.": "Schließen Sie sich über 50.000 Benutzern an, die PNGtoFavicon.com für die genaue, schnelle und völlig kostenlose Erstellung von Favicons vertrauen.",
    "Start Converting Now - It's Free!": "Starten Sie jetzt die Konvertierung - es ist kostenlos!"
  },
  es: {
    "Start Converting PNG to Favicon for Free Today": "Empieza a convertir PNG a Favicon gratis hoy mismo",
    "Join 50,000+ users who trust PNGtoFavicon.com for accurate, fast, and completely free favicon generation.": "Únete a más de 50.000 usuarios que confían en PNGtoFavicon.com para una generación de favicons precisa, rápida y completamente gratuita.",
    "Start Converting Now - It's Free!": "Empieza a convertir ahora - ¡Es gratis!"
  },
  fr: {
    "Start Converting PNG to Favicon for Free Today": "Commencez à convertir des PNG en Favicon gratuitement dès aujourd'hui",
    "Join 50,000+ users who trust PNGtoFavicon.com for accurate, fast, and completely free favicon generation.": "Rejoignez plus de 50 000 utilisateurs qui font confiance à PNGtoFavicon.com pour une génération de favicons précise, rapide et entièrement gratuite.",
    "Start Converting Now - It's Free!": "Commencez à convertir maintenant - C'est gratuit !"
  },
  hi: {
    "Start Converting PNG to Favicon for Free Today": "आज ही PNG को Favicon में मुफ्त में बदलना शुरू करें",
    "Join 50,000+ users who trust PNGtoFavicon.com for accurate, fast, and completely free favicon generation.": "50,000+ उपयोगकर्ताओं से जुड़ें जो सटीक, तेज़ और पूरी तरह से मुफ्त फ़ेविकॉन निर्माण के लिए PNGtoFavicon.com पर भरोसा करते हैं।",
    "Start Converting Now - It's Free!": "अभी कनवर्ट करना शुरू करें - यह मुफ़्त है!"
  },
  id: {
    "Start Converting PNG to Favicon for Free Today": "Mulai Konversi PNG ke Favicon secara Gratis Hari Ini",
    "Join 50,000+ users who trust PNGtoFavicon.com for accurate, fast, and completely free favicon generation.": "Bergabunglah dengan 50.000+ pengguna yang mempercayai PNGtoFavicon.com untuk pembuatan favicon yang akurat, cepat, dan sepenuhnya gratis.",
    "Start Converting Now - It's Free!": "Mulai Konversi Sekarang - Gratis!"
  },
  pt: {
    "Start Converting PNG to Favicon for Free Today": "Comece a converter PNG em Favicon gratuitamente hoje",
    "Join 50,000+ users who trust PNGtoFavicon.com for accurate, fast, and completely free favicon generation.": "Junte-se a mais de 50.000 usuários que confiam no PNGtoFavicon.com para uma geração de favicon precisa, rápida e totalmente gratuita.",
    "Start Converting Now - It's Free!": "Comece a converter agora - É grátis!"
  },
  tr: {
    "Start Converting PNG to Favicon for Free Today": "PNG'yi Favicon'a Ücretsiz Olarak Dönüştürmeye Bugün Başlayın",
    "Join 50,000+ users who trust PNGtoFavicon.com for accurate, fast, and completely free favicon generation.": "Doğru, hızlı ve tamamen ücretsiz favicon oluşturma için PNGtoFavicon.com'a güvenen 50.000'den fazla kullanıcıya katılın.",
    "Start Converting Now - It's Free!": "Şimdi Dönüştürmeye Başlayın - Ücretsiz!"
  },
  ur: {
    "Start Converting PNG to Favicon for Free Today": "آج ہی مفت میں PNG کو Favicon میں تبدیل کرنا شروع کریں",
    "Join 50,000+ users who trust PNGtoFavicon.com for accurate, fast, and completely free favicon generation.": "50,000+ صارفین میں شامل ہوں جو درست، تیز اور مکمل طور پر مفت فیویکن جنریشن کے لیے PNGtoFavicon.com پر بھروسہ کرتے ہیں۔",
    "Start Converting Now - It's Free!": "ابھی تبدیل کرنا شروع کریں - یہ مفت ہے!"
  }
};

Object.keys(translations).forEach(lang => {
  const filePath = path.join(__dirname, lang, 'index.html');
  if (fs.existsSync(filePath)) {
    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const dict = translations[lang];

    const ctaSection = document.querySelector('.bottom-cta');
    if (ctaSection) {
      const h2 = ctaSection.querySelector('h2');
      if (h2 && dict[h2.textContent.trim()]) {
        h2.textContent = dict[h2.textContent.trim()];
      }
      
      const p = ctaSection.querySelector('p');
      if (p && dict[p.textContent.trim()]) {
        p.textContent = dict[p.textContent.trim()];
      }
      
      const a = ctaSection.querySelector('a.btn-cta-white');
      if (a && dict[a.textContent.trim()]) {
        a.textContent = dict[a.textContent.trim()];
      }
      
      fs.writeFileSync(filePath, dom.serialize(), 'utf8');
      console.log(`Translated Bottom CTA in ${lang}/index.html`);
    }
  }
});
