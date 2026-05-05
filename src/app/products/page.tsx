"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Navbar from "@/components/Navbar";
import ProductActions from "@/components/products/product-actions";

type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  image: string | null;
};

const staticHTML = `
  <main class="wp-block-group is-layout-flow wp-block-group-is-layout-flow">
    <div class="entry-content wp-block-post-content is-layout-flow wp-block-post-content-is-layout-flow">
      <section class="block-blog-hero">
        <div class="block-blog-hero__container container">
          <div class="block-blog-hero__heading-wrapper">
            <h1 class="block-blog-hero__heading">Our Products</h1>
            <h2 class="block-blog-hero__subheading">Wellness tools curated for your journey</h2>
          </div>
        </div>
        <div class="block-blog-hero__shapes">
          <div class="block-blog-hero__shape block-blog-hero__shape--1" data-shape-animate>
            <img width="173" height="193" decoding="async" src="/images/decoration/blog-shape-1.svg" alt="Shape 1" />
          </div>
          <div class="block-blog-hero__shape block-blog-hero__shape--2" data-shape-animate>
            <img width="179" height="194" decoding="async" src="/images/decoration/blog-shape-2.svg" alt="Shape 2" />
          </div>
          <div class="block-blog-hero__shape block-blog-hero__shape--3" data-shape-animate>
            <img width="219" height="215" decoding="async" src="/images/decoration/blog-shape-3.svg" alt="Shape 3" />
          </div>
          <div class="block-blog-hero__shape block-blog-hero__shape--4" data-shape-animate>
            <img width="182" height="194" decoding="async" src="/images/decoration/blog-shape-4.svg" alt="Shape 4" />
          </div>
          <div class="block-blog-hero__shape block-blog-hero__shape--5" data-shape-animate>
            <img width="170" height="136" decoding="async" src="/images/decoration/blog-shape-5.svg" alt="Shape 5" />
          </div>
        </div>
      </section>

      <section class="block-blog-listing">
        <div class="block-blog-listing__container container">
          <div class="block-blog-listing__content">
            <div class="block-blog-listing__sidebar">
              <div class="block-blog-listing__search">
                <div class="block-blog-listing__search-wrapper">
                  <input type="text" class="block-blog-listing__search-input" placeholder="Search products" data-search-input>
                  <button class="block-blog-listing__search-button" data-search-button>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.940 4.578 C 8.546 4.810,7.398 5.393,6.407 6.372 C 5.564 7.205,5.003 8.183,4.706 9.341 C 4.560 9.910,4.514 10.289,4.514 10.920 C 4.514 12.621,5.126 14.134,6.318 15.375 C 8.066 17.195,10.761 17.805,13.155 16.922 C 13.725 16.712,14.246 16.425,14.776 16.029 L 15.092 15.793 17.046 17.746 L 19.000 19.700 19.350 19.350 L 19.700 19.000 17.746 17.046 L 15.793 15.092 16.029 14.776 C 16.892 13.621,17.317 12.346,17.319 10.910 C 17.321 9.840,17.088 8.905,16.576 7.919 C 15.714 6.261,14.101 5.046,12.220 4.638 C 11.712 4.528,10.440 4.495,9.940 4.578 M12.040 5.620 C 14.250 6.112,15.898 7.861,16.261 10.099 C 16.399 10.951,16.292 11.987,15.980 12.816 C 15.187 14.923,13.170 16.320,10.920 16.320 C 10.077 16.320,9.276 16.135,8.530 15.770 C 7.061 15.049,5.976 13.659,5.620 12.040 C 5.531 11.634,5.495 10.566,5.558 10.169 C 5.715 9.168,6.068 8.340,6.661 7.580 C 7.487 6.521,8.619 5.845,10.012 5.579 C 10.406 5.504,11.629 5.528,12.040 5.620 " stroke="none" fill-rule="evenodd" fill="black"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="block-blog-listing__categories">
                <h3 class="block-blog-listing__categories-title">Filter</h3>
                <div class="block-blog-listing__categories-list">
                  <button class="block-blog-listing__category-item block-blog-listing__category-item--active" data-category-filter="all">All</button>
                  <button class="block-blog-listing__category-item" data-category-filter="in-stock">In Stock</button>
                  <button class="block-blog-listing__category-item" data-category-filter="low-stock">Low Stock</button>
                </div>
              </div>
            </div>

            <div class="block-blog-listing__main">
              <div class="block-blog-listing__posts" data-posts-container>
                <div class="ms-skel-grid" aria-busy="true" aria-label="Loading products">
                  ${Array.from({ length: 6 }).map(() => `
                    <div class="ms-skel-card">
                      <div class="ms-skel ms-skel-card__media ms-skel-card__media--square"></div>
                      <div class="ms-skel-card__body">
                        <div class="ms-skel ms-skel-card__chip"></div>
                        <div class="ms-skel ms-skel-card__title"></div>
                        <div class="ms-skel ms-skel-card__line"></div>
                        <div class="ms-skel ms-skel-card__line ms-skel-card__line--short"></div>
                        <div class="ms-skel ms-skel-card__price"></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
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

