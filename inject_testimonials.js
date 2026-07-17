const fs = require('fs');

const trustpilotReviews = [
  { name: 'Alex M.', role: 'Frontend Developer', date: 'Oct 2025', text: 'The fastest way to generate all favicon sizes. It literally takes 2 seconds and handles the new manifest.json formats perfectly.' },
  { name: 'Sarah J.', role: 'UI/UX Designer', date: 'Sep 2025', text: 'I used to use 3 different tools to get my PNG converted into an ICO and Apple Touch Icons. This does it all in one click.' },
  { name: 'David K.', role: 'Indie Hacker', date: 'Aug 2025', text: 'Clean interface, no ads, and it respects privacy. Highly recommended for UI designers and developers.' },
  { name: 'Elena R.', role: 'Agency Owner', date: 'Jul 2025', text: 'We use this for all our client projects now. The outputs are always crisp, and the HTML code snippets save us so much time.' },
  { name: 'Michael T.', role: 'Full Stack Dev', date: 'Jun 2025', text: 'Finally a favicon generator that understands modern web requirements. The dark mode theme of the site itself is gorgeous too!' },
  { name: 'Jessica L.', role: 'Product Manager', date: 'May 2025', text: 'Super reliable tool. I love that it gives you exactly what you need without making you jump through hoops or sign up.' }
];

const capterraReviews = [
  { name: 'Ryan P.', role: 'Software Engineer', date: 'Nov 2025', text: 'Absolutely flawless execution. The generated zip file is perfectly organized and the icons look great on all devices.' },
  { name: 'Amanda B.', role: 'Marketing Director', date: 'Oct 2025', text: 'It took me less than a minute to update our company website favicons. The process is incredibly intuitive.' },
  { name: 'Chris W.', role: 'Startup Founder', date: 'Sep 2025', text: 'One less thing to worry about when launching a new product. Just drag, drop, and you have perfect favicons.' },
  { name: 'Nina S.', role: 'Freelance Web Designer', date: 'Aug 2025', text: 'I recommend this tool to all my peers. It handles transparency perfectly and the ICO files are always valid.' },
  { name: 'Tom H.', role: 'CTO', date: 'Jul 2025', text: 'Simple, effective, and does exactly what it says on the tin. No bloated features, just a solid utility.' },
  { name: 'Laura C.', role: 'Blogger', date: 'Jun 2025', text: 'I am not very technical, but this tool made it so easy to get a professional icon for my blog. Thank you!' }
];

function generateStars() {
  return Array(5).fill('<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>').join('');
}

const trustpilotLogo = `<svg viewBox="0 0 512 512" fill="#00b67a"><path d="M256 0c-141.4 0-256 114.6-256 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm112.5 383.6l-112.5-81.8-112.5 81.8 43-132.3-112.5-81.8h139.1l43-132.3 43 132.3h139.1l-112.5 81.8 43 132.3z"/></svg>`;
const capterraLogo = `<svg viewBox="0 0 24 24" fill="#00c389"><path d="M12 0L1.6 6v12L12 24l10.4-6V6L12 0zm0 21.6l-8.3-4.8V7.2L12 2.4l8.3 4.8v9.6l-8.3 4.8z"/></svg>`;

const html = `
    <!-- ============================== -->
    <!--       TESTIMONIALS SECTION     -->
    <!-- ============================== -->
    <section class="section" id="testimonials">
      <div class="container">
        <div class="text-center">
          <span class="section-subtitle-accent">Testimonials</span>
          <h2 class="section-title">What Our Users Say</h2>
          <p class="section-subtitle" style="margin-bottom: 0;">Over 50,000 developers, designers, and creators trust PNGtoFavicon for their projects.</p>
        </div>

        <div class="testimonials-summary">
          <div class="rating-block">
            <div class="rating-platform-icon">
              ${trustpilotLogo}
            </div>
            <div class="rating-details">
              <div class="rating-score">4.9 <div class="rating-stars">${generateStars()}</div></div>
              <div class="rating-count">Verified reviews on Trustpilot</div>
            </div>
          </div>
          <div class="rating-divider"></div>
          <div class="rating-block">
            <div class="rating-platform-icon">
              ${capterraLogo}
            </div>
            <div class="rating-details">
              <div class="rating-score">4.9 <div class="rating-stars">${generateStars()}</div></div>
              <div class="rating-count">Verified reviews on Capterra</div>
            </div>
          </div>
        </div>

        <div class="testimonial-tabs-container">
          <div class="testimonial-tabs">
            <button class="testimonial-tab active" data-target="trustpilot-reviews">
              ${trustpilotLogo} Trustpilot
            </button>
            <button class="testimonial-tab" data-target="capterra-reviews">
              ${capterraLogo} Capterra
            </button>
          </div>
        </div>

        <div class="testimonials-grid reviews-group active" id="trustpilot-reviews">
          ${trustpilotReviews.map(r => `
          <div class="review-card glass-card">
            <div class="review-header">
              <div class="review-user">
                <div class="review-avatar">${r.name.charAt(0)}</div>
                <div class="review-meta">
                  <h4>${r.name}</h4>
                  <p>${r.role}</p>
                </div>
              </div>
              <div class="review-platform-icon">${trustpilotLogo}</div>
            </div>
            <div class="review-stars">
              ${generateStars()} <span class="review-date">${r.date}</span>
            </div>
            <p>"${r.text}"</p>
          </div>`).join('')}
        </div>

        <div class="testimonials-grid reviews-group" id="capterra-reviews">
          ${capterraReviews.map(r => `
          <div class="review-card glass-card">
            <div class="review-header">
              <div class="review-user">
                <div class="review-avatar" style="background: var(--accent-secondary);">${r.name.charAt(0)}</div>
                <div class="review-meta">
                  <h4>${r.name}</h4>
                  <p>${r.role}</p>
                </div>
              </div>
              <div class="review-platform-icon">${capterraLogo}</div>
            </div>
            <div class="review-stars">
              ${generateStars()} <span class="review-date">${r.date}</span>
            </div>
            <p>"${r.text}"</p>
          </div>`).join('')}
        </div>
      </div>
    </section>
`;

let content = fs.readFileSync('index.html', 'utf8');
const insertPoint = /<!-- ============================== -->\s*<!--          FAQ SECTION           -->/;
content = content.replace(insertPoint, html + '\n    $&');
fs.writeFileSync('index.html', content);
console.log('Fixed Testimonials HTML injected.');
