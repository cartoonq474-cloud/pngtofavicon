const fs = require('fs');
const path = require('path');

const translations = {
  ar: {
    "Perfect for Every Use Case": "مثالي لكل حالة استخدام",
    "Discover how our PNG to Favicon tool works across different scenarios": "اكتشف كيف تعمل أداة تحويل PNG إلى Favicon عبر سيناريوهات مختلفة",
    "Web Developers": "مطورو الويب",
    "Instantly generate all required favicon sizes for your web projects from a single PNG file.": "قم بإنشاء جميع أحجام الرموز المفضلة المطلوبة لمشاريع الويب الخاصة بك فورًا من ملف PNG واحد.",
    "UI/UX Designers": "مصممو واجهة وتجربة المستخدم",
    "Ensure your brand identity looks crisp and perfect across all browser tabs and device home screens.": "تأكد من أن هوية علامتك التجارية تبدو واضحة ومثالية عبر جميع علامات تبويب المتصفح وشاشات الأجهزة.",
    "Bloggers & Creators": "المدونون والمبدعون",
    "Easily customize your personal blog or portfolio with a professional icon in seconds.": "قم بتخصيص مدونتك الشخصية أو محفظتك بأيقونة احترافية في ثوانٍ بسهولة.",
    "Business Owners": "أصحاب الأعمال",
    "Elevate your professional appearance with a high-quality favicon that builds trust.": "ارتقِ بمظهرك الاحترافي باستخدام أيقونة مفضلة عالية الجودة تبني الثقة.",
    "Trusted by professionals worldwide": "موثوق به من قبل المحترفين في جميع أنحاء العالم",
    "Ready to Generate Your Favicon?": "هل أنت مستعد لإنشاء أيقونتك المفضلة؟",
    "Join over 50,000 users who trust our tool to create perfect favicons instantly.": "انضم إلى أكثر من 50,000 مستخدم يثقون في أداتنا لإنشاء أيقونات مفضلة مثالية على الفور.",
    "Convert PNG to Favicon Now": "قم بتحويل PNG إلى Favicon الآن",
    "Free forever • No signup required": "مجاني للأبد • لا يتطلب التسجيل"
  },
  de: {
    "Perfect for Every Use Case": "Perfekt für jeden Anwendungsfall",
    "Discover how our PNG to Favicon tool works across different scenarios": "Entdecken Sie, wie unser PNG zu Favicon Tool in verschiedenen Szenarien funktioniert",
    "Web Developers": "Webentwickler",
    "Instantly generate all required favicon sizes for your web projects from a single PNG file.": "Erstellen Sie sofort alle erforderlichen Favicon-Größen für Ihre Webprojekte aus einer einzigen PNG-Datei.",
    "UI/UX Designers": "UI/UX-Designer",
    "Ensure your brand identity looks crisp and perfect across all browser tabs and device home screens.": "Stellen Sie sicher, dass Ihre Markenidentität in allen Browser-Tabs und auf den Startbildschirmen der Geräte gestochen scharf und perfekt aussieht.",
    "Bloggers & Creators": "Blogger & Kreative",
    "Easily customize your personal blog or portfolio with a professional icon in seconds.": "Passen Sie Ihren persönlichen Blog oder Ihr Portfolio in Sekundenschnelle ganz einfach mit einem professionellen Symbol an.",
    "Business Owners": "Unternehmer",
    "Elevate your professional appearance with a high-quality favicon that builds trust.": "Werten Sie Ihr professionelles Erscheinungsbild mit einem hochwertigen Favicon auf, das Vertrauen schafft.",
    "Trusted by professionals worldwide": "Weltweit von Profis vertraut",
    "Ready to Generate Your Favicon?": "Bereit, Ihr Favicon zu erstellen?",
    "Join over 50,000 users who trust our tool to create perfect favicons instantly.": "Schließen Sie sich über 50.000 Benutzern an, die unserem Tool vertrauen, um sofort perfekte Favicons zu erstellen.",
    "Convert PNG to Favicon Now": "PNG jetzt in Favicon konvertieren",
    "Free forever • No signup required": "Für immer kostenlos • Keine Anmeldung erforderlich"
  },
  es: {
    "Perfect for Every Use Case": "Perfecto para cada caso de uso",
    "Discover how our PNG to Favicon tool works across different scenarios": "Descubre cómo funciona nuestra herramienta de PNG a Favicon en diferentes escenarios",
    "Web Developers": "Desarrolladores Web",
    "Instantly generate all required favicon sizes for your web projects from a single PNG file.": "Genera instantáneamente todos los tamaños de favicon necesarios para tus proyectos web desde un solo archivo PNG.",
    "UI/UX Designers": "Diseñadores UI/UX",
    "Ensure your brand identity looks crisp and perfect across all browser tabs and device home screens.": "Asegúrate de que la identidad de tu marca se vea nítida y perfecta en todas las pestañas del navegador y pantallas de inicio de los dispositivos.",
    "Bloggers & Creators": "Bloggers y Creadores",
    "Easily customize your personal blog or portfolio with a professional icon in seconds.": "Personaliza fácilmente tu blog personal o portafolio con un ícono profesional en segundos.",
    "Business Owners": "Dueños de Negocios",
    "Elevate your professional appearance with a high-quality favicon that builds trust.": "Eleva tu apariencia profesional con un favicon de alta calidad que genera confianza.",
    "Trusted by professionals worldwide": "Con la confianza de profesionales de todo el mundo",
    "Ready to Generate Your Favicon?": "¿Listo para generar tu Favicon?",
    "Join over 50,000 users who trust our tool to create perfect favicons instantly.": "Únete a más de 50,000 usuarios que confían en nuestra herramienta para crear favicons perfectos al instante.",
    "Convert PNG to Favicon Now": "Convertir PNG a Favicon Ahora",
    "Free forever • No signup required": "Gratis para siempre • No requiere registro"
  },
  fr: {
    "Perfect for Every Use Case": "Parfait pour chaque cas d'utilisation",
    "Discover how our PNG to Favicon tool works across different scenarios": "Découvrez comment notre outil de PNG à Favicon fonctionne dans différents scénarios",
    "Web Developers": "Développeurs Web",
    "Instantly generate all required favicon sizes for your web projects from a single PNG file.": "Générez instantanément toutes les tailles de favicon requises pour vos projets web à partir d'un seul fichier PNG.",
    "UI/UX Designers": "Designers UI/UX",
    "Ensure your brand identity looks crisp and perfect across all browser tabs and device home screens.": "Assurez-vous que l'identité de votre marque soit nette et parfaite sur tous les onglets du navigateur et écrans d'accueil des appareils.",
    "Bloggers & Creators": "Blogueurs et Créateurs",
    "Easily customize your personal blog or portfolio with a professional icon in seconds.": "Personnalisez facilement votre blog personnel ou votre portfolio avec une icône professionnelle en quelques secondes.",
    "Business Owners": "Propriétaires d'Entreprise",
    "Elevate your professional appearance with a high-quality favicon that builds trust.": "Améliorez votre apparence professionnelle avec un favicon de haute qualité qui inspire confiance.",
    "Trusted by professionals worldwide": "Approuvé par des professionnels du monde entier",
    "Ready to Generate Your Favicon?": "Prêt à générer votre Favicon ?",
    "Join over 50,000 users who trust our tool to create perfect favicons instantly.": "Rejoignez plus de 50 000 utilisateurs qui font confiance à notre outil pour créer des favicons parfaits instantanément.",
    "Convert PNG to Favicon Now": "Convertir un PNG en Favicon maintenant",
    "Free forever • No signup required": "Gratuit pour toujours • Aucune inscription requise"
  },
  hi: {
    "Perfect for Every Use Case": "हर उपयोग के लिए बिल्कुल सही",
    "Discover how our PNG to Favicon tool works across different scenarios": "डिस्कवर करें कि हमारा PNG से Favicon टूल विभिन्न परिदृश्यों में कैसे काम करता है",
    "Web Developers": "वेब डेवलपर्स",
    "Instantly generate all required favicon sizes for your web projects from a single PNG file.": "एक ही PNG फ़ाइल से अपने वेब प्रोजेक्ट के लिए आवश्यक सभी फ़ेविकॉन आकार तुरंत उत्पन्न करें।",
    "UI/UX Designers": "UI/UX डिज़ाइनर्स",
    "Ensure your brand identity looks crisp and perfect across all browser tabs and device home screens.": "सुनिश्चित करें कि आपकी ब्रांड पहचान सभी ब्राउज़र टैब और डिवाइस होम स्क्रीन पर स्पष्ट और सही दिखे।",
    "Bloggers & Creators": "ब्लॉगर्स और क्रिएटर्स",
    "Easily customize your personal blog or portfolio with a professional icon in seconds.": "कुछ ही सेकंड में पेशेवर आइकन के साथ अपने व्यक्तिगत ब्लॉग या पोर्टफोलियो को आसानी से कस्टमाइज़ करें।",
    "Business Owners": "व्यापार मालिक",
    "Elevate your professional appearance with a high-quality favicon that builds trust.": "विश्वास पैदा करने वाले उच्च-गुणवत्ता वाले फ़ेविकॉन के साथ अपनी व्यावसायिक उपस्थिति को बढ़ाएं।",
    "Trusted by professionals worldwide": "दुनिया भर के पेशेवरों द्वारा विश्वसनीय",
    "Ready to Generate Your Favicon?": "अपना फ़ेविकॉन बनाने के लिए तैयार हैं?",
    "Join over 50,000 users who trust our tool to create perfect favicons instantly.": "उन 50,000 से अधिक उपयोगकर्ताओं से जुड़ें जो तुरंत पूर्ण फ़ेविकॉन बनाने के लिए हमारे टूल पर भरोसा करते हैं।",
    "Convert PNG to Favicon Now": "अभी PNG को Favicon में बदलें",
    "Free forever • No signup required": "हमेशा के लिए निःशुल्क • कोई साइनअप आवश्यक नहीं"
  },
  id: {
    "Perfect for Every Use Case": "Sempurna untuk Setiap Kasus Penggunaan",
    "Discover how our PNG to Favicon tool works across different scenarios": "Temukan bagaimana alat PNG ke Favicon kami bekerja di berbagai skenario",
    "Web Developers": "Pengembang Web",
    "Instantly generate all required favicon sizes for your web projects from a single PNG file.": "Hasilkan semua ukuran favicon yang diperlukan secara instan untuk proyek web Anda dari satu file PNG.",
    "UI/UX Designers": "Desainer UI/UX",
    "Ensure your brand identity looks crisp and perfect across all browser tabs and device home screens.": "Pastikan identitas merek Anda terlihat tajam dan sempurna di semua tab browser dan layar beranda perangkat.",
    "Bloggers & Creators": "Blogger & Kreator",
    "Easily customize your personal blog or portfolio with a professional icon in seconds.": "Sesuaikan blog pribadi atau portofolio Anda dengan mudah dengan ikon profesional dalam hitungan detik.",
    "Business Owners": "Pemilik Bisnis",
    "Elevate your professional appearance with a high-quality favicon that builds trust.": "Tingkatkan penampilan profesional Anda dengan favicon berkualitas tinggi yang membangun kepercayaan.",
    "Trusted by professionals worldwide": "Dipercaya oleh para profesional di seluruh dunia",
    "Ready to Generate Your Favicon?": "Siap Membuat Favicon Anda?",
    "Join over 50,000 users who trust our tool to create perfect favicons instantly.": "Bergabunglah dengan lebih dari 50.000 pengguna yang mempercayai alat kami untuk membuat favicon sempurna secara instan.",
    "Convert PNG to Favicon Now": "Konversi PNG ke Favicon Sekarang",
    "Free forever • No signup required": "Gratis selamanya • Tidak perlu mendaftar"
  },
  pt: {
    "Perfect for Every Use Case": "Perfeito para Cada Caso de Uso",
    "Discover how our PNG to Favicon tool works across different scenarios": "Descubra como nossa ferramenta de PNG para Favicon funciona em diferentes cenários",
    "Web Developers": "Desenvolvedores Web",
    "Instantly generate all required favicon sizes for your web projects from a single PNG file.": "Gere instantaneamente todos os tamanhos de favicon necessários para seus projetos web a partir de um único arquivo PNG.",
    "UI/UX Designers": "Designers UI/UX",
    "Ensure your brand identity looks crisp and perfect across all browser tabs and device home screens.": "Garanta que a identidade da sua marca fique nítida e perfeita em todas as guias do navegador e telas iniciais dos dispositivos.",
    "Bloggers & Creators": "Blogueiros e Criadores",
    "Easily customize your personal blog or portfolio with a professional icon in seconds.": "Personalize facilmente seu blog pessoal ou portfólio com um ícone profissional em segundos.",
    "Business Owners": "Proprietários de Empresas",
    "Elevate your professional appearance with a high-quality favicon that builds trust.": "Eleve sua aparência profissional com um favicon de alta qualidade que gera confiança.",
    "Trusted by professionals worldwide": "Com a confiança de profissionais em todo o mundo",
    "Ready to Generate Your Favicon?": "Pronto para Gerar seu Favicon?",
    "Join over 50,000 users who trust our tool to create perfect favicons instantly.": "Junte-se a mais de 50.000 usuários que confiam em nossa ferramenta para criar favicons perfeitos instantaneamente.",
    "Convert PNG to Favicon Now": "Converter PNG para Favicon Agora",
    "Free forever • No signup required": "Grátis para sempre • Não requer registro"
  },
  tr: {
    "Perfect for Every Use Case": "Her Kullanım Senaryosu İçin Mükemmel",
    "Discover how our PNG to Favicon tool works across different scenarios": "PNG'den Favicon'a aracımızın farklı senaryolarda nasıl çalıştığını keşfedin",
    "Web Developers": "Web Geliştiricileri",
    "Instantly generate all required favicon sizes for your web projects from a single PNG file.": "Tek bir PNG dosyasından web projeleriniz için gerekli tüm favicon boyutlarını anında oluşturun.",
    "UI/UX Designers": "UI/UX Tasarımcıları",
    "Ensure your brand identity looks crisp and perfect across all browser tabs and device home screens.": "Marka kimliğinizin tüm tarayıcı sekmelerinde ve cihaz ana ekranlarında net ve mükemmel görünmesini sağlayın.",
    "Bloggers & Creators": "Bloggerlar ve İçerik Üreticileri",
    "Easily customize your personal blog or portfolio with a professional icon in seconds.": "Kişisel blogunuzu veya portföyünüzü saniyeler içinde profesyonel bir simge ile kolayca özelleştirin.",
    "Business Owners": "İşletme Sahipleri",
    "Elevate your professional appearance with a high-quality favicon that builds trust.": "Güven oluşturan yüksek kaliteli bir favicon ile profesyonel görünümünüzü yükseltin.",
    "Trusted by professionals worldwide": "Dünya çapında profesyoneller tarafından güvenilir",
    "Ready to Generate Your Favicon?": "Favicon'unuzu Oluşturmaya Hazır mısınız?",
    "Join over 50,000 users who trust our tool to create perfect favicons instantly.": "Anında mükemmel faviconlar oluşturmak için aracımıza güvenen 50.000'den fazla kullanıcıya katılın.",
    "Convert PNG to Favicon Now": "Şimdi PNG'yi Favicon'a Dönüştür",
    "Free forever • No signup required": "Sonsuza kadar ücretsiz • Kayıt gerekmez"
  },
  ur: {
    "Perfect for Every Use Case": "ہر استعمال کے لیے بہترین",
    "Discover how our PNG to Favicon tool works across different scenarios": "دریافت کریں کہ ہمارا PNG سے Favicon ٹول مختلف منظرناموں میں کیسے کام کرتا ہے",
    "Web Developers": "ویب ڈیویلپرز",
    "Instantly generate all required favicon sizes for your web projects from a single PNG file.": "ایک ہی PNG فائل سے اپنے ویب پروجیکٹس کے لیے درکار تمام Favicon سائز فوری طور پر تیار کریں۔",
    "UI/UX Designers": "UI/UX ڈیزائنرز",
    "Ensure your brand identity looks crisp and perfect across all browser tabs and device home screens.": "یقینی بنائیں کہ آپ کی برانڈ کی شناخت تمام براؤزر ٹیبز اور ڈیوائس ہوم اسکرینز پر واضح اور بہترین نظر آتی ہے۔",
    "Bloggers & Creators": "بلاگرز اور تخلیق کار",
    "Easily customize your personal blog or portfolio with a professional icon in seconds.": "چند سیکنڈ میں پیشہ ورانہ آئیکن کے ساتھ آسانی سے اپنے ذاتی بلاگ یا پورٹ فولیو کو حسب ضرورت بنائیں۔",
    "Business Owners": "کاروبار کے مالکان",
    "Elevate your professional appearance with a high-quality favicon that builds trust.": "ایک اعلیٰ معیار کے Favicon کے ساتھ اپنی پیشہ ورانہ ظاہری شکل کو بہتر بنائیں جو اعتماد پیدا کرتا ہے۔",
    "Trusted by professionals worldwide": "دنیا بھر کے پیشہ ور افراد کا قابل اعتماد",
    "Ready to Generate Your Favicon?": "کیا آپ اپنا Favicon تیار کرنے کے لیے تیار ہیں؟",
    "Join over 50,000 users who trust our tool to create perfect favicons instantly.": "ان 50,000 سے زیادہ صارفین میں شامل ہوں جو فوری طور پر بہترین فیویکن بنانے کے لیے ہمارے ٹول پر بھروسہ کرتے ہیں۔",
    "Convert PNG to Favicon Now": "ابھی PNG کو Favicon میں تبدیل کریں",
    "Free forever • No signup required": "ہمیشہ کے لیے مفت • کسی سائن اپ کی ضرورت نہیں"
  }
};

Object.keys(translations).forEach(lang => {
  const filePath = path.join(__dirname, lang, 'index.html');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const dict = translations[lang];
    
    // Create a precise replace function that only replaces text outside of HTML tags if possible, 
    // or just simple string replacements since our target texts are very unique.
    Object.keys(dict).forEach(englishText => {
      // Need to escape regex characters just in case, but simple split/join is safer.
      content = content.split(englishText).join(dict[englishText]);
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Translated sections in ${lang}/index.html`);
  }
});
