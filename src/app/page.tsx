"use client";

import { useEffect, useRef } from "react";
import Swiper from "swiper/bundle";
import "swiper/css/bundle";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import Navbar from "@/components/Navbar";
import Preloader from "@/components/preloader/Preloader";

const sectionHTML = `
                <section class="block-hero">
                    <div class="block-hero__container container">
                        <h1 class="block-hero__heading" data-heading data-split-item>
                            <span class="block-hero__heading-line">Mindset begins.</span> <br />
                            <span class="block-hero__heading-line">Healing follows.</span>
                            <span class="block-hero__meet-row">
                                <span class="block-hero__meet-our"><span>Meet</span><span>Our</span></span>
                                <span class="block-hero__heading-words"
                                    data-words-wrapper="[{&quot;word&quot;:&quot;Clinical psychologists&quot;},{&quot;word&quot;:&quot;Counsellors&quot;}]"
                                    data-animation-config="{&quot;speed&quot;:75,&quot;delay&quot;:500,&quot;wordDisplayTime&quot;:1500}">
                                </span>
                            </span>
                        </h1>
                    </div>

                    <div class="block-hero__image">
                        <img src="/images/hero/Hero.webp" alt="Mindset" fetchpriority="high" />
                    </div>

                    <div class="block-hero__container container">
                        <p class="block-hero__description" data-animate-item>
                            Find the right support, exactly when you need it.<br />
                            Connect with trusted experts and start feeling better.
                        </p>
                    </div>

                </section>



                <nav class="block-subnav">
                    <div class="block-subnav__slider swiper" data-slider>
                        <ul class="block-subnav__list swiper-wrapper">
                            <li class="block-subnav__item swiper-slide">
                                <a href="#services" class="block-subnav__link" data-anchor-item>
                                    Services </a>
                            </li>
                            <li class="block-subnav__item swiper-slide">
                                <a href="#welcome-home" class="block-subnav__link" data-anchor-item>
                                    Discover Mindset</a>
                            </li>
                            <li class="block-subnav__item swiper-slide">
                                <a href="#rooms-and-prices" class="block-subnav__link" data-anchor-item>
                                    Explore Care </a>
                            </li>
                        </ul>

                        <button class="block-subnav__toggler" data-toggler aria-label="Toggle subnav">
                            <span class="block-subnav__toggler-icon icon icon-icon-close"></span>
                        </button>
                    </div>
                </nav>



                <section class="block-slogan">
                    <div class="block-slogan__container container">
                        <div class="block-slogan__items">
                            <div class="block-slogan__item-word" data-split-item>
                                Healing Happens </div>

                            <figure class="block-slogan__item-image -image-1" data-animate-item>
                                <img decoding="async" width="605" height="605"
                                    src="/images/decoration/slogan-1.webp"
                                    class="attachment-full size-full" alt="happy girl" loading="lazy"
                                    srcset="/images/decoration/slogan-1.webp 605w, /images/decoration/slogan-1-300x300.webp 300w, /images/decoration/slogan-1-150x150.webp 150w"
                                    sizes="auto, (max-width: 605px) 100vw, 605px" />
                            </figure>




                            <div class="block-slogan__item-word" data-split-item>
                                when Empathy </div>


                            <span class="block-slogan__item-shape -shape-1" data-animate-item></span>



                            <div class="block-slogan__item-word" data-split-item>
                                and </div>



                            <span class="block-slogan__item-shape -shape-2" data-animate-item></span>


                            <div class="block-slogan__item-word" data-split-item>
                                Professional Skills </div>




                            <span class="block-slogan__item-shape -shape-3" data-animate-item></span>

                            <div class="block-slogan__item-word" data-split-item>
                                come together </div>





                            <figure class="block-slogan__item-image -image-2" data-animate-item>
                                <img decoding="async" width="605" height="605"
                                    src="/images/decoration/slogan-2.webp"
                                    class="attachment-full size-full" alt="gdansk" loading="lazy"
                                    srcset="/images/decoration/slogan-2.webp 605w, /images/decoration/slogan-2-300x300.webp 300w, /images/decoration/slogan-2-150x150.webp 150w"
                                    sizes="auto, (max-width: 605px) 100vw, 605px" />
                            </figure>
                        </div>
                    </div>
                </section>



                <section class="block-services" id='services'>
                    <div class="block-services__container container">
                        <header class="section-header block-services__header" data-section-header>
                            <h2 class="section-header__heading" data-heading>
                                You're in Good Hands </h2>
                        </header>

                        <div class="block-services__items">
                            <div class="block-services__item -active" data-services-item>
                                <figure class="block-services__item-photo">
                                    <img loading="lazy" decoding="async"
                                        src="/images/sections/whatyouneed.webp"
                                        class="attachment-full size-full" alt="what you need" />
                                </figure>

                                <button class="block-services__item-toggler" data-services-toggler aria-label="Toggle service">
                                    <span class="block-services__item-toggler-inner">
                                        What you need right now </span>
                                    <!-- toggler icon commented out: button no longer toggles (only one item, JS handler disabled)
                                    <span class="block-services__item-toggler-icon">
                                        <span class="block-services__item-toggler-icon-line"></span>
                                        <span class="block-services__item-toggler-icon-line"></span>
                                    </span>
                                    -->
                                </button>

                                <div class="block-services__item-main" data-services-content aria-hidden="false">
                                    <div class="block-services__item-content">
                                        <ul>
                                            <li>Qualified, verified and experienced experts</li>
                                            <li>Built on real clinical standards</li>
                                            <li>Complete privacy &amp; confidentiality. your data stays secure</li>
                                            <li>Structured support plans, not random sessions, but guided journeys</li>
                                            <li>Smart matching that connects you to the right expert instantly</li>
                                            <li>Track progress and stay with the right expert, not start over every time</li>
                                            <li>Focus on long-term wellbeing not just quick fixes</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>



                <section class="block-tiles" id='welcome-home'>
                    <div class="block-tiles__container container">
                        <header class="section-header block-tiles__header" data-section-header>
                            <!-- data-label removed to disable label fade-in animation; heading animation kept -->
                            <span class="section-header__label">
                                Discover Mindset </span>

                            <h2 class="section-header__heading" data-heading>
                                Care, clarity, and support all in one place.</h2>
                        </header>

                        <div class="block-tiles__items">
                            <div class="block-tiles__item -active">
                                <a href="/doctors" class="block-tiles__item-link" aria-label="Expert Care"></a>
                                <div class="block-tiles__item-photos">
                                    <figure class="block-tiles__item-photo">
                                        <img decoding="async" src="/images/sections/doctor.webp" alt="expert care" loading="lazy">
                                    </figure>
                                </div>
                                <div class="block-tiles__item-content">
                                    <h3 class="block-tiles__item-heading">Expert Care</h3>
                                    <p class="block-tiles__item-description">Connect with trusted professionals who truly listen, understand, and guide you with care. Personalized support designed to help you navigate challenges, build resilience, and feel confident in your mental well-being.</p>
                                </div>
                                <span class="block-tiles__item-arrow">Explore <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                            </div>
                            <div class="block-tiles__item">
                                <a href="/products" class="block-tiles__item-link" aria-label="Wellness Products"></a>
                                <div class="block-tiles__item-photos">
                                    <figure class="block-tiles__item-photo">
                                        <img decoding="async" src="/images/sections/wellness-product.webp" alt="wellness products" loading="lazy">
                                    </figure>
                                </div>
                                <div class="block-tiles__item-content">
                                    <h3 class="block-tiles__item-heading">Wellness Products</h3>
                                    <p class="block-tiles__item-description">Explore thoughtfully curated tools that support your daily mental wellness. From calming aids to focus enhancers, everything is designed to help you reset, recharge, and stay balanced in your routine.</p>
                                </div>
                                <span class="block-tiles__item-arrow">Explore <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                            </div>
                            <div class="block-tiles__item">
                                <a href="/workshops" class="block-tiles__item-link" aria-label="Guided Programs"></a>
                                <div class="block-tiles__item-photos">
                                    <figure class="block-tiles__item-photo">
                                        <img decoding="async" src="/images/sections/GuidedPrograms.webp" alt="guided programs" loading="lazy">
                                    </figure>
                                </div>
                                <div class="block-tiles__item-content">
                                    <h3 class="block-tiles__item-heading">Guided Programs</h3>
                                    <p class="block-tiles__item-description">Follow structured programs created by experts to support real progress. Step-by-step guidance helps you build better habits, reduce stress, and create lasting positive change at your own pace.</p>
                                </div>
                                <span class="block-tiles__item-arrow">Explore <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                            </div>
                            <div class="block-tiles__item">
                                <a href="/study-materials" class="block-tiles__item-link" aria-label="Insights & Learning"></a>
                                <div class="block-tiles__item-photos">
                                    <figure class="block-tiles__item-photo">
                                        <img decoding="async" src="/images/sections/Insights.webp" alt="insights and learning" loading="lazy">
                                    </figure>
                                </div>
                                <div class="block-tiles__item-content">
                                    <h3 class="block-tiles__item-heading">Insights &amp; Learning</h3>
                                    <p class="block-tiles__item-description">Discover meaningful insights that help you understand your mind better. Learn practical techniques, explore new perspectives, and gain clarity to make healthier, more informed life decisions.</p>
                                </div>
                                <span class="block-tiles__item-arrow">Explore <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                            </div>
                        </div>
                    </div>
                </section>



                <section class="block-rooms" id='rooms-and-prices'>
                    <div class="block-rooms__container container">
                        <aside class="block-rooms__aside">
                            <div class="block-rooms__aside-inner">
                                <header class="section-header block-rooms__header" data-section-header>
                                    <span class="section-header__label" data-label>
                                        Explore Care </span>

                                    <h2 class="section-header__heading" data-heading>
                                        Find what u need </h2>
                                </header>

                                <nav class="block-rooms__nav" data-rooms-nav>
                                    <button class="block-rooms__nav-arrow -prev" data-rooms-nav-prev aria-label="Previous" disabled>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3l-5 5 5 5M13 8H3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </button>
                                    <div class="block-rooms__nav-viewport">
                                        <ul class="block-rooms__nav-list" data-rooms-nav-list>
                                            <li class="block-rooms__nav-item">
                                                <button class="block-rooms__nav-button -active" data-main-tab-toggler="0" aria-label="View room">Mindfulness</button>
                                            </li>
                                            <li class="block-rooms__nav-item">
                                                <button class="block-rooms__nav-button" data-main-tab-toggler="1" aria-label="View room">Family Counselling</button>
                                            </li>
                                            <li class="block-rooms__nav-item">
                                                <button class="block-rooms__nav-button" data-main-tab-toggler="2" aria-label="View room">Depression Care</button>
                                            </li>
                                            <li class="block-rooms__nav-item">
                                                <button class="block-rooms__nav-button" data-main-tab-toggler="3" aria-label="View room">Anxiety Management</button>
                                            </li>
                                            <li class="block-rooms__nav-item">
                                                <button class="block-rooms__nav-button" data-main-tab-toggler="4" aria-label="View room">OCD Therapy</button>
                                            </li>
                                            <li class="block-rooms__nav-item">
                                                <button class="block-rooms__nav-button" data-main-tab-toggler="5" aria-label="View room">Senior Care</button>
                                            </li>
                                            <li class="block-rooms__nav-item">
                                                <button class="block-rooms__nav-button" data-main-tab-toggler="6" aria-label="View room">Trauma Therapy</button>
                                            </li>
                                            <li class="block-rooms__nav-item">
                                                <button class="block-rooms__nav-button" data-main-tab-toggler="7" aria-label="View room">Grief Counselling</button>
                                            </li>
                                            <li class="block-rooms__nav-item">
                                                <button class="block-rooms__nav-button" data-main-tab-toggler="8" aria-label="View room">Relationships</button>
                                            </li>
                                            <li class="block-rooms__nav-item">
                                                <button class="block-rooms__nav-button" data-main-tab-toggler="9" aria-label="View room">Addiction Recovery</button>
                                            </li>
                                            <li class="block-rooms__nav-item">
                                                <button class="block-rooms__nav-button" data-main-tab-toggler="10" aria-label="View room">Career Guidance</button>
                                            </li>
                                            <li class="block-rooms__nav-item">
                                                <button class="block-rooms__nav-button" data-main-tab-toggler="11" aria-label="View room">Academic Stress</button>
                                            </li>
                                        </ul>
                                    </div>
                                    <button class="block-rooms__nav-arrow -next" data-rooms-nav-next aria-label="Next">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 13l5-5-5-5M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </button>
                                </nav>
                            </div>
                        </aside>

                        <div class="block-rooms__main">
                            <div class="block-rooms__tabs">
                                <div class="block-rooms__item
													-active" data-main-tab="0">
                                    <button class="block-rooms__item-toggler" data-mobile-toggler>
                                        Mindfulness

                                        <span class="block-rooms__item-toggler-icon">
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                        </span>
                                    </button>

                                    <div class="block-rooms__item-main" data-mobile-content>
                                        <div class="block-rooms__item-subtabs">
                                            <div class="block-rooms__item-subtab
																					-active" data-variant-tab="0">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close
                                                        aria-label="Close gallery">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Mindfulness.webp" alt="mindfulness" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>

                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">
                                                        Mindfulness </h3>

                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Mindfulness is the practice of being fully present and aware of your thoughts, emotions, and surroundings without judgment. In a fast-moving world, it’s common to feel distracted, overwhelmed, or stuck in constant overthinking. You may notice racing thoughts, difficulty focusing, irritability, or mental fatigue that affects your daily life.</p>
                                                        <p>With mindfulness, you learn to gently bring your attention back to the present instead of getting caught in worries or stress. It’s not about stopping thoughts, but observing them with calm awareness. Guided techniques like breathing exercises and grounding practices help relax your mind and improve clarity.</p>
                                                        <p>We help you build simple, practical mindfulness habits that fit into your routine. Over time, this can improve focus, reduce stress, and help you respond to situations with more calm and control.</p>
                                                    </div>

                                                    <button class="block-rooms__item-description-toggler"
                                                        description-read-more description-toggle-text="Read more"
                                                        description-toggle-text-less="Read less">
                                                        Read more </button>

                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self
                                                                class="wp-block-button__link wp-element-button">
                                                                <span>
                                                                    Know more </span>
                                                            </a>
                                                        </div>

                                                    </footer>
                                                </div>

                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge">
                                                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated
                                                        </span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Mindfulness Specialists</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Our verified practitioners bring calm and focus to help you build awareness and emotional balance.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">20+</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Verified Doctors</span>
                                                            </div>
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">4.9★</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Avg. Rating</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Mindfulness" class="block-rooms__item-specialist-btn">
                                                            Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                                        </a>
                                                    </div>
                                                </div>

                                                <!-- floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-0-0">
                                                    <button class="block-rooms__item-modal-close"
                                                        data-floorplan-modal-close aria-label="Close modal">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <figure class="block-rooms__item-modal-inner">
                                                        <img decoding="async" width="2560" height="1440"
                                                            src="/images/wp/Single-floor-plan_-scaled.webp"
                                                            class="attachment-full size-full" alt="single plan"
                                                            srcset="/images/wp/Single-floor-plan_-scaled.webp 2560w, /images/wp/Single-floor-plan_-300x169.webp 300w, /images/wp/Single-floor-plan_-1024x576.webp 1024w, /images/wp/Single-floor-plan_-768x432.webp 768w, /images/wp/Single-floor-plan_-1536x864.webp 1536w, /images/wp/Single-floor-plan_-2048x1152.webp 2048w, /images/wp/Single-floor-plan_-808x454.webp 808w, /images/wp/Single-floor-plan_-1600x900.webp 1600w"
                                                            sizes="(max-width: 2560px) 100vw, 2560px" />
                                                    </figure>
                                                </div>
-->
                                            </div>
                                            <!-- duplicate variant subtab commented out (only variant 0 renders)
<div class="block-rooms__item-subtab
										" data-variant-tab="1">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close
                                                        aria-label="Close gallery">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Mindfulness.webp" alt="mindfulness" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>

                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">
                                                        Mindfulness </h3>

                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Mindfulness is the practice of being fully present and aware of your thoughts, emotions, and surroundings without judgment. In a fast-moving world, it’s common to feel distracted, overwhelmed, or stuck in constant overthinking. You may notice racing thoughts, difficulty focusing, irritability, or mental fatigue that affects your daily life.</p>
                                                        <p>With mindfulness, you learn to gently bring your attention back to the present instead of getting caught in worries or stress. It’s not about stopping thoughts, but observing them with calm awareness. Guided techniques like breathing exercises and grounding practices help relax your mind and improve clarity.</p>
                                                        <p>We help you build simple, practical mindfulness habits that fit into your routine. Over time, this can improve focus, reduce stress, and help you respond to situations with more calm and control.</p>
                                                    </div>

                                                    <button class="block-rooms__item-description-toggler"
                                                        description-read-more description-toggle-text="Read more"
                                                        description-toggle-text-less="Read less">
                                                        Read more </button>

                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self
                                                                class="wp-block-button__link wp-element-button">
                                                                <span>
                                                                    Know more </span>
                                                            </a>
                                                        </div>

                                                    </footer>
                                                </div>

                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge">
                                                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated
                                                        </span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Mindfulness Specialists</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Our verified practitioners bring calm and focus to help you build awareness and emotional balance.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">20+</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Verified Doctors</span>
                                                            </div>
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">4.9★</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Avg. Rating</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Mindfulness" class="block-rooms__item-specialist-btn">
                                                            Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                                        </a>
                                                    </div>
                                                </div>

                                                <!- - floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-0-1">
                                                    <button class="block-rooms__item-modal-close"
                                                        data-floorplan-modal-close aria-label="Close modal">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <figure class="block-rooms__item-modal-inner">
                                                        <img decoding="async" width="2560" height="1440"
                                                            src="/images/wp/Single-floor-plan_-scaled.webp"
                                                            class="attachment-full size-full" alt="single plan"
                                                            srcset="/images/wp/Single-floor-plan_-scaled.webp 2560w, /images/wp/Single-floor-plan_-300x169.webp 300w, /images/wp/Single-floor-plan_-1024x576.webp 1024w, /images/wp/Single-floor-plan_-768x432.webp 768w, /images/wp/Single-floor-plan_-1536x864.webp 1536w, /images/wp/Single-floor-plan_-2048x1152.webp 2048w, /images/wp/Single-floor-plan_-808x454.webp 808w, /images/wp/Single-floor-plan_-1600x900.webp 1600w"
                                                            sizes="(max-width: 2560px) 100vw, 2560px" />
                                                    </figure>
                                                </div>
- ->
                                            </div>
-->
                                            <!-- duplicate variant subtab commented out (only variant 0 renders)
<div class="block-rooms__item-subtab
										" data-variant-tab="2">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close
                                                        aria-label="Close gallery">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Mindfulness.webp" alt="mindfulness" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>

                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">
                                                        Mindfulness </h3>

                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Mindfulness is the practice of being fully present and aware of your thoughts, emotions, and surroundings without judgment. In a fast-moving world, it’s common to feel distracted, overwhelmed, or stuck in constant overthinking. You may notice racing thoughts, difficulty focusing, irritability, or mental fatigue that affects your daily life.</p>
                                                        <p>With mindfulness, you learn to gently bring your attention back to the present instead of getting caught in worries or stress. It’s not about stopping thoughts, but observing them with calm awareness. Guided techniques like breathing exercises and grounding practices help relax your mind and improve clarity.</p>
                                                        <p>We help you build simple, practical mindfulness habits that fit into your routine. Over time, this can improve focus, reduce stress, and help you respond to situations with more calm and control.</p>
                                                    </div>

                                                    <button class="block-rooms__item-description-toggler"
                                                        description-read-more description-toggle-text="Read more"
                                                        description-toggle-text-less="Read less">
                                                        Read more </button>

                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self
                                                                class="wp-block-button__link wp-element-button">
                                                                <span>
                                                                    Know more </span>
                                                            </a>
                                                        </div>

                                                    </footer>
                                                </div>

                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge">
                                                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated
                                                        </span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Mindfulness Specialists</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Our verified practitioners bring calm and focus to help you build awareness and emotional balance.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">20+</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Verified Doctors</span>
                                                            </div>
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">4.9★</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Avg. Rating</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Mindfulness" class="block-rooms__item-specialist-btn">
                                                            Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                                        </a>
                                                    </div>
                                                </div>

                                                <!- - floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-0-2">
                                                    <button class="block-rooms__item-modal-close"
                                                        data-floorplan-modal-close aria-label="Close modal">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <figure class="block-rooms__item-modal-inner">
                                                        <img decoding="async" width="2560" height="1440"
                                                            src="/images/wp/Single-floor-plan_-scaled.webp"
                                                            class="attachment-full size-full" alt="single plan"
                                                            srcset="/images/wp/Single-floor-plan_-scaled.webp 2560w, /images/wp/Single-floor-plan_-300x169.webp 300w, /images/wp/Single-floor-plan_-1024x576.webp 1024w, /images/wp/Single-floor-plan_-768x432.webp 768w, /images/wp/Single-floor-plan_-1536x864.webp 1536w, /images/wp/Single-floor-plan_-2048x1152.webp 2048w, /images/wp/Single-floor-plan_-808x454.webp 808w, /images/wp/Single-floor-plan_-1600x900.webp 1600w"
                                                            sizes="(max-width: 2560px) 100vw, 2560px" />
                                                    </figure>
                                                </div>
- ->
                                            </div>
-->
                                            <!-- duplicate variant subtab commented out (only variant 0 renders)
<div class="block-rooms__item-subtab
										" data-variant-tab="3">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close
                                                        aria-label="Close gallery">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Mindfulness.webp" alt="mindfulness" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>

                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">
                                                        Mindfulness </h3>

                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Mindfulness is the practice of being fully present and aware of your thoughts, emotions, and surroundings without judgment. In a fast-moving world, it’s common to feel distracted, overwhelmed, or stuck in constant overthinking. You may notice racing thoughts, difficulty focusing, irritability, or mental fatigue that affects your daily life.</p>
                                                        <p>With mindfulness, you learn to gently bring your attention back to the present instead of getting caught in worries or stress. It’s not about stopping thoughts, but observing them with calm awareness. Guided techniques like breathing exercises and grounding practices help relax your mind and improve clarity.</p>
                                                        <p>We help you build simple, practical mindfulness habits that fit into your routine. Over time, this can improve focus, reduce stress, and help you respond to situations with more calm and control.</p>
                                                    </div>

                                                    <button class="block-rooms__item-description-toggler"
                                                        description-read-more description-toggle-text="Read more"
                                                        description-toggle-text-less="Read less">
                                                        Read more </button>

                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self
                                                                class="wp-block-button__link wp-element-button">
                                                                <span>
                                                                    Know more </span>
                                                            </a>
                                                        </div>

                                                    </footer>
                                                </div>

                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge">
                                                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated
                                                        </span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Mindfulness Specialists</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Our verified practitioners bring calm and focus to help you build awareness and emotional balance.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">20+</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Verified Doctors</span>
                                                            </div>
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">4.9★</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Avg. Rating</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Mindfulness" class="block-rooms__item-specialist-btn">
                                                            Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                                        </a>
                                                    </div>
                                                </div>

                                                <!- - floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-0-3">
                                                    <button class="block-rooms__item-modal-close"
                                                        data-floorplan-modal-close aria-label="Close modal">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <figure class="block-rooms__item-modal-inner">
                                                        <img decoding="async" width="2560" height="1440"
                                                            src="/images/wp/Single-4th_-scaled.webp"
                                                            class="attachment-full size-full" alt="single-view"
                                                            srcset="/images/wp/Single-4th_-scaled.webp 2560w, /images/wp/Single-4th_-300x169.webp 300w, /images/wp/Single-4th_-1024x576.webp 1024w, /images/wp/Single-4th_-768x432.webp 768w, /images/wp/Single-4th_-1536x864.webp 1536w, /images/wp/Single-4th_-2048x1152.webp 2048w, /images/wp/Single-4th_-808x454.webp 808w, /images/wp/Single-4th_-1600x900.webp 1600w"
                                                            sizes="(max-width: 2560px) 100vw, 2560px" />
                                                    </figure>
                                                </div>
- ->
                                            </div>
-->
                                        </div>
                                    </div>
                                </div>
                                <div class="block-rooms__item
						" data-main-tab="1">
                                    <button class="block-rooms__item-toggler" data-mobile-toggler>
                                        Family Counselling

                                        <span class="block-rooms__item-toggler-icon">
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                        </span>
                                    </button>

                                    <div class="block-rooms__item-main" data-mobile-content>
                                        <div class="block-rooms__item-subtabs">
                                            <div class="block-rooms__item-subtab
																					-active" data-variant-tab="0">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close
                                                        aria-label="Close gallery">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Family%20Counselling.webp" alt="family counselling" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>

                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">
                                                        Family Counselling </h3>

                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Family counselling focuses on improving communication, resolving conflicts, and strengthening relationships within the family. Many families experience misunderstandings, emotional distance, or ongoing tension that can affect daily life and overall well-being. You may notice frequent arguments, lack of understanding, or difficulty expressing feelings openly.</p>
                                                        <p>Through guided sessions, family members learn to listen better, express themselves clearly, and understand each other’s perspectives. It’s not about placing blame, but about creating a safe space where everyone feels heard and respected. Practical tools and structured conversations help reduce conflict and rebuild trust.</p>
                                                        <p>We support families in developing healthier patterns that improve connection and emotional balance. Over time, this can lead to stronger relationships, better communication, and a more supportive and harmonious home environment.</p>
                                                    </div>

                                                    <button class="block-rooms__item-description-toggler"
                                                        description-read-more description-toggle-text="Read more"
                                                        description-toggle-text-less="Read less">
                                                        Read more </button>

                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self
                                                                class="wp-block-button__link wp-element-button">
                                                                <span>
                                                                    Know more </span>
                                                            </a>
                                                        </div>

                                                    </footer>
                                                </div>

                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge">
                                                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated
                                                        </span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Family Counselling Experts</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Experienced counsellors who help families communicate better, resolve conflict, and heal together.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">20+</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Verified Doctors</span>
                                                            </div>
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">4.9★</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Avg. Rating</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Family+Counselling" class="block-rooms__item-specialist-btn">
                                                            Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                                        </a>
                                                    </div>
                                                </div>

                                                <!-- floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-1-0">
                                                    <button class="block-rooms__item-modal-close"
                                                        data-floorplan-modal-close aria-label="Close modal">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <figure class="block-rooms__item-modal-inner">
                                                        <img decoding="async" width="2560" height="1440"
                                                            src="/images/wp/Double-floor-plan_-scaled.webp"
                                                            class="attachment-full size-full" alt="double plan"
                                                            srcset="/images/wp/Double-floor-plan_-scaled.webp 2560w, /images/wp/Double-floor-plan_-300x169.webp 300w, /images/wp/Double-floor-plan_-1024x576.webp 1024w, /images/wp/Double-floor-plan_-768x432.webp 768w, /images/wp/Double-floor-plan_-1536x864.webp 1536w, /images/wp/Double-floor-plan_-2048x1152.webp 2048w, /images/wp/Double-floor-plan_-808x454.webp 808w, /images/wp/Double-floor-plan_-1600x900.webp 1600w"
                                                            sizes="(max-width: 2560px) 100vw, 2560px" />
                                                    </figure>
                                                </div>
-->
                                            </div>
                                            <!-- duplicate variant subtab commented out (only variant 0 renders)
<div class="block-rooms__item-subtab
										" data-variant-tab="1">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close
                                                        aria-label="Close gallery">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Family%20Counselling.webp" alt="family counselling" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>

                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">
                                                        Family Counselling </h3>

                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Family counselling focuses on improving communication, resolving conflicts, and strengthening relationships within the family. Many families experience misunderstandings, emotional distance, or ongoing tension that can affect daily life and overall well-being. You may notice frequent arguments, lack of understanding, or difficulty expressing feelings openly.</p>
                                                        <p>Through guided sessions, family members learn to listen better, express themselves clearly, and understand each other’s perspectives. It’s not about placing blame, but about creating a safe space where everyone feels heard and respected. Practical tools and structured conversations help reduce conflict and rebuild trust.</p>
                                                        <p>We support families in developing healthier patterns that improve connection and emotional balance. Over time, this can lead to stronger relationships, better communication, and a more supportive and harmonious home environment.</p>
                                                    </div>

                                                    <button class="block-rooms__item-description-toggler"
                                                        description-read-more description-toggle-text="Read more"
                                                        description-toggle-text-less="Read less">
                                                        Read more </button>

                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self
                                                                class="wp-block-button__link wp-element-button">
                                                                <span>
                                                                    Know more </span>
                                                            </a>
                                                        </div>

                                                    </footer>
                                                </div>

                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge">
                                                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated
                                                        </span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Family Counselling Experts</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Experienced counsellors who help families communicate better, resolve conflict, and heal together.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">20+</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Verified Doctors</span>
                                                            </div>
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">4.9★</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Avg. Rating</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Family+Counselling" class="block-rooms__item-specialist-btn">
                                                            Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                                        </a>
                                                    </div>
                                                </div>

                                                <!- - floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-1-1">
                                                    <button class="block-rooms__item-modal-close"
                                                        data-floorplan-modal-close aria-label="Close modal">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <figure class="block-rooms__item-modal-inner">
                                                        <img decoding="async" width="2560" height="1440"
                                                            src="/images/wp/Double-floor-plan_-scaled.webp"
                                                            class="attachment-full size-full" alt="double plan"
                                                            srcset="/images/wp/Double-floor-plan_-scaled.webp 2560w, /images/wp/Double-floor-plan_-300x169.webp 300w, /images/wp/Double-floor-plan_-1024x576.webp 1024w, /images/wp/Double-floor-plan_-768x432.webp 768w, /images/wp/Double-floor-plan_-1536x864.webp 1536w, /images/wp/Double-floor-plan_-2048x1152.webp 2048w, /images/wp/Double-floor-plan_-808x454.webp 808w, /images/wp/Double-floor-plan_-1600x900.webp 1600w"
                                                            sizes="(max-width: 2560px) 100vw, 2560px" />
                                                    </figure>
                                                </div>
- ->
                                            </div>
-->
                                            <!-- duplicate variant subtab commented out (only variant 0 renders)
<div class="block-rooms__item-subtab
										" data-variant-tab="2">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close
                                                        aria-label="Close gallery">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Family%20Counselling.webp" alt="family counselling" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>

                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">
                                                        Family Counselling </h3>

                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Family counselling focuses on improving communication, resolving conflicts, and strengthening relationships within the family. Many families experience misunderstandings, emotional distance, or ongoing tension that can affect daily life and overall well-being. You may notice frequent arguments, lack of understanding, or difficulty expressing feelings openly.</p>
                                                        <p>Through guided sessions, family members learn to listen better, express themselves clearly, and understand each other’s perspectives. It’s not about placing blame, but about creating a safe space where everyone feels heard and respected. Practical tools and structured conversations help reduce conflict and rebuild trust.</p>
                                                        <p>We support families in developing healthier patterns that improve connection and emotional balance. Over time, this can lead to stronger relationships, better communication, and a more supportive and harmonious home environment.</p>
                                                    </div>

                                                    <button class="block-rooms__item-description-toggler"
                                                        description-read-more description-toggle-text="Read more"
                                                        description-toggle-text-less="Read less">
                                                        Read more </button>

                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self
                                                                class="wp-block-button__link wp-element-button">
                                                                <span>
                                                                    Know more </span>
                                                            </a>
                                                        </div>

                                                    </footer>
                                                </div>

                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge">
                                                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated
                                                        </span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Family Counselling Experts</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Experienced counsellors who help families communicate better, resolve conflict, and heal together.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">20+</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Verified Doctors</span>
                                                            </div>
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">4.9★</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Avg. Rating</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Family+Counselling" class="block-rooms__item-specialist-btn">
                                                            Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                                        </a>
                                                    </div>
                                                </div>

                                                <!- - floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-1-2">
                                                    <button class="block-rooms__item-modal-close"
                                                        data-floorplan-modal-close aria-label="Close modal">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <figure class="block-rooms__item-modal-inner">
                                                        <img loading="lazy" decoding="async" width="2560" height="1440"
                                                            src="/images/wp/Double-4th_-scaled.webp"
                                                            class="attachment-full size-full" alt="double-view"
                                                            srcset="/images/wp/Double-4th_-scaled.webp 2560w, /images/wp/Double-4th_-300x169.webp 300w, /images/wp/Double-4th_-1024x576.webp 1024w, /images/wp/Double-4th_-768x432.webp 768w, /images/wp/Double-4th_-1536x864.webp 1536w, /images/wp/Double-4th_-2048x1152.webp 2048w, /images/wp/Double-4th_-808x454.webp 808w, /images/wp/Double-4th_-1600x900.webp 1600w"
                                                            sizes="auto, (max-width: 2560px) 100vw, 2560px" />
                                                    </figure>
                                                </div>
- ->
                                            </div>
-->
                                        </div>
                                    </div>
                                </div>
                                <div class="block-rooms__item
						" data-main-tab="2">
                                    <button class="block-rooms__item-toggler" data-mobile-toggler>
                                        Depression Care

                                        <span class="block-rooms__item-toggler-icon">
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                        </span>
                                    </button>

                                    <div class="block-rooms__item-main" data-mobile-content>
                                        <div class="block-rooms__item-subtabs">
                                            <div class="block-rooms__item-subtab
																					-active" data-variant-tab="0">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close
                                                        aria-label="Close gallery">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Depression%20Care.webp" alt="depression care" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>

                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">
                                                        Depression Care </h3>

                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Depression care focuses on helping you understand and manage persistent feelings of sadness, low energy, or loss of interest in daily life. You may find it hard to stay motivated, feel disconnected from others, or struggle with sleep, appetite, or concentration. These experiences can slowly affect your confidence, relationships, and overall sense of purpose.</p>
                                                        <p>With the right support, you can begin to understand what you’re feeling and why. It’s not about forcing positivity, but about creating a safe space to process emotions and take small, meaningful steps forward. Guided conversations and practical techniques help you rebuild routines, improve emotional awareness, and regain a sense of control.</p>
                                                        <p>We help you move at your own pace with consistent, compassionate care. Over time, this can improve your mood, restore energy, and help you reconnect with yourself and the things that matter to you.</p>
                                                    </div>

                                                    <button class="block-rooms__item-description-toggler"
                                                        description-read-more description-toggle-text="Read more"
                                                        description-toggle-text-less="Read less">
                                                        Read more </button>

                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self
                                                                class="wp-block-button__link wp-element-button">
                                                                <span>
                                                                    Know more </span>
                                                            </a>
                                                        </div>

                                                    </footer>
                                                </div>

                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge">
                                                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated
                                                        </span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Depression Care Specialists</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Compassionate experts providing structured support to help you rediscover motivation and joy.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">20+</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Verified Doctors</span>
                                                            </div>
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">4.9★</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Avg. Rating</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Depression+Care" class="block-rooms__item-specialist-btn">
                                                            Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                                        </a>
                                                    </div>
                                                </div>

                                                <!-- floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-2-0">
                                                    <button class="block-rooms__item-modal-close"
                                                        data-floorplan-modal-close aria-label="Close modal">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <figure class="block-rooms__item-modal-inner">
                                                        <img loading="lazy" decoding="async" width="2560" height="1440"
                                                            src="/images/wp/Twin-floor-plan_-scaled.webp"
                                                            class="attachment-full size-full" alt="floor plan"
                                                            srcset="/images/wp/Twin-floor-plan_-scaled.webp 2560w, /images/wp/Twin-floor-plan_-300x169.webp 300w, /images/wp/Twin-floor-plan_-1024x576.webp 1024w, /images/wp/Twin-floor-plan_-768x432.webp 768w, /images/wp/Twin-floor-plan_-1536x864.webp 1536w, /images/wp/Twin-floor-plan_-2048x1152.webp 2048w, /images/wp/Twin-floor-plan_-808x454.webp 808w, /images/wp/Twin-floor-plan_-1600x900.webp 1600w"
                                                            sizes="auto, (max-width: 2560px) 100vw, 2560px" />
                                                    </figure>
                                                </div>
-->
                                            </div>
                                            <!-- duplicate variant subtab commented out (only variant 0 renders)
<div class="block-rooms__item-subtab
										" data-variant-tab="1">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close
                                                        aria-label="Close gallery">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Depression%20Care.webp" alt="depression care" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>

                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">
                                                        Depression Care </h3>

                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Depression care focuses on helping you understand and manage persistent feelings of sadness, low energy, or loss of interest in daily life. You may find it hard to stay motivated, feel disconnected from others, or struggle with sleep, appetite, or concentration. These experiences can slowly affect your confidence, relationships, and overall sense of purpose.</p>
                                                        <p>With the right support, you can begin to understand what you’re feeling and why. It’s not about forcing positivity, but about creating a safe space to process emotions and take small, meaningful steps forward. Guided conversations and practical techniques help you rebuild routines, improve emotional awareness, and regain a sense of control.</p>
                                                        <p>We help you move at your own pace with consistent, compassionate care. Over time, this can improve your mood, restore energy, and help you reconnect with yourself and the things that matter to you.</p>
                                                    </div>

                                                    <button class="block-rooms__item-description-toggler"
                                                        description-read-more description-toggle-text="Read more"
                                                        description-toggle-text-less="Read less">
                                                        Read more </button>

                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self
                                                                class="wp-block-button__link wp-element-button">
                                                                <span>
                                                                    Know more </span>
                                                            </a>
                                                        </div>

                                                    </footer>
                                                </div>

                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge">
                                                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated
                                                        </span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Depression Care Specialists</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Compassionate experts providing structured support to help you rediscover motivation and joy.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">20+</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Verified Doctors</span>
                                                            </div>
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">4.9★</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Avg. Rating</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Depression+Care" class="block-rooms__item-specialist-btn">
                                                            Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                                        </a>
                                                    </div>
                                                </div>

                                                <!- - floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-2-1">
                                                    <button class="block-rooms__item-modal-close"
                                                        data-floorplan-modal-close aria-label="Close modal">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <figure class="block-rooms__item-modal-inner">
                                                        <img loading="lazy" decoding="async" width="2560" height="1440"
                                                            src="/images/wp/Twin-floor-plan_-scaled.webp"
                                                            class="attachment-full size-full" alt="floor plan"
                                                            srcset="/images/wp/Twin-floor-plan_-scaled.webp 2560w, /images/wp/Twin-floor-plan_-300x169.webp 300w, /images/wp/Twin-floor-plan_-1024x576.webp 1024w, /images/wp/Twin-floor-plan_-768x432.webp 768w, /images/wp/Twin-floor-plan_-1536x864.webp 1536w, /images/wp/Twin-floor-plan_-2048x1152.webp 2048w, /images/wp/Twin-floor-plan_-808x454.webp 808w, /images/wp/Twin-floor-plan_-1600x900.webp 1600w"
                                                            sizes="auto, (max-width: 2560px) 100vw, 2560px" />
                                                    </figure>
                                                </div>
- ->
                                            </div>
-->
                                        </div>
                                    </div>
                                </div>
                                <div class="block-rooms__item
						" data-main-tab="3">
                                    <button class="block-rooms__item-toggler" data-mobile-toggler>
                                        Anxiety Management

                                        <span class="block-rooms__item-toggler-icon">
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                        </span>
                                    </button>

                                    <div class="block-rooms__item-main" data-mobile-content>
                                        <div class="block-rooms__item-subtabs">
                                            <div class="block-rooms__item-subtab
																					-active" data-variant-tab="0">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close
                                                        aria-label="Close gallery">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Anxiety%20Management.webp" alt="anxiety management" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>

                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">
                                                        Anxiety Management </h3>

                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Anxiety management helps you understand and control constant worry, restlessness, and overwhelming thoughts that can interfere with daily life. You may experience a racing mind, difficulty relaxing, trouble sleeping, or physical symptoms like a fast heartbeat and tension. These feelings can make even simple tasks feel challenging.</p>
                                                        <p>With the right support, you learn how to identify triggers and manage your responses effectively. It’s not about eliminating anxiety completely, but about gaining control over how you react to it. Techniques like breathing exercises, grounding methods, and thought reframing help calm your mind and body.</p>
                                                        <p>We guide you in building practical habits that reduce stress and improve emotional balance. Over time, this helps you feel more confident, in control, and better equipped to handle everyday situations with clarity and ease.</p>
                                                    </div>

                                                    <button class="block-rooms__item-description-toggler"
                                                        description-read-more description-toggle-text="Read more"
                                                        description-toggle-text-less="Read less">
                                                        Read more </button>

                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self
                                                                class="wp-block-button__link wp-element-button">
                                                                <span>
                                                                    Know more </span>
                                                            </a>
                                                        </div>

                                                    </footer>
                                                </div>

                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge">
                                                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated
                                                        </span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Anxiety Management Experts</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Specialists trained to help you identify triggers and respond with calm and confidence.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">20+</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Verified Doctors</span>
                                                            </div>
                                                            <div class="block-rooms__item-specialist-stat">
                                                                <span class="block-rooms__item-specialist-stat-number">4.9★</span>
                                                                <span class="block-rooms__item-specialist-stat-label">Avg. Rating</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Anxiety+Management" class="block-rooms__item-specialist-btn">
                                                            Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                                        </a>
                                                    </div>
                                                </div>

                                                <!-- floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-3-0">
                                                    <button class="block-rooms__item-modal-close"
                                                        data-floorplan-modal-close aria-label="Close modal">
                                                        <span class="icon icon-icon-close"></span>
                                                    </button>

                                                    <figure class="block-rooms__item-modal-inner">
                                                        <img loading="lazy" decoding="async" width="2560" height="1440"
                                                            src="/images/wp/Single-Accessible-floor-plan_-scaled.webp"
                                                            class="attachment-full size-full"
                                                            alt="Single Accessible plan"
                                                            srcset="/images/wp/Single-Accessible-floor-plan_-scaled.webp 2560w, /images/wp/Single-Accessible-floor-plan_-300x169.webp 300w, /images/wp/Single-Accessible-floor-plan_-1024x576.webp 1024w, /images/wp/Single-Accessible-floor-plan_-768x432.webp 768w, /images/wp/Single-Accessible-floor-plan_-1536x864.webp 1536w, /images/wp/Single-Accessible-floor-plan_-2048x1152.webp 2048w, /images/wp/Single-Accessible-floor-plan_-808x454.webp 808w, /images/wp/Single-Accessible-floor-plan_-1600x900.webp 1600w"
                                                            sizes="auto, (max-width: 2560px) 100vw, 2560px" />
                                                    </figure>
                                                </div>
-->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="block-rooms__item" data-main-tab="4">
                                    <button class="block-rooms__item-toggler" data-mobile-toggler>
                                        OCD Therapy
                                        <span class="block-rooms__item-toggler-icon">
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                        </span>
                                    </button>
                                    <div class="block-rooms__item-main" data-mobile-content>
                                        <div class="block-rooms__item-subtabs">
                                            <div class="block-rooms__item-subtab -active" data-variant-tab="0">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close aria-label="Close gallery"><span class="icon icon-icon-close"></span></button>
                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/OCD%20Therapy.webp" alt="ocd therapy" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>
                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">OCD Therapy</h3>
                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>OCD (Obsessive-Compulsive Disorder) involves intrusive, recurring thoughts and repetitive behaviors that feel impossible to control. You may experience unwanted worries, rituals, or mental compulsions that interfere with your daily routine, relationships, and peace of mind. These patterns are often exhausting and distressing, even when you know the fears may not be rational.</p>
                                                        <p>Therapy for OCD focuses on helping you understand the cycle of obsessions and compulsions and gradually reduce their hold over you. Evidence-based approaches like Exposure and Response Prevention (ERP) and Cognitive Behavioral Therapy (CBT) help you face fears without acting on compulsions, breaking the cycle step by step.</p>
                                                        <p>We provide a safe, non-judgmental space where you can work through OCD with structured, compassionate support. Over time, you can regain control, reduce distress, and live a fuller life without being constantly driven by compulsions.</p>
                                                    </div>
                                                    <button class="block-rooms__item-description-toggler" description-read-more description-toggle-text="Read more" description-toggle-text-less="Read less">Read more</button>
                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self class="wp-block-button__link wp-element-button"><span>Know more</span></a>
                                                        </div>
                                                    </footer>
                                                </div>
                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge"><svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated</span>
                                                        <h4 class="block-rooms__item-specialist-header-title">OCD Therapy Specialists</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Expert therapists using evidence-based techniques to help you break free from the cycle of obsessive thoughts and compulsive behaviors.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">20+</span><span class="block-rooms__item-specialist-stat-label">Verified Doctors</span></div>
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">4.9★</span><span class="block-rooms__item-specialist-stat-label">Avg. Rating</span></div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=OCD+Therapy" class="block-rooms__item-specialist-btn">Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
                                                    </div>
                                                </div>
                                                <!-- floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-4-0">
                                                    <button class="block-rooms__item-modal-close" data-floorplan-modal-close aria-label="Close modal"><span class="icon icon-icon-close"></span></button>
                                                    <figure class="block-rooms__item-modal-inner"><img loading="lazy" src="/images/whatYouNeed/OCD%20Therapy.webp" alt="ocd therapy" /></figure>
                                                </div>
-->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="block-rooms__item" data-main-tab="5">
                                    <button class="block-rooms__item-toggler" data-mobile-toggler>
                                        Senior Care
                                        <span class="block-rooms__item-toggler-icon">
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                        </span>
                                    </button>
                                    <div class="block-rooms__item-main" data-mobile-content>
                                        <div class="block-rooms__item-subtabs">
                                            <div class="block-rooms__item-subtab -active" data-variant-tab="0">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close aria-label="Close gallery"><span class="icon icon-icon-close"></span></button>
                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Senior%20Care.webp" alt="senior care" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>
                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">Senior Care</h3>
                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Senior care focuses on the emotional, mental, and social well-being of older adults navigating the unique challenges of aging. You may experience feelings of loneliness, loss of independence, grief over changes in health or relationships, or anxiety about the future. These are real and deeply human experiences that deserve proper attention and support.</p>
                                                        <p>Our approach combines therapeutic support with compassionate listening to help seniors process emotions, build resilience, and maintain a sense of purpose and connection. Sessions are conducted at a comfortable pace with respect for individual needs and life history.</p>
                                                        <p>We help older adults and their families find balance and dignity at every stage of life. Whether addressing anxiety, life transitions, or simply the need to be heard, we provide thoughtful, personalized care.</p>
                                                    </div>
                                                    <button class="block-rooms__item-description-toggler" description-read-more description-toggle-text="Read more" description-toggle-text-less="Read less">Read more</button>
                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self class="wp-block-button__link wp-element-button"><span>Know more</span></a>
                                                        </div>
                                                    </footer>
                                                </div>
                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge"><svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated</span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Senior Care Specialists</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Compassionate professionals dedicated to supporting the emotional and mental well-being of older adults and their families.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">20+</span><span class="block-rooms__item-specialist-stat-label">Verified Doctors</span></div>
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">4.9★</span><span class="block-rooms__item-specialist-stat-label">Avg. Rating</span></div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Senior+Care" class="block-rooms__item-specialist-btn">Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
                                                    </div>
                                                </div>
                                                <!-- floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-5-0">
                                                    <button class="block-rooms__item-modal-close" data-floorplan-modal-close aria-label="Close modal"><span class="icon icon-icon-close"></span></button>
                                                    <figure class="block-rooms__item-modal-inner"><img loading="lazy" src="/images/whatYouNeed/Senior%20Care.webp" alt="senior care" /></figure>
                                                </div>
-->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="block-rooms__item" data-main-tab="6">
                                    <button class="block-rooms__item-toggler" data-mobile-toggler>
                                        Trauma Therapy
                                        <span class="block-rooms__item-toggler-icon">
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                        </span>
                                    </button>
                                    <div class="block-rooms__item-main" data-mobile-content>
                                        <div class="block-rooms__item-subtabs">
                                            <div class="block-rooms__item-subtab -active" data-variant-tab="0">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close aria-label="Close gallery"><span class="icon icon-icon-close"></span></button>
                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Trauma%20Therapy.webp" alt="trauma therapy" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>
                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">Trauma Therapy</h3>
                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Trauma therapy helps individuals heal from distressing experiences that have left a lasting impact on their mental and emotional health. You may be dealing with intrusive memories, nightmares, hypervigilance, emotional numbness, or difficulty trusting others. These responses are natural, but they can significantly affect your quality of life and relationships.</p>
                                                        <p>Trauma-focused therapy creates a safe and controlled environment to gently process painful experiences at your own pace. Approaches like EMDR, Trauma-Focused CBT, and somatic techniques help reduce the intensity of traumatic memories and restore a sense of safety and control.</p>
                                                        <p>We work with you to rebuild trust, develop coping strategies, and process what happened in a way that leads to genuine healing. Over time, you can move forward with greater resilience and a renewed sense of self.</p>
                                                    </div>
                                                    <button class="block-rooms__item-description-toggler" description-read-more description-toggle-text="Read more" description-toggle-text-less="Read less">Read more</button>
                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self class="wp-block-button__link wp-element-button"><span>Know more</span></a>
                                                        </div>
                                                    </footer>
                                                </div>
                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge"><svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated</span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Trauma Therapy Specialists</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Trained therapists helping survivors process and heal from trauma in a safe, structured, and compassionate environment.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">20+</span><span class="block-rooms__item-specialist-stat-label">Verified Doctors</span></div>
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">4.9★</span><span class="block-rooms__item-specialist-stat-label">Avg. Rating</span></div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Trauma+Therapy" class="block-rooms__item-specialist-btn">Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
                                                    </div>
                                                </div>
                                                <!-- floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-6-0">
                                                    <button class="block-rooms__item-modal-close" data-floorplan-modal-close aria-label="Close modal"><span class="icon icon-icon-close"></span></button>
                                                    <figure class="block-rooms__item-modal-inner"><img loading="lazy" src="/images/whatYouNeed/Trauma%20Therapy.webp" alt="trauma therapy" /></figure>
                                                </div>
-->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="block-rooms__item" data-main-tab="7">
                                    <button class="block-rooms__item-toggler" data-mobile-toggler>
                                        Grief Counselling
                                        <span class="block-rooms__item-toggler-icon">
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                        </span>
                                    </button>
                                    <div class="block-rooms__item-main" data-mobile-content>
                                        <div class="block-rooms__item-subtabs">
                                            <div class="block-rooms__item-subtab -active" data-variant-tab="0">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close aria-label="Close gallery"><span class="icon icon-icon-close"></span></button>
                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Grief%20Counselling.webp" alt="grief counselling" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>
                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">Grief Counselling</h3>
                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Grief counselling provides dedicated support for those experiencing loss — whether from the death of a loved one, the end of a relationship, a major life change, or any significant loss that has brought pain and confusion. Grief can manifest as sadness, anger, guilt, numbness, or physical symptoms that make everyday functioning difficult.</p>
                                                        <p>In counselling, you are given space to express your feelings honestly and at your own pace. A therapist guides you through the grieving process without rushing or judging, helping you understand your emotions and find a path forward that honors both your loss and your continued life.</p>
                                                        <p>We believe healing from grief does not mean forgetting — it means integrating the experience and gradually rediscovering meaning and connection. We are here to walk beside you through every stage of your journey.</p>
                                                    </div>
                                                    <button class="block-rooms__item-description-toggler" description-read-more description-toggle-text="Read more" description-toggle-text-less="Read less">Read more</button>
                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self class="wp-block-button__link wp-element-button"><span>Know more</span></a>
                                                        </div>
                                                    </footer>
                                                </div>
                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge"><svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated</span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Grief Counselling Experts</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Empathetic counsellors providing a safe space to process loss and guide you toward healing and renewed meaning in life.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">20+</span><span class="block-rooms__item-specialist-stat-label">Verified Doctors</span></div>
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">4.9★</span><span class="block-rooms__item-specialist-stat-label">Avg. Rating</span></div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Grief+Counselling" class="block-rooms__item-specialist-btn">Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
                                                    </div>
                                                </div>
                                                <!-- floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-7-0">
                                                    <button class="block-rooms__item-modal-close" data-floorplan-modal-close aria-label="Close modal"><span class="icon icon-icon-close"></span></button>
                                                    <figure class="block-rooms__item-modal-inner"><img loading="lazy" src="/images/whatYouNeed/Grief%20Counselling.webp" alt="grief counselling" /></figure>
                                                </div>
-->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="block-rooms__item" data-main-tab="8">
                                    <button class="block-rooms__item-toggler" data-mobile-toggler>
                                        Relationships
                                        <span class="block-rooms__item-toggler-icon">
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                        </span>
                                    </button>
                                    <div class="block-rooms__item-main" data-mobile-content>
                                        <div class="block-rooms__item-subtabs">
                                            <div class="block-rooms__item-subtab -active" data-variant-tab="0">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close aria-label="Close gallery"><span class="icon icon-icon-close"></span></button>
                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Relationships.webp" alt="relationships" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>
                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">Relationships</h3>
                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Relationship counselling helps individuals and couples navigate challenges in personal connections — whether with a partner, family member, friend, or colleague. You may be experiencing communication breakdowns, trust issues, recurring conflicts, emotional distance, or difficulty maintaining healthy boundaries.</p>
                                                        <p>Through guided sessions, you gain tools to communicate more clearly, understand your own emotional needs, and respond to others with greater empathy. Counselling is not about placing blame but about creating space for honest, productive conversations that lead to real change.</p>
                                                        <p>We support people in building healthier, more fulfilling relationships. Whether you are working through a specific conflict or looking to strengthen your connections overall, our specialists help you develop the skills and awareness needed for lasting relationship health.</p>
                                                    </div>
                                                    <button class="block-rooms__item-description-toggler" description-read-more description-toggle-text="Read more" description-toggle-text-less="Read less">Read more</button>
                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self class="wp-block-button__link wp-element-button"><span>Know more</span></a>
                                                        </div>
                                                    </footer>
                                                </div>
                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge"><svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated</span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Relationship Counselling Experts</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Specialists helping individuals and couples build healthier communication, rebuild trust, and strengthen their connections.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">20+</span><span class="block-rooms__item-specialist-stat-label">Verified Doctors</span></div>
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">4.9★</span><span class="block-rooms__item-specialist-stat-label">Avg. Rating</span></div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Relationships" class="block-rooms__item-specialist-btn">Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
                                                    </div>
                                                </div>
                                                <!-- floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-8-0">
                                                    <button class="block-rooms__item-modal-close" data-floorplan-modal-close aria-label="Close modal"><span class="icon icon-icon-close"></span></button>
                                                    <figure class="block-rooms__item-modal-inner"><img loading="lazy" src="/images/whatYouNeed/Relationships.webp" alt="relationships" /></figure>
                                                </div>
-->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="block-rooms__item" data-main-tab="9">
                                    <button class="block-rooms__item-toggler" data-mobile-toggler>
                                        Addiction Recovery
                                        <span class="block-rooms__item-toggler-icon">
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                        </span>
                                    </button>
                                    <div class="block-rooms__item-main" data-mobile-content>
                                        <div class="block-rooms__item-subtabs">
                                            <div class="block-rooms__item-subtab -active" data-variant-tab="0">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close aria-label="Close gallery"><span class="icon icon-icon-close"></span></button>
                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Addiction%20Recovery.webp" alt="addiction recovery" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>
                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">Addiction Recovery</h3>
                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Addiction recovery support helps individuals break free from dependency on substances or behaviors that are negatively impacting their lives. You may feel caught in a cycle that feels impossible to escape, experiencing cravings, shame, or repeated attempts to stop without lasting success. Addiction is a complex condition, not a moral failure, and it requires compassionate, structured support.</p>
                                                        <p>Our approach combines therapeutic counselling with personalized recovery strategies. We address both the behavioral patterns and the emotional drivers behind addiction — including stress, trauma, and underlying mental health conditions — to build a foundation for long-term recovery.</p>
                                                        <p>We provide judgment-free support that empowers you to reclaim your life. With guidance, evidence-based tools, and consistent care, you can develop resilience, rebuild relationships, and create a healthier, more fulfilling future.</p>
                                                    </div>
                                                    <button class="block-rooms__item-description-toggler" description-read-more description-toggle-text="Read more" description-toggle-text-less="Read less">Read more</button>
                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self class="wp-block-button__link wp-element-button"><span>Know more</span></a>
                                                        </div>
                                                    </footer>
                                                </div>
                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge"><svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated</span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Addiction Recovery Specialists</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Certified professionals providing compassionate, evidence-based support to help you build lasting recovery and reclaim your life.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">20+</span><span class="block-rooms__item-specialist-stat-label">Verified Doctors</span></div>
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">4.9★</span><span class="block-rooms__item-specialist-stat-label">Avg. Rating</span></div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Addiction+Recovery" class="block-rooms__item-specialist-btn">Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
                                                    </div>
                                                </div>
                                                <!-- floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-9-0">
                                                    <button class="block-rooms__item-modal-close" data-floorplan-modal-close aria-label="Close modal"><span class="icon icon-icon-close"></span></button>
                                                    <figure class="block-rooms__item-modal-inner"><img loading="lazy" src="/images/whatYouNeed/Addiction%20Recovery.webp" alt="addiction recovery" /></figure>
                                                </div>
-->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="block-rooms__item" data-main-tab="10">
                                    <button class="block-rooms__item-toggler" data-mobile-toggler>
                                        Career Guidance
                                        <span class="block-rooms__item-toggler-icon">
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                        </span>
                                    </button>
                                    <div class="block-rooms__item-main" data-mobile-content>
                                        <div class="block-rooms__item-subtabs">
                                            <div class="block-rooms__item-subtab -active" data-variant-tab="0">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close aria-label="Close gallery"><span class="icon icon-icon-close"></span></button>
                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Career%20Guidance.webp" alt="career guidance" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>
                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">Career Guidance</h3>
                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Career guidance helps you navigate professional challenges, transitions, and decisions with greater clarity and confidence. You may be feeling stuck in your current role, unsure of your direction, overwhelmed by workplace stress, or struggling with professional relationships. These feelings can affect your motivation, performance, and overall sense of purpose.</p>
                                                        <p>Through structured sessions, a career guidance specialist helps you identify your strengths, clarify your goals, and develop a realistic, personalized plan to move forward. Whether you are exploring new paths, recovering from burnout, or building key professional skills, support is tailored to your specific situation.</p>
                                                        <p>We help you reconnect with your professional purpose and take meaningful steps toward work that is satisfying, sustainable, and aligned with your values. You deserve a career that supports both your ambitions and your well-being.</p>
                                                    </div>
                                                    <button class="block-rooms__item-description-toggler" description-read-more description-toggle-text="Read more" description-toggle-text-less="Read less">Read more</button>
                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self class="wp-block-button__link wp-element-button"><span>Know more</span></a>
                                                        </div>
                                                    </footer>
                                                </div>
                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge"><svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated</span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Career Guidance Specialists</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Expert professionals helping you find clarity, overcome career challenges, and build a path aligned with your goals and well-being.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">20+</span><span class="block-rooms__item-specialist-stat-label">Verified Doctors</span></div>
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">4.9★</span><span class="block-rooms__item-specialist-stat-label">Avg. Rating</span></div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Career+Guidance" class="block-rooms__item-specialist-btn">Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
                                                    </div>
                                                </div>
                                                <!-- floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-10-0">
                                                    <button class="block-rooms__item-modal-close" data-floorplan-modal-close aria-label="Close modal"><span class="icon icon-icon-close"></span></button>
                                                    <figure class="block-rooms__item-modal-inner"><img loading="lazy" src="/images/whatYouNeed/Career%20Guidance.webp" alt="career guidance" /></figure>
                                                </div>
-->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="block-rooms__item" data-main-tab="11">
                                    <button class="block-rooms__item-toggler" data-mobile-toggler>
                                        Academic Stress
                                        <span class="block-rooms__item-toggler-icon">
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                            <span class="block-rooms__item-toggler-icon-line"></span>
                                        </span>
                                    </button>
                                    <div class="block-rooms__item-main" data-mobile-content>
                                        <div class="block-rooms__item-subtabs">
                                            <div class="block-rooms__item-subtab -active" data-variant-tab="0">
                                                <div class="block-rooms__item-gallery swiper" data-gallery-slider>
                                                    <button class="block-rooms__item-gallery-close" data-gallery-close aria-label="Close gallery"><span class="icon icon-icon-close"></span></button>
                                                    <div class="block-rooms__item-gallery-inner swiper-wrapper">
                                                        <figure class="block-rooms__item-gallery-item swiper-slide">
                                                            <img src="/images/whatYouNeed/Academic%20Stress.webp" alt="academic stress" loading="lazy" />
                                                        </figure>
                                                    </div>
                                                </div>
                                                <div class="block-rooms__item-subtab-main">
                                                    <h3 class="block-rooms__item-title">Academic Stress</h3>
                                                    <div class="block-rooms__item-description" description-content>
                                                        <p>Academic stress management supports students and learners in coping with the pressure of exams, deadlines, performance expectations, and the demands of academic life. You may be experiencing anxiety, difficulty concentrating, sleep problems, or a persistent feeling of being overwhelmed that is affecting both your studies and your personal life.</p>
                                                        <p>Guided support helps you identify the sources of your stress, develop effective study habits, and build the mental resilience needed to perform well without burning out. Practical techniques like time management, mindfulness, and cognitive reframing help transform overwhelming pressure into manageable challenges.</p>
                                                        <p>We believe academic success and emotional well-being go hand in hand. Our specialists help you feel more balanced, focused, and capable — so you can achieve your potential without compromising your mental health.</p>
                                                    </div>
                                                    <button class="block-rooms__item-description-toggler" description-read-more description-toggle-text="Read more" description-toggle-text-less="Read less">Read more</button>
                                                    <footer class="block-rooms__item-buttons -desktop">
                                                        <div class="block-rooms__item-button -apply">
                                                            <a href="#apply-now" target=_self class="wp-block-button__link wp-element-button"><span>Know more</span></a>
                                                        </div>
                                                    </footer>
                                                </div>
                                                <div class="block-rooms__item-specialist">
                                                    <div class="block-rooms__item-specialist-header">
                                                        <div class="block-rooms__item-specialist-icon-wrap">
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                                        </div>
                                                        <span class="block-rooms__item-specialist-badge"><svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/></svg> Top Rated</span>
                                                        <h4 class="block-rooms__item-specialist-header-title">Academic Stress Specialists</h4>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-body">
                                                        <p class="block-rooms__item-specialist-text">Experienced counsellors who help students manage pressure, build resilience, and find balance between achievement and well-being.</p>
                                                        <div class="block-rooms__item-specialist-stats">
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">20+</span><span class="block-rooms__item-specialist-stat-label">Verified Doctors</span></div>
                                                            <div class="block-rooms__item-specialist-stat"><span class="block-rooms__item-specialist-stat-number">4.9★</span><span class="block-rooms__item-specialist-stat-label">Avg. Rating</span></div>
                                                        </div>
                                                    </div>
                                                    <div class="block-rooms__item-specialist-footer">
                                                        <a href="/doctors?search=Academic+Stress" class="block-rooms__item-specialist-btn">Explore Doctors <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
                                                    </div>
                                                </div>
                                                <!-- floor-plan modal commented out (not rendered)
<div class="block-rooms__item-modal" data-floorplan-modal="subtab-11-0">
                                                    <button class="block-rooms__item-modal-close" data-floorplan-modal-close aria-label="Close modal"><span class="icon icon-icon-close"></span></button>
                                                    <figure class="block-rooms__item-modal-inner"><img loading="lazy" src="/images/whatYouNeed/Academic%20Stress.webp" alt="academic stress" /></figure>
                                                </div>
-->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="block-rooms__mobile-pagination">
                                <button class="block-rooms__mobile-pagination-arrow -prev" data-rooms-mobile-prev aria-label="Previous" disabled>
                                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 3l-5 5 5 5M13 8H3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="block-rooms__mobile-pagination-label" data-rooms-mobile-label>1 / 3</span>
                                <button class="block-rooms__mobile-pagination-arrow -next" data-rooms-mobile-next aria-label="Next">
                                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 13l5-5-5-5M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                            </div>
                        </div>
                </section>



                <div class="block-tiles-slider__slogan" data-slogan>
                    <div class="block-tiles-slider__slogan-inner" data-slogan-inner>
                        <div class="block-tiles-slider__slogan-item -shape -shape-1"></div>

                        <div class="block-tiles-slider__slogan-item -text">
                            You're not alone </div>

                        <div class="block-tiles-slider__slogan-item -image -image-1">
                            <img loading="lazy" decoding="async" width="300" height="300"
                                src="/images/decoration/slogan-photo-1-300x300.webp"
                                class="attachment-medium size-medium" alt="support"
                                srcset="/images/decoration/slogan-photo-1-300x300.webp 300w, /images/decoration/slogan-photo-1-150x150.webp 150w, /images/decoration/slogan-photo-1.webp 400w"
                                sizes="auto, (max-width: 300px) 100vw, 300px" />
                        </div>

                        <div class="block-tiles-slider__slogan-item -shape -shape-2"></div>

                        <div class="block-tiles-slider__slogan-item -text">
                            we're here </div>

                        <div class="block-tiles-slider__slogan-item -image -image-2">
                            <img loading="lazy" decoding="async" width="300" height="200"
                                src="/images/decoration/slogan-photo-2-300x200.webp"
                                class="attachment-medium size-medium" alt="care"
                                srcset="/images/decoration/slogan-photo-2-300x200.webp 300w, /images/decoration/slogan-photo-2.webp 600w"
                                sizes="auto, (max-width: 300px) 100vw, 300px" />
                        </div>

                        <div class="block-tiles-slider__slogan-item -text">
                            for you </div>

                    </div>
                </div>



                <section class="block-partners">
                    <div class="block-partners__container container">
                        <header class="section-header block-partners__header" data-section-header>
                            <span class="section-header__label" data-label>Trusted by</span>
                            <h2 class="section-header__heading" data-heading>Our Partners</h2>
                        </header>
                        <div class="block-partners__logos">
                            <div class="block-partners__logo-item">
                                <img src="/images/partners/Amity.webp" alt="Amity" loading="lazy" />
                            </div>
                            <div class="block-partners__logo-item">
                                <img src="/images/partners/Incubator.webp" alt="Incubator" loading="lazy" />
                            </div>
                        </div>
                    </div>
                </section>

                <section id="apply-now" class="block-apply -color-yellow">
                    <div class="block-apply__container">
                        <div class="block-apply__cols container">
                            <div class="block-apply__column -left">
                                <div class="block-apply__column-inner">
                                    <header class="section-header block-apply__header" data-section-header>
                                        <span class="section-header__label" data-label>
                                            Get in touch </span>
                                        <h2 class="section-header__heading" data-heading>
                                            We're here for you </h2>
                                    </header>

                                    <figure class="block-apply__photo">
                                        <img loading="lazy" decoding="async"
                                            src="/images/sections/joinus.webp"
                                            class="attachment-full size-full" alt="join us" />
                                    </figure>
                                </div>
                            </div>

                            <div class="block-apply__column -right">
                                <p class="block-apply__description">
                                    Have questions about our services, or just want to talk? We'd love to hear from you.
                                    Send us a message and our team will get back to you within 24 hours. No judgment — just genuine support.</p>

                                <div class="block-apply__form" data-form>
                                    <form class="wpcf7-form" novalidate="novalidate" data-status="init" id="contact-form" autocomplete="on">
                                        <!-- Honeypot — visually hidden, off-screen, not focusable. Bots fill it; humans don't. -->
                                        <div aria-hidden="true" style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;">
                                            <label>Website<input type="text" name="_website" id="contact-website" tabindex="-1" autocomplete="off" /></label>
                                        </div>
                                        <div class="form__row -two-cols">
                                            <div class="form__field">
                                                <p><span class="form__label">Name*</span></p>
                                                <div class="form__input">
                                                    <input maxlength="100"
                                                        class="wpcf7-form-control wpcf7-text wpcf7-validates-as-required"
                                                        aria-required="true" autocomplete="name"
                                                        placeholder="Your name" type="text"
                                                        name="name" id="contact-name" />
                                                </div>
                                            </div>
                                            <div class="form__field">
                                                <p><span class="form__label">Email*</span></p>
                                                <div class="form__input">
                                                    <input maxlength="200"
                                                        class="wpcf7-form-control wpcf7-email wpcf7-validates-as-required"
                                                        aria-required="true"
                                                        placeholder="Your email" type="email"
                                                        name="email" id="contact-email" />
                                                </div>
                                            </div>
                                        </div>
                                        <div class="form__row -two-cols">
                                            <div class="form__field">
                                                <p><span class="form__label">Phone <span style="opacity:0.6;font-weight:400">(optional)</span></span></p>
                                                <div class="form__input">
                                                    <input maxlength="20"
                                                        class="wpcf7-form-control wpcf7-tel"
                                                        placeholder="+91 XXXXX XXXXX" type="tel"
                                                        name="phone" id="contact-phone" />
                                                </div>
                                            </div>
                                            <div class="form__field">
                                                <p><span class="form__label">How can we help?*</span></p>
                                                <div class="form__input">
                                                    <select class="wpcf7-form-control wpcf7-select"
                                                        aria-required="true" name="subject" id="contact-subject">
                                                        <option value="">Select a topic</option>
                                                        <option value="Book a session">Book a session</option>
                                                        <option value="General inquiry">General inquiry</option>
                                                        <option value="Workshop or program">Workshop or program</option>
                                                        <option value="NGO / Partnership">NGO / Partnership</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="form__row -two-cols">
                                            <div class="form__field">
                                                <p><span class="form__label">Age group</span></p>
                                                <div class="form__input">
                                                    <select class="wpcf7-form-control wpcf7-select"
                                                        name="age_group" id="contact-age">
                                                        <option value="">Prefer not to say</option>
                                                        <option value="Under 18">Under 18</option>
                                                        <option value="18–25">18–25</option>
                                                        <option value="26–35">26–35</option>
                                                        <option value="36–50">36–50</option>
                                                        <option value="50+">50+</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form__field">
                                                <p><span class="form__label">Preferred mode of support</span></p>
                                                <div class="form__input">
                                                    <select class="wpcf7-form-control wpcf7-select"
                                                        name="support_mode" id="contact-mode" disabled>
                                                        <option value="">No preference</option>
                                                        <option value="Online session">Online session</option>
                                                        <option value="In-person">In-person</option>
                                                        <option value="Either works">Either works</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="form__row -two-cols">
                                            <div class="form__field">
                                                <p><span class="form__label">First time seeking help?</span></p>
                                                <div class="form__input">
                                                    <select class="wpcf7-form-control wpcf7-select"
                                                        name="first_time" id="contact-firsttime">
                                                        <option value="">Prefer not to say</option>
                                                        <option value="Yes, first time">Yes, first time</option>
                                                        <option value="No, I have been before">No, I have been before</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form__field">
                                                <p><span class="form__label">How did you hear about us?</span></p>
                                                <div class="form__input">
                                                    <select class="wpcf7-form-control wpcf7-select"
                                                        name="heard_from" id="contact-source">
                                                        <option value="">Select</option>
                                                        <option value="Social media">Social media</option>
                                                        <option value="Friend or family">Friend or family</option>
                                                        <option value="Search engine">Search engine</option>
                                                        <option value="Healthcare provider">Healthcare provider</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="form__row">
                                            <div class="form__field">
                                                <p><span class="form__label">Message*</span></p>
                                                <div class="form__input">
                                                    <textarea cols="40" rows="6" maxlength="2000"
                                                        class="wpcf7-form-control wpcf7-textarea"
                                                        aria-required="true"
                                                        placeholder="Tell us what's on your mind..."
                                                        name="message" id="contact-message"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="form__row">
                                            <div class="form__field">
                                                <div class="form__input -acceptance">
                                                    <label><input type="checkbox" name="privacy" id="contact-privacy" value="1" />
                                                        <span class="wpcf7-list-item-label"> Your information is handled with care and used only to respond to your message. See our <a href="/privacy-policy">Privacy Policy</a>.</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="wpcf7-response-output" aria-hidden="true" id="contact-response"></div>
                                        <div class="form__row -submit">
                                            <input class="wpcf7-form-control wpcf7-submit has-spinner"
                                                type="submit" value="Send Message" id="contact-submit" />
                                        </div>
                                        <p style="font-size:0.75rem;opacity:0.55;margin-top:0.75rem;">
                                            This site is protected by reCAPTCHA and the Google
                                            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;">Privacy Policy</a>
                                            and
                                            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;">Terms of Service</a>
                                            apply.
                                        </p>
                                    </form>
                                </div>

                                <div class="block-apply__thanks-message" data-thanks-message>
                                    <h2>Thanks for reaching out!</h2>
                                    <p>We've got your message and will be in touch within 24 hours. You're not alone — we're here.</p>
                                </div>
                            </div>
                        </div>

                        <div class="block-apply__banner-wrapper">
                            <div class="banner block-apply__banner -background-light -variant-default">
                                <div class="banner__inner">
                                    <div class="banner__content">
                                        <h2 class="banner__heading">
                                            Need immediate support? </h2>
                                        <p class="banner__description">
                                            If you're going through something difficult right now, our team is just a message away.
                                            You can also browse our doctors and book a session at your own pace — no pressure, no rush.</p>
                                    </div>
                                    <div class="banner__photo -mask-default -variant-default">
                                        <img loading="lazy" decoding="async"
                                            src="/images/sections/Stillhavequestions.webp"
                                            class="attachment-full size-full" alt="still have questions" />
                                    </div>
                                </div>
                            </div>
                            <span class="block-apply__banner-shape -shape-1" data-animate-shape></span>
                            <span class="block-apply__banner-shape -shape-2" data-animate-shape></span>
                            <span class="block-apply__banner-shape -shape-3" data-animate-shape></span>
                        </div>
                    </div>
                </section>

                <footer class="block-footer">
                    <div class="block-footer__container container">

                        <!-- Top grid -->
                        <div class="block-footer__top">

                            <!-- Brand -->
                            <div class="block-footer__brand">
                                <div class="block-footer__brand-identity">
                                    <img src="/images/icons/Logo.webp" alt="Mindset logo" class="block-footer__brand-logo">
                                    <span class="block-footer__brand-wordmark">Mindset</span>
                                </div>
                                <p class="block-footer__brand-tagline">Making mental health support accessible, affordable, and stigma-free for everyone.</p>
                                <div class="block-footer__social">
                                    <a href="mailto:mindset.org.connect@gmail.com" class="block-footer__social-link" aria-label="Email">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                                    </a>
                                    <a href="https://www.linkedin.com/company/mindsetbymuskan" class="block-footer__social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                                    </a>
                                    <a href="https://www.instagram.com/mindset.org.in" class="block-footer__social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                                    </a>
                                    <a href="https://www.youtube.com/@Mindset_By_Muskan?sub_confirmation=1" class="block-footer__social-link" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75,15.02 15.5,12 9.75,8.98"/></svg>
                                    </a>
                                    <a href="https://chat.whatsapp.com/EahWvy2Mojm6s3gnK9SGP5" class="block-footer__social-link" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                    </a>
                                    <a href="https://www.reddit.com/u/Desperate-War-7820" class="block-footer__social-link" aria-label="Reddit" target="_blank" rel="noopener noreferrer">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                                    </a>
                                </div>
                            </div>

                            <!-- Explore -->
                            <div class="block-footer__col">
                                <h3 class="block-footer__col-title">Explore</h3>
                                <ul class="block-footer__col-list">
                                    <li><a href="/team">Our Team</a></li>
                                    <li><a href="/doctors">Doctors</a></li>
                                    <li><a href="/products">Products</a></li>
                                    <li><a href="/study-materials">Study Materials</a></li>
                                    <li><a href="/workshops">Workshops</a></li>
                                    <li><a href="#apply-now">Contact</a></li>
                                </ul>
                            </div>

                            <!-- Get in touch -->
                            <div class="block-footer__col">
                                <h3 class="block-footer__col-title">Get in touch</h3>
                                <a href="mailto:mindset.org.connect@gmail.com" class="block-footer__contact-email">mindset.org.connect@gmail.com</a>
                                <a href="#apply-now" class="block-footer__contact-cta">
                                    Send a message
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </a>
                                <p class="block-footer__contact-note">We reply within 24 hours. No judgment — just genuine support.</p>
                            </div>

                            <button class="block-footer__up-button" aria-label="Scroll to top" data-scroll-to-top>↑</button>
                        </div>

                        <!-- Big decorative wordmark -->
                        <div class="block-footer__middle">
                            <div class="block-footer__logo">
                                <span class="block-footer__logo-text"><span class="fl" style="--fl-y:-0.06em;--fl-r:-3deg">M</span><span class="fl" style="--fl-y:0.08em;--fl-r:2deg">i</span><span class="fl" style="--fl-y:-0.04em;--fl-r:-1deg">n</span><span class="fl" style="--fl-y:0.07em;--fl-r:3deg">d</span><span class="fl" style="--fl-y:-0.09em;--fl-r:-2deg">s</span><span class="fl" style="--fl-y:0.05em;--fl-r:1deg">e</span><span class="fl" style="--fl-y:-0.03em;--fl-r:-2deg">t</span><span class="fl fl--dot" style="--fl-y:0.12em;--fl-r:0deg">.</span><span class="fl" style="--fl-y:-0.07em;--fl-r:2deg">o</span><span class="fl" style="--fl-y:0.06em;--fl-r:-3deg">r</span><span class="fl" style="--fl-y:-0.05em;--fl-r:1deg">g</span><span class="fl fl--dot" style="--fl-y:0.1em;--fl-r:0deg">.</span><span class="fl" style="--fl-y:-0.08em;--fl-r:-2deg">i</span><span class="fl" style="--fl-y:0.04em;--fl-r:3deg">n</span></span>
                            </div>
                        </div>

                        <!-- Bottom bar -->
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

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const executeRecaptchaRef = useRef(executeRecaptcha);
  executeRecaptchaRef.current = executeRecaptcha;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // ---- GSAP + LENIS UNIFIED SCROLL ----
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis();

    // Connect Lenis scroll to ScrollTrigger updates
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker (single animation loop)
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    let resizeHandler: (() => void) | null = null;
    let wordAnimDestroyed = false;

    function initAll() {

      // ---- WORD ANIMATION ----
      const wordsWrapper = container.querySelector<HTMLElement>("[data-words-wrapper]");
      if (wordsWrapper) {
        const config = JSON.parse(wordsWrapper.getAttribute("data-animation-config") || "{}");
        const allWords: { word: string }[] = JSON.parse(wordsWrapper.getAttribute("data-words-wrapper") || "[]");
        const isMobile = window.innerWidth < 768;
        const words = isMobile
          ? allWords.map((w) => {
              const stripped = w.word.replace(/^Clinical\s+/i, "");
              return { word: stripped.charAt(0).toUpperCase() + stripped.slice(1) };
            })
          : allWords;
        const speed = config.speed || 75;
        const wDelay = config.delay || 500;
        const wordDisplayTime = config.wordDisplayTime || 1500;
        let currentIndex = 0;

        function typeWord(word: string, cb: () => void) {
          let i = 0;
          wordsWrapper!.textContent = "";
          const interval = setInterval(() => {
            if (wordAnimDestroyed) { clearInterval(interval); return; }
            wordsWrapper!.textContent += word[i];
            i++;
            if (i >= word.length) {
              clearInterval(interval);
              setTimeout(() => { if (!wordAnimDestroyed) cb(); }, wordDisplayTime);
            }
          }, speed);
        }
        function deleteWord(cb: () => void) {
          const text = wordsWrapper!.textContent || "";
          let i = text.length;
          const interval = setInterval(() => {
            if (wordAnimDestroyed) { clearInterval(interval); return; }
            wordsWrapper!.textContent = text.substring(0, i - 1);
            i--;
            if (i <= 0) {
              clearInterval(interval);
              setTimeout(() => { if (!wordAnimDestroyed) cb(); }, wDelay);
            }
          }, speed / 2);
        }
        function cycle() {
          if (wordAnimDestroyed) return;
          typeWord(words[currentIndex].word, () => {
            deleteWord(() => { currentIndex = (currentIndex + 1) % words.length; cycle(); });
          });
        }
        setTimeout(() => { if (!wordAnimDestroyed) cycle(); }, wDelay);
      }

      // ---- SWIPER INIT ----
      // Swiper imported via npm

      // Subnav slider
      container
        .querySelectorAll<HTMLElement>(".block-subnav__slider[data-slider]")
        .forEach((el) => {
          new Swiper(el, {
            slidesPerView: "auto",
            freeMode: true,
          });
        });

      // ---- SUBNAV ACTIVE STATE ON SCROLL ----
      {
        const anchorLinks = Array.from(
          container.querySelectorAll<HTMLAnchorElement>("[data-anchor-item]")
        );
        const sectionIds = anchorLinks.map((a) => a.getAttribute("href")?.replace("#", "") ?? "");
        const sections = sectionIds
          .map((id) => document.getElementById(id))
          .filter(Boolean) as HTMLElement[];

        const visibleSections = new Set<string>();

        const setActive = () => {
          // Pick the section closest to top of viewport among currently visible ones
          let best: string | null = null;
          let bestTop = Infinity;
          sections.forEach((s) => {
            if (visibleSections.has(s.id)) {
              const top = Math.abs(s.getBoundingClientRect().top);
              if (top < bestTop) { bestTop = top; best = s.id; }
            }
          });
          anchorLinks.forEach((a) => {
            const item = a.closest(".block-subnav__item");
            if (!item) return;
            item.classList.toggle("-active", best !== null && a.getAttribute("href") === `#${best}`);
          });
        };

        if (sections.length > 0) {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((e) => {
                if (e.isIntersecting) visibleSections.add(e.target.id);
                else visibleSections.delete(e.target.id);
              });
              setActive();
            },
            { rootMargin: "-10% 0px -50% 0px", threshold: 0 }
          );
          sections.forEach((s) => observer.observe(s));
        }
      }

      // Room gallery sliders
      container
        .querySelectorAll<HTMLElement>(".block-rooms__item-gallery[data-gallery-slider]")
        .forEach((el) => {
          new Swiper(el, {
            slidesPerView: 1,
            pagination: {
              el: el.querySelector<HTMLElement>("[data-pagination]"),
              clickable: true,
            },
            navigation: {
              prevEl: el.querySelector<HTMLElement>("[data-prev]"),
              nextEl: el.querySelector<HTMLElement>("[data-next]"),
            },
          });
        });


      // ---- ROOM TABS ----

      // Main room tab togglers (Single/Double/Twin/Accessible)
    container
      ?.querySelectorAll<HTMLElement>("[data-main-tab-toggler]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = btn.getAttribute("data-main-tab-toggler");
          // Deactivate all nav buttons
          container
            .querySelectorAll<HTMLElement>("[data-main-tab-toggler]")
            .forEach((b) => b.classList.remove("-active"));
          btn.classList.add("-active");
          // Show/hide room tabs
          container
            .querySelectorAll<HTMLElement>("[data-main-tab]")
            .forEach((tab) => {
              tab.classList.toggle(
                "-active",
                tab.getAttribute("data-main-tab") === idx
              );
            });
        });
      });

    // Mobile room togglers (only within .block-rooms__main to avoid conflicting with header burger)
    container
      ?.querySelectorAll<HTMLElement>(".block-rooms__main [data-mobile-toggler]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = btn.closest<HTMLElement>(".block-rooms__item");
          if (!item) return;
          const isActive = item.classList.contains("-active");
          // Close all items and deactivate all togglers
          container
            .querySelectorAll<HTMLElement>(".block-rooms__item")
            .forEach((el) => el.classList.remove("-active"));
          container
            .querySelectorAll<HTMLElement>(".block-rooms__main [data-mobile-toggler]")
            .forEach((el) => el.classList.remove("-active"));
          // Toggle the clicked one
          if (!isActive) {
            item.classList.add("-active");
            btn.classList.add("-active");
          }
        });
      });


    // Variant tab togglers (floor selection)
    container
      ?.querySelectorAll<HTMLElement>("[data-variant-tab-toggler]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = btn.getAttribute("data-variant-tab-toggler");
          const roomItem = btn.closest(".block-rooms__item");
          if (!roomItem) return;
          // Deactivate all variant buttons in this room
          roomItem
            .querySelectorAll<HTMLElement>("[data-variant-tab-toggler]")
            .forEach((b) => b.classList.remove("-active"));
          btn.classList.add("-active");
          // Show/hide variant tabs
          roomItem
            .querySelectorAll<HTMLElement>("[data-variant-tab]")
            .forEach((tab) => {
              tab.classList.toggle(
                "-active",
                tab.getAttribute("data-variant-tab") === idx
              );
            });
        });
      });

    // Description read more togglers
    container
      ?.querySelectorAll<HTMLElement>("[description-read-more]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const desc = btn
            .closest(".block-rooms__item-subtab-main")
            ?.querySelector<HTMLElement>("[description-content]");
          if (!desc) return;
          const isExpanded = desc.classList.toggle("-active");
          btn.textContent = isExpanded
            ? btn.getAttribute("description-toggle-text-less") || "Read less"
            : btn.getAttribute("description-toggle-text") || "Read more";
        });
      });

    // Features load more togglers
    container
      ?.querySelectorAll<HTMLElement>("[data-features-toggler]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const list = btn
            .closest(".block-rooms__item-aside")
            ?.querySelector<HTMLElement>("[data-features]");
          if (!list) return;
          const isExpanded = list.classList.toggle("-expanded");
          btn.textContent = isExpanded
            ? btn.getAttribute("features-toggle-text-less") || "Load less"
            : btn.getAttribute("features-toggle-text") || "Load more";
        });
      });

    // Floor plan modal — commented out: modals never render (no toggler buttons in DOM)
    // container
    //   ?.querySelectorAll<HTMLElement>("[data-floorplan-modal-toggler]")
    //   .forEach((btn) => {
    //     btn.addEventListener("click", () => {
    //       const modalId = btn.getAttribute("data-floorplan-modal-toggler");
    //       const modal = container.querySelector<HTMLElement>(
    //         `[data-floorplan-modal="${modalId}"]`
    //       );
    //       modal?.classList.add("-active");
    //     });
    //   });
    //
    // container
    //   ?.querySelectorAll<HTMLElement>("[data-floorplan-modal-close]")
    //   .forEach((btn) => {
    //     btn.addEventListener("click", () => {
    //       btn.closest<HTMLElement>(".block-rooms__item-modal")?.classList.remove("-active");
    //     });
    //   });

    // Services accordion — commented out per request (keep only heading animation in this section)
    // const servicesItems = container.querySelectorAll<HTMLElement>("[data-services-item]");
    // servicesItems.forEach((item) => {
    //   const toggler = item.querySelector<HTMLElement>("[data-services-toggler]");
    //   const content = item.querySelector<HTMLElement>("[data-services-content]");
    //   if (!toggler || !content) return;
    //   toggler.addEventListener("click", () => {
    //     const wasActive = item.classList.contains("-active");
    //     servicesItems.forEach((el) => {
    //       el.classList.remove("-active");
    //       const c = el.querySelector<HTMLElement>("[data-services-content]");
    //       if (c) c.setAttribute("aria-hidden", "true");
    //     });
    //     if (wasActive) {
    //       const nextIdx = (Array.from(servicesItems).indexOf(item) + 1) % servicesItems.length;
    //       const next = servicesItems[nextIdx];
    //       const nextContent = next.querySelector<HTMLElement>("[data-services-content]");
    //       next.classList.add("-active");
    //       if (nextContent) nextContent.setAttribute("aria-hidden", "false");
    //     } else {
    //       item.classList.add("-active");
    //       content.setAttribute("aria-hidden", "false");
    //     }
    //   });
    // });


      // ---- SLOGAN SCROLL ANIMATION ----
      const sloganEl = container.querySelector<HTMLElement>("[data-slogan]");
      if (sloganEl) {
        const inner = sloganEl.querySelector<HTMLElement>("[data-slogan-inner]");
        if (inner) {
          const html = inner.innerHTML;
          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.style.alignItems = "center";
          wrapper.style.gap = "1.75rem";
          wrapper.style.width = "max-content";
          const copy1 = document.createElement("div");
          copy1.innerHTML = html;
          copy1.style.display = "flex";
          copy1.style.alignItems = "center";
          copy1.style.gap = "1.75rem";
          copy1.style.flexShrink = "0";
          const copy2 = document.createElement("div");
          copy2.innerHTML = html;
          copy2.style.display = "flex";
          copy2.style.alignItems = "center";
          copy2.style.gap = "1.75rem";
          copy2.style.flexShrink = "0";
          inner.innerHTML = "";
          inner.appendChild(wrapper);
          wrapper.appendChild(copy1);
          wrapper.appendChild(copy2);
          const w = copy1.offsetWidth + 28;
          wrapper.style.animation = "sloganScroll 20s linear infinite";
          const style = document.createElement("style");
          style.textContent = `@keyframes sloganScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-${w}px); } }`;
          document.head.appendChild(style);
        }
      }

      // ---- GSAP SCROLL ANIMATIONS ----
      const g = gsap;
      const ST = ScrollTrigger;

      // Add class so CSS initial states kick in right before GSAP takes over
      container.classList.add("gsap-ready");

      // ---- HERO IMAGE CINEMATIC REVEAL ----
      const heroImgWrap = container.querySelector<HTMLElement>(".block-hero__image");
      const heroImg = heroImgWrap?.querySelector<HTMLElement>("img");
      if (heroImgWrap && heroImg) {
        // Set initial state — small rounded pill in center
        g.set(heroImgWrap, {
          clipPath: "inset(12% 20% 12% 20% round 2rem)",
          opacity: 0,
        });
        g.set(heroImg, {
          scale: 1.3,
          filter: "blur(8px) brightness(1.1)",
        });

        const heroTl = g.timeline({ delay: 0.3 });

        // Phase 1: fade in + begin expanding the clip
        heroTl.to(heroImgWrap, {
          opacity: 1,
          clipPath: "inset(4% 6% 4% 6% round 1.5rem)",
          duration: 0.7,
          ease: "power2.out",
        });

        // Phase 1 (overlap): unblur + scale down toward normal
        heroTl.to(heroImg, {
          scale: 1.1,
          filter: "blur(2px) brightness(1.05)",
          duration: 0.7,
          ease: "power2.out",
        }, "<");

        // Phase 2: expand to full frame with elastic overshoot
        heroTl.to(heroImgWrap, {
          clipPath: "inset(0% 0% 0% 0% round 1rem)",
          duration: 0.9,
          ease: "back.out(1.4)",
        });

        // Phase 2 (overlap): image settles to natural scale
        heroTl.to(heroImg, {
          scale: 1,
          filter: "blur(0px) brightness(1)",
          duration: 0.9,
          ease: "power3.out",
        }, "<");
      }

      // [data-split-item] — animate on scroll (fade up, no char splitting)
      container.querySelectorAll<HTMLElement>("[data-split-item]").forEach((el) => {
        g.fromTo(el,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
            scrollTrigger: el.closest(".block-hero")
              ? undefined
              : { trigger: el, start: "top 85%", toggleActions: "play none none none" },
          }
        );
      });

      // Hero description — hidden at top, appears on scroll, hides only when back at very top
      const heroDesc = container.querySelector<HTMLElement>(".block-hero__description");
      if (heroDesc) {
        const heroTl = g.timeline({ paused: true });
        heroTl.fromTo(heroDesc, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });

        ST.create({
          trigger: container.querySelector(".block-hero"),
          start: "1px top",
          onUpdate: (self: any) => {
            if (self.direction === 1 && heroTl.progress() === 0) {
              heroTl.play();
            }
          },
          onLeaveBack: () => {
            heroTl.reverse();
          },
        });
      }

      // [data-animate-item] — fade up on scroll (skip hero description, handled above)
      container.querySelectorAll<HTMLElement>("[data-animate-item]").forEach((el) => {
        if (el.classList.contains("block-hero__description")) return;
        g.fromTo(el,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" } }
        );
      });

      // Section headers
      container.querySelectorAll<HTMLElement>("[data-section-header]").forEach((header) => {
        const label = header.querySelector("[data-label]");
        const heading = header.querySelector("[data-heading]");
        if (label) {
          g.fromTo(label, { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power2.out",
              scrollTrigger: { trigger: header, start: "top 85%", toggleActions: "play none none none" } });
        }
        if (heading) {
          g.fromTo(heading, { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.7, delay: 0.15, ease: "power2.out",
              scrollTrigger: { trigger: header, start: "top 85%", toggleActions: "play none none none" } });
        }
      });

      // Slogan shapes/images scale-in
      container.querySelectorAll<HTMLElement>(".block-slogan__item-image, .block-slogan__item-shape").forEach((el) => {
        g.fromTo(el, { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" } });
      });

      // ---- APPLY SECTION ANIMATIONS ----
      // Animate shapes (scale in)
      container.querySelectorAll<HTMLElement>("[data-animate-shape]").forEach((el) => {
        g.fromTo(el, { scale: 0 }, {
          duration: 0.5, scale: 1, delay: 0.5,
          scrollTrigger: { trigger: el.parentElement, start: "top center", end: "bottom center", toggleActions: "play none none reverse" },
        });
      });

      // Photo labels parallax
      container.querySelectorAll<HTMLElement>("[data-animate-label]").forEach((el) => {
        const factor = 0.2 + 0.6 * Math.random();
        g.to(el, {
          y: () => -120 * factor,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top center", end: "bottom center", scrub: true },
        });
      });

      // Scroll to top button
      const scrollTopBtn = container.querySelector<HTMLElement>("[data-scroll-to-top]");
      if (scrollTopBtn) {
        scrollTopBtn.addEventListener("click", () => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }

      // ---- CONTACT FORM SUBMISSION ----
      {
        const contactForm = container.querySelector<HTMLFormElement>("#contact-form");
        const formWrapper = container.querySelector<HTMLElement>("[data-form]");
        const thanksMsg = container.querySelector<HTMLElement>("[data-thanks-message]");
        const responseEl = container.querySelector<HTMLElement>("#contact-response");
        const submitBtn = container.querySelector<HTMLInputElement>("#contact-submit");
        const formMountedAt = Date.now();
        const MIN_FILL_TIME_MS = 2500;

        contactForm?.addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!submitBtn) return;

          // Honeypot — bots fill this, humans never see it
          const honey = (container.querySelector<HTMLInputElement>("#contact-website"))?.value.trim() ?? "";
          if (honey !== "") {
            // Pretend success; do not call API
            formWrapper?.classList.add("-hidden");
            thanksMsg?.classList.add("-active");
            return;
          }

          const elapsed = Date.now() - formMountedAt;
          if (elapsed < MIN_FILL_TIME_MS) {
            if (responseEl) { responseEl.textContent = "Please take a moment to fill in the form before submitting."; responseEl.style.display = "block"; responseEl.className = "wpcf7-response-output -error"; }
            return;
          }

          const name = ((container.querySelector<HTMLInputElement>("#contact-name"))?.value ?? "").trim().slice(0, 100);
          const email = ((container.querySelector<HTMLInputElement>("#contact-email"))?.value ?? "").trim().slice(0, 200);
          const phone = ((container.querySelector<HTMLInputElement>("#contact-phone"))?.value ?? "").trim().slice(0, 20);
          const subject = ((container.querySelector<HTMLSelectElement>("#contact-subject"))?.value ?? "").slice(0, 100);
          const message = ((container.querySelector<HTMLTextAreaElement>("#contact-message"))?.value ?? "").trim().slice(0, 2000);
          const ageGroup = ((container.querySelector<HTMLSelectElement>("#contact-age"))?.value ?? "").slice(0, 50);
          const supportMode = ((container.querySelector<HTMLSelectElement>("#contact-mode"))?.value ?? "").slice(0, 50);
          const firstTime = ((container.querySelector<HTMLSelectElement>("#contact-firsttime"))?.value ?? "").slice(0, 50);
          const heardFrom = ((container.querySelector<HTMLSelectElement>("#contact-source"))?.value ?? "").slice(0, 50);
          const privacy = (container.querySelector<HTMLInputElement>("#contact-privacy"))?.checked ?? false;

          // Client-side validation
          if (!name || name.length < 2) {
            if (responseEl) { responseEl.textContent = "Please enter your name."; responseEl.style.display = "block"; responseEl.className = "wpcf7-response-output -error"; }
            return;
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (responseEl) { responseEl.textContent = "Please enter a valid email."; responseEl.style.display = "block"; responseEl.className = "wpcf7-response-output -error"; }
            return;
          }
          if (!subject) {
            if (responseEl) { responseEl.textContent = "Please select a topic."; responseEl.style.display = "block"; responseEl.className = "wpcf7-response-output -error"; }
            return;
          }
          if (!message || message.length < 10) {
            if (responseEl) { responseEl.textContent = "Please share a bit more — at least 10 characters."; responseEl.style.display = "block"; responseEl.className = "wpcf7-response-output -error"; }
            return;
          }
          if (!privacy) {
            if (responseEl) { responseEl.textContent = "Please accept the privacy policy to continue."; responseEl.style.display = "block"; responseEl.className = "wpcf7-response-output -error"; }
            return;
          }

          submitBtn.value = "Sending...";
          submitBtn.disabled = true;
          if (responseEl) responseEl.style.display = "none";

          // reCAPTCHA v3 token (silent). If executeRecaptcha is undefined, server falls back to honeypot+timing.
          let recaptchaToken = "";
          const exec = executeRecaptchaRef.current;
          if (exec) {
            try { recaptchaToken = await exec("contact_form"); }
            catch (err) { console.error("[recaptcha]", err); }
          }

          try {
            const res = await fetch("/api/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, phone: phone || undefined, subject, message, ageGroup, supportMode, firstTime, heardFrom, elapsedMs: elapsed, recaptchaToken }),
            });
            if (res.ok) {
              formWrapper?.classList.add("-hidden");
              thanksMsg?.classList.add("-active");
            } else {
              const data = await res.json();
              if (responseEl) { responseEl.textContent = data.error || "Something went wrong. Please try again."; responseEl.style.display = "block"; responseEl.className = "wpcf7-response-output -error"; }
              submitBtn.value = "Send Message";
              submitBtn.disabled = false;
            }
          } catch {
            if (responseEl) { responseEl.textContent = "Network error. Please try again."; responseEl.style.display = "block"; responseEl.className = "wpcf7-response-output -error"; }
            submitBtn.value = "Send Message";
            submitBtn.disabled = false;
          }
        });
      }

      // ---- ROOMS NAV CAROUSEL ----
      {
        const nav = container.querySelector<HTMLElement>("[data-rooms-nav]");
        const viewport = nav?.querySelector<HTMLElement>(".block-rooms__nav-viewport");
        const list = viewport?.querySelector<HTMLElement>("[data-rooms-nav-list]");
        const prevBtn = nav?.querySelector<HTMLButtonElement>("[data-rooms-nav-prev]");
        const nextBtn = nav?.querySelector<HTMLButtonElement>("[data-rooms-nav-next]");

        if (nav && viewport && list && prevBtn && nextBtn) {
          const PER_PAGE = 4;
          const TOTAL_PAGES = 3; // 12 items / 4 = 3 pages
          let page = 0;

          const updateCarousel = () => {
            list.style.transform = `translateY(-${page * viewport.clientHeight}px)`;
            prevBtn.disabled = page === 0;
            nextBtn.disabled = page === TOTAL_PAGES - 1;
          };

          // After paging, auto-activate the first nav button on the new page
          // so its content opens (instead of staying on the previous page's selection).
          const activateFirstOnPage = () => {
            const firstIdx = page * PER_PAGE;
            const firstBtn = container.querySelector<HTMLButtonElement>(
              `[data-main-tab-toggler="${firstIdx}"]`
            );
            firstBtn?.click();
          };

          prevBtn.addEventListener("click", () => {
            if (page > 0) { page--; updateCarousel(); activateFirstOnPage(); }
          });
          nextBtn.addEventListener("click", () => {
            if (page < TOTAL_PAGES - 1) { page++; updateCarousel(); activateFirstOnPage(); }
          });

          // When a nav button outside current page is activated (e.g. via search), scroll to its page
          container.querySelectorAll<HTMLElement>("[data-main-tab-toggler]").forEach((btn) => {
            btn.addEventListener("click", () => {
              const idx = parseInt(btn.getAttribute("data-main-tab-toggler") || "0", 10);
              const targetPage = Math.floor(idx / PER_PAGE);
              if (targetPage !== page) { page = targetPage; updateCarousel(); }
            });
          });

          updateCarousel();
        }
      }

      // ---- MOBILE ROOMS PAGINATION ----
      {
        const PER_PAGE = 4;
        const allItems = Array.from(
          container.querySelectorAll<HTMLElement>(".block-rooms__tabs > .block-rooms__item")
        );
        const totalPages = Math.ceil(allItems.length / PER_PAGE);
        const prevBtn = container.querySelector<HTMLButtonElement>("[data-rooms-mobile-prev]");
        const nextBtn = container.querySelector<HTMLButtonElement>("[data-rooms-mobile-next]");
        const label = container.querySelector<HTMLElement>("[data-rooms-mobile-label]");
        let mobilePage = 0;

        const updateMobilePagination = () => {
          if (window.innerWidth >= 768) {
            // Desktop: clear inline styles, let CSS handle visibility
            allItems.forEach((item) => (item.style.display = ""));
            return;
          }
          allItems.forEach((item, i) => {
            const inPage = i >= mobilePage * PER_PAGE && i < (mobilePage + 1) * PER_PAGE;
            item.style.display = inPage ? "" : "none";
            // Close accordion if hiding
            if (!inPage && item.classList.contains("-active")) {
              item.classList.remove("-active");
              item.querySelector<HTMLElement>("[data-mobile-toggler]")?.classList.remove("-active");
            }
          });
          if (label) label.textContent = `${mobilePage + 1} / ${totalPages}`;
          if (prevBtn) prevBtn.disabled = mobilePage === 0;
          if (nextBtn) nextBtn.disabled = mobilePage === totalPages - 1;
        };

        // After paging, auto-open the first item on the new page.
        const openFirstOfPage = () => {
          if (window.innerWidth >= 768) return;
          const firstItem = allItems[mobilePage * PER_PAGE];
          if (!firstItem) return;
          // Use the existing toggler's click handler so all the proper -active toggling runs.
          const toggler = firstItem.querySelector<HTMLButtonElement>("[data-mobile-toggler]");
          if (!firstItem.classList.contains("-active")) toggler?.click();
        };

        prevBtn?.addEventListener("click", () => {
          if (mobilePage > 0) { mobilePage--; updateMobilePagination(); openFirstOfPage(); }
        });
        nextBtn?.addEventListener("click", () => {
          if (mobilePage < totalPages - 1) { mobilePage++; updateMobilePagination(); openFirstOfPage(); }
        });

        resizeHandler = updateMobilePagination;
        window.addEventListener("resize", resizeHandler);
        updateMobilePagination();
      }

      // ---- SMOOTH SCROLL ----
      container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          const id = a.getAttribute("href");
          if (!id || id === "#") return;
          const target = document.querySelector(id);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      });
    }

    initAll();

    // Recalculate all ScrollTrigger positions after layout settles
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      wordAnimDestroyed = true;

      // Kill all ScrollTrigger instances
      ScrollTrigger.getAll().forEach((t: any) => t.kill());

      // Remove gsap-ready class so CSS initial states (opacity:0) don't persist
      container.classList.remove("gsap-ready");

      // Clear GSAP-set inline styles so elements reset on re-mount
      container.querySelectorAll<HTMLElement>(
        "[data-split-item], [data-animate-item], [data-section-header] [data-label], [data-section-header] [data-heading], .block-slogan__item-image, .block-slogan__item-shape, [data-animate-shape], [data-animate-label], .block-hero__description, .block-hero__image, .block-hero__image img"
      ).forEach((el) => {
        gsap.set(el, { clearProps: "all" });
      });

      // Disconnect Lenis from GSAP ticker
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();

      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
    <>
      <Preloader />
      <Navbar />
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: sectionHTML }}
      />
    </>
  );
}
