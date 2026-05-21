// Shared marketing footer — used by /ngo-visits today. /workshops,
// /products, /doctors, /team, and /study-materials still render this
// markup inline inside their dangerouslySetInnerHTML strings; they can
// migrate to this component when each page is next touched, without
// changing the rendered output (this is the same HTML byte-for-byte).
//
// Server Component on purpose — no client behavior, no useState, no
// effects. The scroll-to-top button + WhatsApp links use plain anchors
// + the shared globals.css click handlers already wired up site-wide.

const FOOTER_HTML = `
  <footer class="block-footer">
      <div class="block-footer__container container">
          <div class="block-footer__top">
              <div class="block-footer__brand">
                  <div class="block-footer__brand-identity">
                      <img src="/images/icons/Logo.webp" alt="Mindset logo" class="block-footer__brand-logo">
                      <span class="block-footer__brand-wordmark">Mindset</span>
                  </div>
                  <p class="block-footer__brand-tagline">Making mental health support accessible, affordable, and stigma-free for everyone.</p>
                  <div class="block-footer__social">
                      <a href="mailto:mindset.org.connect@gmail.com" class="block-footer__social-link" aria-label="Email"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg></a>
                      <a href="https://www.linkedin.com/company/mindsetbymuskan" class="block-footer__social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
                      <a href="https://www.instagram.com/mindset.org.in" class="block-footer__social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
                      <a href="https://www.youtube.com/@Mindset_By_Muskan?sub_confirmation=1" class="block-footer__social-link" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75,15.02 15.5,12 9.75,8.98"/></svg></a>
                      <a href="https://chat.whatsapp.com/EahWvy2Mojm6s3gnK9SGP5" class="block-footer__social-link" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
                      <a href="https://www.reddit.com/u/Desperate-War-7820" class="block-footer__social-link" aria-label="Reddit" target="_blank" rel="noopener noreferrer"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg></a>
                  </div>
              </div>
              <div class="block-footer__col">
                  <h3 class="block-footer__col-title">Explore</h3>
                  <ul class="block-footer__col-list">
                      <li><a href="/team">Our Team</a></li>
                      <li><a href="/doctors">Doctors</a></li>
                      <li><a href="/products">Products</a></li>
                      <li><a href="/study-materials">Study Materials</a></li>
                      <li><a href="/workshops">Workshops</a></li>
                      <li><a href="/ngo-visits">NGO Visits</a></li>
                      <li><a href="/#apply-now">Contact</a></li>
                  </ul>
              </div>
              <div class="block-footer__col">
                  <h3 class="block-footer__col-title">Get in touch</h3>
                  <a href="mailto:mindset.org.connect@gmail.com" class="block-footer__contact-email">mindset.org.connect@gmail.com</a>
                  <a href="/#apply-now" class="block-footer__contact-cta">
                      Send a message
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </a>
                  <p class="block-footer__contact-note">We reply within 24 hours. No judgment — just genuine support.</p>
              </div>
              <button class="block-footer__up-button" aria-label="Scroll to top" data-scroll-to-top>↑</button>
          </div>
          <div class="block-footer__middle">
              <div class="block-footer__logo">
                  <span class="block-footer__logo-text"><span class="fl" style="--fl-y:-0.06em;--fl-r:-3deg">M</span><span class="fl" style="--fl-y:0.08em;--fl-r:2deg">i</span><span class="fl" style="--fl-y:-0.04em;--fl-r:-1deg">n</span><span class="fl" style="--fl-y:0.07em;--fl-r:3deg">d</span><span class="fl" style="--fl-y:-0.09em;--fl-r:-2deg">s</span><span class="fl" style="--fl-y:0.05em;--fl-r:1deg">e</span><span class="fl" style="--fl-y:-0.03em;--fl-r:-2deg">t</span><span class="fl fl--dot" style="--fl-y:0.12em;--fl-r:0deg">.</span><span class="fl" style="--fl-y:-0.07em;--fl-r:2deg">o</span><span class="fl" style="--fl-y:0.06em;--fl-r:-3deg">r</span><span class="fl" style="--fl-y:-0.05em;--fl-r:1deg">g</span><span class="fl fl--dot" style="--fl-y:0.1em;--fl-r:0deg">.</span><span class="fl" style="--fl-y:-0.08em;--fl-r:-2deg">i</span><span class="fl" style="--fl-y:0.04em;--fl-r:3deg">n</span></span>
              </div>
          </div>
          <div class="block-footer__bottom">
              <div class="block-footer__copyright">© 2026 Mindset. All rights reserved.</div>
              <nav class="block-footer__legal-nav" aria-label="Legal">
                  <a href="/privacy-policy">Privacy Policy</a>
                  <a href="/terms-of-use">Terms of Use</a>
              </nav>
          </div>
      </div>
  </footer>
`

export default function MarketingFooter() {
  return <div dangerouslySetInnerHTML={{ __html: FOOTER_HTML }} />
}
