import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const SECTION_Y = 24;
export const ITEM_Y = 16;
export const DURATION = 0.7;
export const STAGGER = 0.08;

const EASE = 'power2.out';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const getRevealItems = (section: HTMLElement): HTMLElement[] =>
  Array.from(section.querySelectorAll<HTMLElement>('[data-reveal-item]'));

export const initLandingAnimations = (root: HTMLElement): (() => void) => {
  const shouldReduceMotion = prefersReducedMotion();

  const ctx = gsap.context(() => {
    const landingHeader = root.querySelector<HTMLElement>('[data-landing-header]');
    const sections = gsap.utils.toArray<HTMLElement>('[data-reveal-section]', root);
    const heroSection = root.querySelector<HTMLElement>('[data-reveal-section="hero"]');

    if (shouldReduceMotion) {
      if (landingHeader) {
        gsap.set(landingHeader, { clearProps: 'opacity,visibility,transform,willChange' });
      }
      sections.forEach((section) => {
        const items = getRevealItems(section);
        if (items.length) {
          gsap.set(items, { clearProps: 'opacity,visibility,transform,willChange' });
        }
      });
      return;
    }

    if (landingHeader) {
      gsap.fromTo(
        landingHeader,
        { autoAlpha: 0, y: -12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          ease: EASE,
          clearProps: 'opacity,visibility,transform,willChange',
        },
      );
    }

    if (heroSection) {
      const badge = heroSection.querySelector<HTMLElement>('[data-hero-intro="badge"]');
      const titleLines = Array.from(
        heroSection.querySelectorAll<HTMLElement>('[data-hero-intro="title-line"], [data-hero-intro="title-accent"]'),
      );
      const subtitle = heroSection.querySelector<HTMLElement>('[data-hero-intro="subtitle"]');
      const actions = heroSection.querySelector<HTMLElement>('[data-hero-intro="actions"]');
      const stats = Array.from(heroSection.querySelectorAll<HTMLElement>('[data-hero-intro="stat"]'));

      const timeline = gsap.timeline({ defaults: { duration: DURATION, ease: EASE } });

      if (badge) {
        gsap.set(badge, { autoAlpha: 0, y: ITEM_Y });
        timeline.to(badge, { autoAlpha: 1, y: 0, clearProps: 'opacity,visibility,transform,willChange' }, 0);
      }

      if (titleLines.length) {
        gsap.set(titleLines, { autoAlpha: 0, y: SECTION_Y });
        timeline.to(
          titleLines,
          {
            autoAlpha: 1,
            y: 0,
            stagger: STAGGER,
            clearProps: 'opacity,visibility,transform,willChange',
          },
          0.12,
        );
      }

      if (subtitle) {
        gsap.set(subtitle, { autoAlpha: 0, y: ITEM_Y });
        timeline.to(subtitle, { autoAlpha: 1, y: 0, clearProps: 'opacity,visibility,transform,willChange' }, 0.24);
      }

      if (actions) {
        gsap.set(actions, { autoAlpha: 0, y: ITEM_Y });
        timeline.to(actions, { autoAlpha: 1, y: 0, clearProps: 'opacity,visibility,transform,willChange' }, 0.36);
      }

      if (stats.length) {
        gsap.set(stats, { autoAlpha: 0, y: ITEM_Y });
        timeline.to(
          stats,
          {
            autoAlpha: 1,
            y: 0,
            stagger: STAGGER,
            clearProps: 'opacity,visibility,transform,willChange',
          },
          0.5,
        );
      }
    }

    sections.forEach((section) => {
      if (section === heroSection) {
        return;
      }

      const items = getRevealItems(section);
      if (!items.length) {
        return;
      }

      gsap.set(items, { autoAlpha: 0, y: ITEM_Y });

      const sectionKey = section.getAttribute('data-reveal-section');
      const triggerStart = sectionKey === 'ft' ? 'top bottom' : 'top 82%';

      gsap.to(items, {
        autoAlpha: 1,
        y: 0,
        duration: DURATION,
        ease: EASE,
        stagger: STAGGER,
        clearProps: 'opacity,visibility,transform,willChange',
        scrollTrigger: {
          trigger: section,
          start: triggerStart,
          once: true,
        },
      });
    });
  }, root);

  return () => ctx.revert();
};
