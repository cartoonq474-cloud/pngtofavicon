const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const filePath = path.join(__dirname, 'hi', 'index.html');
if (fs.existsSync(filePath)) {
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  const section = document.getElementById('testimonials');
  if (section) {
    const dict = {
      "Testimonials": "प्रशंसापत्र",
      "What Our Users Say": "हमारे उपयोगकर्ता क्या कहते हैं",
      "Over 50,000 developers, designers, and creators trust PNGtoFavicon for their projects.": "50,000 से अधिक डेवलपर्स, डिज़ाइनर और क्रिएटर अपने प्रोजेक्ट के लिए PNGtoFavicon पर भरोसा करते हैं।",
      "from 500+ reviews": "500+ समीक्षाओं से",
      "The fastest way to generate all favicon sizes. It literally takes 2 seconds and handles the new manifest.json formats perfectly.": "सभी फ़ेविकॉन आकार उत्पन्न करने का सबसे तेज़ तरीका। इसमें वस्तुतः 2 सेकंड लगते हैं और यह नए manifest.json प्रारूपों को पूरी तरह से संभालता है।",
      "I used to use ImageMagick for this, but this site is so much simpler. Drag, drop, download, done.": "मैं इसके लिए पहले ImageMagick का उपयोग करता था, लेकिन यह साइट बहुत सरल है। खींचें, छोड़ें, डाउनलोड करें, हो गया।",
      "Love that it runs completely in the browser. I don't have to worry about uploading sensitive client logos to some random server.": "मुझे पसंद है कि यह पूरी तरह से ब्राउज़र में चलता है। मुझे किसी यादृच्छिक सर्वर पर संवेदनशील क्लाइंट लोगो अपलोड करने के बारे में चिंता करने की ज़रूरत नहीं है।",
      "Perfect for converting high-res PNGs to the legacy ICO format. A must-have tool for my daily web dev workflow.": "उच्च-रिज़ॉल्यूशन वाले PNG को पुराने ICO प्रारूप में परिवर्तित करने के लिए बिल्कुल सही। मेरे दैनिक वेब देव वर्कफ़्लो के लिए एक आवश्यक उपकरण।",
      "Clean UI, fast processing, and it gives you the exact HTML tags to copy-paste. Excellent tool!": "स्वच्छ यूआई, तेज प्रसंस्करण, और यह आपको कॉपी-पेस्ट करने के लिए सटीक HTML टैग देता है। उत्कृष्ट उपकरण!",
      "The transparency handling is spot on. Other converters usually mess up the alpha channels, but this one works perfectly.": "पारदर्शिता को संभालना बिल्कुल सही है। अन्य कन्वर्टर्स आमतौर पर अल्फा चैनलों को गड़बड़ कर देते हैं, लेकिन यह पूरी तरह से काम करता है।",
      "Finally a favicon generator that includes the 512x512 PWA icon. Saves me from manually resizing images.": "अंततः एक फ़ेविकॉन जनरेटर जिसमें 512x512 PWA आइकन शामिल है। मुझे मैन्युअल रूप से छवियों का आकार बदलने से बचाता है।",
      "Simple and effective. The dark mode interface is a nice touch for us developers working late at night.": "सरल और प्रभावी। देर रात तक काम करने वाले हम डेवलपर्स के लिए डार्क मोड इंटरफ़ेस एक अच्छा स्पर्श है।",
      "I've bookmarked this. It's the only favicon tool I've found that doesn't bombard you with ads or popups.": "मैंने इसे बुकमार्क कर लिया है। यह एकमात्र फ़ेविकॉन उपकरण है जो मुझे मिला है जो आप पर विज्ञापनों या पॉपअप की बमबारी नहीं करता है।",
      "Generates crisp 16x16 icons without blurring. The resizing algorithm they use is definitely high quality.": "धुंधला किए बिना स्पष्ट 16x16 आइकन उत्पन्न करता है। उनके द्वारा उपयोग किया जाने वाला आकार बदलने वाला एल्गोरिदम निश्चित रूप से उच्च गुणवत्ता वाला है।",
      "As a UX designer, I appreciate tools that just work. The drag and drop zone is huge and responsive.": "एक यूएक्स डिज़ाइनर के रूप में, मैं उन उपकरणों की सराहना करता हूं जो काम करते हैं। ड्रैग एंड ड्रॉप ज़ोन विशाल और प्रतिक्रियाशील है।",
      "Works flawlessly on my Mac. The generated zip file is perfectly structured. Highly recommended.": "मेरे मैक पर त्रुटिहीन रूप से काम करता है। उत्पन्न ज़िप फ़ाइल पूरी तरह से संरचित है। अत्यधिक अनुशंसित।",
      "Frontend Developer": "फ्रंटएंड डेवलपर",
      "Web Designer": "वेब डिज़ाइनर",
      "Software Engineer": "सॉफ़्टवेयर इंजीनियर",
      "UI/UX Designer": "UI/UX डिज़ाइनर",
      "Full Stack Dev": "फुल स्टैक देव",
      "Product Manager": "उत्पाद प्रबंधक",
      "Indie Hacker": "इंडी हैकर",
      "Tech Lead": "टेक लीड"
    };

    const subtitleAccent = section.querySelector('.section-subtitle-accent');
    if (subtitleAccent && dict[subtitleAccent.textContent.trim()]) {
      subtitleAccent.textContent = dict[subtitleAccent.textContent.trim()];
    }

    const sectionTitle = section.querySelector('.section-title');
    if (sectionTitle && dict[sectionTitle.textContent.trim()]) {
      sectionTitle.textContent = dict[sectionTitle.textContent.trim()];
    }

    const sectionSubtitle = section.querySelector('.section-subtitle');
    if (sectionSubtitle && dict[sectionSubtitle.textContent.trim()]) {
      sectionSubtitle.textContent = dict[sectionSubtitle.textContent.trim()];
    }

    const ratingTexts = section.querySelectorAll('.rating-text');
    ratingTexts.forEach(el => {
      const txt = el.textContent.trim();
      if (dict[txt]) {
        el.textContent = dict[txt];
      }
    });

    const reviewTexts = section.querySelectorAll('.review-text');
    reviewTexts.forEach(el => {
      const txt = el.textContent.trim().replace(/^"|"$/g, '');
      if (dict[txt]) {
        el.textContent = `"${dict[txt]}"`;
      }
    });

    const roleTexts = section.querySelectorAll('.reviewer-role');
    roleTexts.forEach(el => {
      const txt = el.textContent.trim();
      if (dict[txt]) {
        el.textContent = dict[txt];
      }
    });

    fs.writeFileSync(filePath, dom.serialize(), 'utf8');
    console.log(`Translated Testimonials in hi/index.html using jsdom`);
  } else {
    console.log(`Testimonials Section not found in hi/index.html`);
  }
}