function getStockLabel(stock: number): { label: string; cssClass: string; filterKey: string } {
  if (stock === 0) return { label: "Out of Stock", cssClass: "block-blog-listing__post-category--orange", filterKey: "out-of-stock" };
  if (stock < 5) return { label: "Low Stock", cssClass: "block-blog-listing__post-category--yellow", filterKey: "low-stock" };
  return { label: "In Stock", cssClass: "block-blog-listing__post-category--green", filterKey: "in-stock" };
}

function buildProductCard(product: Product): string {
  const { label, cssClass, filterKey } = getStockLabel(product.stock);
  const photo = product.image || "/images/product-placeholder.svg";
  const price = Number(product.price).toLocaleString("en-IN");
  const shortDesc =
    product.description.length > 90
      ? product.description.slice(0, 90) + "…"
      : product.description;

  return `
    <article class="block-blog-listing__post" data-post-id="${product.id}" data-categories="${filterKey}">
      <div class="block-blog-listing__post-link">
        <div class="block-blog-listing__post-image">
          <img width="600" height="600" src="${photo}" alt="${product.name}" loading="lazy">
        </div>
        <div class="block-blog-listing__post-categories">
          <span class="block-blog-listing__post-category ${cssClass}">${label}</span>
        </div>
        <div class="block-blog-listing__post-content">
          <h3 class="block-blog-listing__post-title">${product.name}</h3>
          <p class="block-blog-listing__post-description">${shortDesc}</p>
          <p class="block-blog-listing__post-price">₹${price}</p>
        </div>
      </div>
    </article>
  `;
}

function buildProductDetail(product: Product): string {
  const { label, cssClass } = getStockLabel(product.stock);
  const photo = product.image || "/images/product-placeholder.svg";
  const price = Number(product.price).toLocaleString("en-IN");

  return `
    <div class="product-detail">
      <button class="doctor-detail__back" data-back-btn>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M5 12l7 7M5 12l7-7"/>
        </svg>
        All Products
      </button>

      <!-- Hero card -->
      <div class="product-detail__hero">
        <div class="product-detail__image-wrap">
          <img src="${photo}" alt="${product.name}" />
          <span class="block-blog-listing__post-category ${cssClass} product-detail__stock-badge">${label}</span>
        </div>

        <div class="product-detail__info">
          <h1 class="product-detail__name">${product.name}</h1>
          <p class="product-detail__price">₹${price}</p>

          <div class="product-detail__stock-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <span>${product.stock} unit${product.stock !== 1 ? "s" : ""} available</span>
          </div>

          <div id="product-actions-mount"></div>
        </div>
      </div>

      <!-- Body sections -->
      <div class="doctor-detail__body">
        <div class="doctor-detail__section">
          <h2 class="doctor-detail__section-title">About this product</h2>
          <p class="doctor-detail__section-text">${product.description.replace(/\n/g, "<br/>")}</p>
        </div>
      </div>
    </div>
  `;
}

