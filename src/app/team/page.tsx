"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Navbar from "@/components/Navbar";
import StaticShell from "@/components/static-shell";

const teamMembers = [
  // 1 — top left
  {
    name: "Muskan Ahuja",
    role: "Founder",
    bio: "Muskan channels lived experience into powerful narratives that inspire and uplift. She guides people toward self-belief and resilience through workshops, sessions, and community outreach.",
    photo: "/images/team/Muskan.webp",
    linkedin: "https://www.linkedin.com/in/muskan-ahuja-156006245",
  },
  // 2 — top right
  {
    name: "Suryansh Agarwal",
    role: "Tech Lead & PR Head",
    bio: "Suryansh architects the digital backbone of Mindset while managing public relations. He ensures the platform is seamless, scalable, and that the brand's story is told with authenticity.",
    photo: "/images/team/Suryansh.webp",
    linkedin: "https://www.linkedin.com/in/suryanshag",
  },
  // 3 — below Suryansh (right)
  {
    name: "Sachi Aggarwal",
    role: "Manager",
    bio: "Sachi keeps every part of Mindset running with clarity and purpose. She bridges teams, drives operations, and ensures that the vision behind every initiative is translated into real impact.",
    photo: "/images/team/sachi.webp",
    linkedin: "https://www.linkedin.com/in/sachiaggarwal",
  },
  // 4 — below Muskan (left)
  {
    name: "Shruti",
    role: "Video Creator",
    bio: "Shruti conceives and creates video content that speaks directly to Mindset's audience. Her authentic on-screen presence and creative instincts make complex mental health topics feel approachable.",
    photo: "/images/team/shruti.webp",
    linkedin: "https://www.linkedin.com/",
  },
  // 5 — bottom, Ayush
  {
    name: "Ayush Gupta",
    role: "Marketing Manager",
    bio: "Ayush shapes how Mindset shows up in the world. From campaigns to community conversations, he builds narratives that connect people to mental health support without stigma.",
    photo: "/images/team/ayush.webp",
    linkedin: "https://www.linkedin.com/in/ayush-gupta-b1a586192",
  },
  // 6 — bottom, Video Editor
  {
    name: "Siya Sachdeva",
    role: "Video Editor",
    bio: "Siya brings stories to life through the edit. With a sharp eye for pacing and emotion, she transforms raw footage into compelling visual content that reflects Mindset's warmth and mission.",
    photo: "/images/team/Siya.webp",
    linkedin: "https://www.linkedin.com/in/siya-sachdeva",
  },
];


const linkSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;

function buildMemberCard(member: (typeof teamMembers)[number]): string {
  return `
    <div class="tm-card">
      <div class="tm-card__img-wrap">
        <img src="${member.photo}" alt="${member.name}" loading="lazy" />
        <a href="${member.linkedin}" class="tm-card__social" target="_blank" rel="noopener noreferrer" aria-label="${member.name} on LinkedIn">${linkSVG}</a>
      </div>
      <div class="tm-card__content-wrap">
        <div class="tm-card__content">
          <div class="tm-card__text">
            <h3>${member.name}</h3>
            <p>${member.role}</p>
          </div>
          <div class="tm-card__bio">
            <p>${member.bio}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

const staticHTML = `
  <main class="wp-block-group is-layout-flow wp-block-group-is-layout-flow">
    <div class="entry-content wp-block-post-content is-layout-flow wp-block-post-content-is-layout-flow">

      <!-- Hero -->
      <section class="block-blog-hero">
        <div class="block-blog-hero__container container">
          <div class="block-blog-hero__heading-wrapper">
            <h1 class="block-blog-hero__heading">Mind's Behind</h1>
            <h2 class="block-blog-hero__subheading">The people behind your care</h2>
          </div>
        </div>
        <div class="block-blog-hero__shapes">
          <div class="block-blog-hero__shape block-blog-hero__shape--1" data-shape-animate>
            <img width="173" height="193" decoding="async" src="/images/decoration/blog-shape-1.svg" alt="" />
          </div>
          <div class="block-blog-hero__shape block-blog-hero__shape--2" data-shape-animate>
            <img width="179" height="194" decoding="async" src="/images/decoration/blog-shape-2.svg" alt="" />
          </div>
          <div class="block-blog-hero__shape block-blog-hero__shape--3" data-shape-animate>
            <img width="219" height="215" decoding="async" src="/images/decoration/blog-shape-3.svg" alt="" />
          </div>
          <div class="block-blog-hero__shape block-blog-hero__shape--4" data-shape-animate>
            <img width="182" height="194" decoding="async" src="/images/decoration/blog-shape-4.svg" alt="" />
          </div>
          <div class="block-blog-hero__shape block-blog-hero__shape--5" data-shape-animate>
            <img width="170" height="136" decoding="async" src="/images/decoration/blog-shape-5.svg" alt="" />
          </div>
        </div>
      </section>

      <!-- Team cards -->
      <div style="background:#FAF8EF; padding: 1px 0;">
        <section class="tm-section">
          <p class="tm-section__desc">A passionate group of individuals driven by one shared belief — that mental health support should be accessible, real, and stigma-free for everyone.</p>
          <div class="tm-section__cards" data-team-grid></div>
        </section>
      </div>

    </div>
  </main>

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
`;

export default function TeamPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Inject team member cards
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const grid = container.querySelector<HTMLElement>("[data-team-grid]");
    if (!grid) return;
    grid.innerHTML = teamMembers.map((m) => buildMemberCard(m)).join("");
  }, []);

  // GSAP + Lenis + header
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const container = containerRef.current;
    if (!container) return;

    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    const tickerCallback = (time: number) => { lenis.raf(time * 1000); };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Scroll-to-top
    const upBtn = container.querySelector<HTMLElement>("[data-scroll-to-top]");
    if (upBtn) {
      upBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    // Shape animations
    const shapes = container.querySelectorAll<HTMLElement>("[data-shape-animate]");
    shapes.forEach((shape, i) => {
      gsap.to(shape, {
        opacity: 1,
        scale: 1,
        rotation: (i % 2 === 0 ? 1 : -1) * (5 + i * 3),
        duration: 1,
        delay: 0.2 + i * 0.15,
        ease: "back.out(1.7)",
      });
      gsap.to(shape, {
        y: i % 2 === 0 ? -28 : 28,
        rotation: `+=${i % 2 === 0 ? 3 : -3}`,
        duration: 2.4 + i * 0.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });

    // Staggered entrance for team items.
    // Earlier this used scrollTrigger; on client-side navigation the trigger
    // would lock to stale layout values and cards stayed at opacity 0 until
    // a hard reload. A simple staggered cascade is more reliable and looks
    // just as good for a small grid.
    requestAnimationFrame(() => {
      const items = container.querySelectorAll<HTMLElement>(".tm-card");
      gsap.fromTo(
        items,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.08,
        },
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <Navbar light />
      <StaticShell ref={containerRef} html={staticHTML} />
    </>
  );
}
