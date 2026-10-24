import { useEffect } from 'react';
import PhraseCarousel from './PhraseCarousel';
import { normalizeWelcomeSlides } from '../../data/siteContent';

const INTRO_DURATION_MS = 6000;

export default function IntroSplash({ siteSettings, onComplete }) {
  const slides = normalizeWelcomeSlides(siteSettings);
  const welcomeSlides = slides.length
    ? slides
    : [{ text: siteSettings.slogan || siteSettings.heroTitle, image: '' }];

  useEffect(() => {
    const timeout = window.setTimeout(onComplete, INTRO_DURATION_MS);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timeout);
      document.body.style.overflow = previousOverflow;
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#f7f2eb] px-5 text-center dark:bg-stone-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,148,93,0.25),_transparent_58%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(201,148,93,0.12),_transparent_58%)]" />
      <div className="relative w-full max-w-3xl">
        <div className="mb-8 text-sm font-bold tracking-[0.2em] text-brand-700 dark:text-brand-300">
          {siteSettings.companyName}
        </div>
        <div className="rounded-[2rem] border border-brand-200/70 bg-white/75 px-6 py-10 shadow-[0_30px_90px_rgba(61,42,22,0.12)] backdrop-blur-sm dark:border-stone-700 dark:bg-stone-900/75 sm:px-12 sm:py-14">
          <PhraseCarousel slides={welcomeSlides} intervalMs={2000} className="mx-auto max-w-2xl" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-brand-100 dark:bg-stone-800">
        <div className="intro-splash-progress h-full bg-brand-600 dark:bg-brand-300" />
      </div>
    </div>
  );
}