function buildSkeletonGridHTML(count = 6): string {
  return `<div class="ms-skel-grid" aria-busy="true" aria-label="Loading">
    ${Array.from({ length: count }).map(() => `
      <div class="ms-skel-card">
        <div class="ms-skel ms-skel-card__media ms-skel-card__media--square"></div>
        <div class="ms-skel-card__body">
          <div class="ms-skel ms-skel-card__chip"></div>
          <div class="ms-skel ms-skel-card__title"></div>
          <div class="ms-skel ms-skel-card__line"></div>
          <div class="ms-skel ms-skel-card__line ms-skel-card__line--short"></div>
          <div class="ms-skel ms-skel-card__price"></div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function buildLoadingHTML(): string {
  return `
    <div class="ms-skel-detail" aria-busy="true" aria-label="Loading product">
      <div class="ms-skel ms-skel-detail__media"></div>
      <div class="ms-skel-detail__body">
        <div class="ms-skel ms-skel-detail__title"></div>
        <div class="ms-skel ms-skel-detail__sub"></div>
        <div class="ms-skel ms-skel-detail__line"></div>
        <div class="ms-skel ms-skel-detail__line"></div>
        <div class="ms-skel ms-skel-detail__line" style="width: 75%"></div>
        <div class="ms-skel ms-skel-detail__cta"></div>
      </div>
    </div>`;
}

export default function ProductsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const postsRef = useRef<HTMLElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const [actionsMount, setActionsMount] = useState<HTMLElement | null>(null);
  const showProductRef = useRef<(id: string) => void>(() => {});
  const goBackRef = useRef<() => void>(() => {});

  // Set shell HTML once — React never overwrites this since we're not using dangerouslySetInnerHTML
  useLayoutEffect(() => {
    if (containerRef.current) {
      postsRef.current = containerRef.current.querySelector<HTMLElement>("[data-posts-container]");
    }
  }, []);

  useEffect(() => {
    showProductRef.current = (id: string) => {
      const product = products.find((p) => p.id === id) ?? null;
      setSelectedProduct(product);
      setView("detail");
      const section = document.querySelector<HTMLElement>(".block-blog-listing");
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    goBackRef.current = () => {
      setView("list");
      setSelectedProduct(null);
      const container = containerRef.current;
      if (container) {
        container.querySelectorAll("[data-category-filter]").forEach((b) => {
          b.classList.toggle(
            "block-blog-listing__category-item--active",
            b.getAttribute("data-category-filter") === "all"
          );
        });
        const searchInput = container.querySelector<HTMLInputElement>("[data-search-input]");
        if (searchInput) searchInput.value = "";
      }
    };
  }, [products]);

  // Fetch products (retry once on failure — handles Neon cold start)
  useEffect(() => {
    let cancelled = false;
    async function load(attempt = 0) {
      try {
        const r = await fetch("/api/products");
        const data = await r.json();
        if (cancelled) return;
        if (Array.isArray(data)) {
          setProducts(data);
          setFetchError(false);
        } else if (attempt < 1) {
          await new Promise((res) => setTimeout(res, 1500));
          if (!cancelled) load(attempt + 1);
        } else {
          setFetchError(true);
        }
      } catch {
        if (cancelled) return;
        if (attempt < 1) {
          await new Promise((res) => setTimeout(res, 1500));
          if (!cancelled) load(attempt + 1);
        } else {
          setFetchError(true);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Clear portal mount when leaving detail view
  useEffect(() => {
    if (view !== "detail") setActionsMount(null);
  }, [view]);

  // Render content area — uses postsRef directly (immune to React reconciliation)
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const postsContainer = container.querySelector<HTMLElement>("[data-posts-container]");
    if (!postsContainer) return;
    postsRef.current = postsContainer;

    if (view === "detail") {
      if (selectedProduct) {
        postsContainer.innerHTML = buildProductDetail(selectedProduct);
        const backBtn = postsContainer.querySelector<HTMLElement>("[data-back-btn]");
        backBtn?.addEventListener("click", () => goBackRef.current());
        setActionsMount(postsContainer.querySelector<HTMLElement>("#product-actions-mount"));
      } else {
        postsContainer.innerHTML = buildLoadingHTML();
      }
      return;
    }

    // List view
    if (fetchError) {
      postsContainer.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:4rem 1.5rem;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 1.25rem;">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <h3 style="font-size:1.25rem; font-weight:600; color:#1f2937; margin:0 0 0.5rem;">Couldn't load products</h3>
          <p style="font-size:0.95rem; color:#6b7280; margin:0 0 1.5rem;">Please check your connection and try again.</p>
          <button onclick="window.location.reload()" style="padding:0.625rem 1.25rem; background:#7c3aed; color:white; border:none; border-radius:0.5rem; font-size:0.875rem; font-weight:500; cursor:pointer;">
            Retry
          </button>
        </div>`;
      return;
    }
    if (products.length === 0) return;

    const cards = products.map(buildProductCard).join("");
    const remainder = products.length % 3;
    const placeholders =
      remainder === 0
        ? ""
        : Array(3 - remainder)
            .fill(
              '<div class="block-blog-listing__post block-blog-listing__post-placeholder" aria-hidden="true"></div>'
            )
            .join("");
    postsContainer.innerHTML = cards + placeholders;

    // Card click → detail
    postsContainer
      .querySelectorAll<HTMLElement>(".block-blog-listing__post:not(.block-blog-listing__post-placeholder)")
      .forEach((card) => {
        card.addEventListener("click", () => {
          const id = card.getAttribute("data-post-id");
          if (id) showProductRef.current(id);
        });
      });

    // Category filter
    const categoryButtons = container.querySelectorAll<HTMLElement>("[data-category-filter]");
    const posts = postsContainer.querySelectorAll<HTMLElement>(
      ".block-blog-listing__post:not(.block-blog-listing__post-placeholder)"
    );
    const placeholderEls = postsContainer.querySelectorAll<HTMLElement>(
      ".block-blog-listing__post-placeholder"
    );

    categoryButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        categoryButtons.forEach((b) =>
          b.classList.remove("block-blog-listing__category-item--active")
        );
        btn.classList.add("block-blog-listing__category-item--active");
        const filter = btn.getAttribute("data-category-filter");
        if (filter === "all") {
          posts.forEach((p) => { p.style.display = ""; });
          placeholderEls.forEach((p) => { p.style.display = ""; });
        } else {
          placeholderEls.forEach((p) => { p.style.display = "none"; });
          posts.forEach((post) => {
            const cats = post.getAttribute("data-categories") || "";
            post.style.display = cats === filter ? "" : "none";
          });
        }
      });
    });

    // Search
    const searchInput = container.querySelector<HTMLInputElement>("[data-search-input]");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        placeholderEls.forEach((p) => { p.style.display = query ? "none" : ""; });
        posts.forEach((post) => {
          const title =
            post.querySelector(".block-blog-listing__post-title")?.textContent?.toLowerCase() || "";
          const desc =
            post.querySelector(".block-blog-listing__post-description")?.textContent?.toLowerCase() || "";
          post.style.display = title.includes(query) || desc.includes(query) ? "" : "none";
        });
      });
    }
  }, [view, products, selectedProduct, fetchError]);

  // GSAP + Lenis — unified ticker
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const container = containerRef.current;
    if (!container) return;

    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    const tickerCallback = (time: number) => { lenis.raf(time * 1000); };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

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

    // Scroll to top button
    const scrollTopBtn = container.querySelector<HTMLElement>("[data-scroll-to-top]");
    if (scrollTopBtn) {
      scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <Navbar light />
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: staticHTML }} />
      {actionsMount && selectedProduct && createPortal(
        <ProductActions product={{
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: Number(selectedProduct.price),
          image: selectedProduct.image,
          stock: selectedProduct.stock,
        }} />,
        actionsMount
      )}
    </>
  );
}
