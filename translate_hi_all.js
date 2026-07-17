const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const filePath = path.join(__dirname, 'hi', 'index.html');
if (fs.existsSync(filePath)) {
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  const dict = {
    // Nav
    "Converter": "कन्वर्टर",
    "Text to Favicon": "टेक्स्ट से फ़ेविकॉन",
    "Emoji to Favicon": "इमोजी से फ़ेविकॉन",
    "Favicon Checker": "फ़ेविकॉन चेकर",
    "Tutorials": "ट्यूटोरियल",
    "Blog": "ब्लॉग",
    
    // Tool UI
    "Supports: PNG, JPG, SVG, WEBP, GIF (max 5MB)": "समर्थित: PNG, JPG, SVG, WEBP, GIF (अधिकतम 5MB)",
    "Output Sizes": "आउटपुट आकार",
    "Background Color (for transparent PNGs)": "पृष्ठभूमि का रंग (पारदर्शी PNG के लिए)",
    "Copy": "कॉपी",
    
    // What's Included (JSON)
    "Web App Manifest file containing icon references, theme color, and background color. Essential for PWA support and Android home screen integration.": "वेब ऐप मेनिफेस्ट फ़ाइल जिसमें आइकन संदर्भ, थीम का रंग और पृष्ठभूमि का रंग शामिल है। PWA समर्थन और Android होम स्क्रीन एकीकरण के लिए आवश्यक है।",
    
    // Comparison Table
    "PNGtoFavicon vs Other Tools in The Market": "बाजार में PNGtoFavicon बनाम अन्य उपकरण",
    "See how we compare to other favicon generators on the market": "देखें कि हम बाज़ार में अन्य फ़ेविकॉन जेनरेटर से कैसे तुलना करते हैं",
    "Feature": "विशेषता",
    "Other Tools": "अन्य उपकरण",
    "Price": "मूल्य",
    "Free forever": "हमेशा के लिए मुफ़्त",
    "Freemium / Paid tiers": "फ्रीमियम / भुगतान स्तर",
    "Privacy": "गोपनीयता",
    "100% Client-side": "100% क्लाइंट-साइड",
    "Files uploaded to servers": "सर्वर पर फ़ाइलें अपलोड की गईं",
    "Speed": "गति",
    "Instant processing": "त्वरित प्रसंस्करण",
    "Depends on server load": "सर्वर लोड पर निर्भर करता है",
    "File Formats": "फ़ाइल स्वरूप",
    "ICO + PNG + Manifest": "ICO + PNG + मैनिफ़ेस्ट",
    "Often ICO only": "अक्सर केवल ICO",
    "No Registration": "कोई पंजीकरण नहीं",
    "No signup needed": "साइनअप की आवश्यकता नहीं है",
    "Sometimes required": "कभी-कभी आवश्यक होता है",
    "Multi-platform": "मल्टी-प्लेटफ़ॉर्म",
    "All devices & browsers": "सभी डिवाइस और ब्राउज़र",
    "Limited platform support": "सीमित प्लेटफ़ॉर्म समर्थन",
    
    // Testimonials
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

  // Replace text in all elements
  const walk = document.createTreeWalker(document.body, 4, null, false);
  let n;
  while ((n = walk.nextNode())) {
    const txt = n.nodeValue.trim();
    
    // Remove wrapping quotes for testimonials matching
    const txtUnquoted = txt.replace(/^"|"$/g, '');
    
    if (dict[txt]) {
      n.nodeValue = n.nodeValue.replace(txt, dict[txt]);
    } else if (dict[txtUnquoted]) {
      n.nodeValue = n.nodeValue.replace(txtUnquoted, dict[txtUnquoted]);
    } else if (txt === "Free forever" && n.parentNode && n.parentNode.innerHTML.includes("Free forever")) {
       n.nodeValue = n.nodeValue.replace("Free forever", dict["Free forever"]);
    }
  }
  
  // Specific fix for "Add this to your website's <head> tag:" which is mixed content
  document.querySelectorAll('p').forEach(p => {
    if (p.innerHTML.includes("Add this to your website's")) {
      p.innerHTML = p.innerHTML.replace("Add this to your website's", "इसे अपनी वेबसाइट के").replace("tag:", "टैग में जोड़ें:");
    }
  });

  fs.writeFileSync(filePath, dom.serialize(), 'utf8');
  console.log(`Fully translated hi/index.html`);
}
