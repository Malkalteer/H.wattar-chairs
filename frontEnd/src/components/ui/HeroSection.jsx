import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWhatsappNumber, imageUrl, whatsappLink } from '../../utils/format';
import { normalizeWelcomeSlides } from '../../data/siteContent';

export default function HeroSection({ siteSettings }) {
  const slides = normalizeWelcomeSlides(siteSettings);
  const visibleSlides = slides.length
    ? slides
    : [{ text: siteSettings.slogan || siteSettings.heroSubtitle, image: '' }];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (visibleSlides.length < 2) return undefined;

    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % visibleSlides.length);
    }, 8500);

    return () => window.clearInterval(interval);
  }, [visibleSlides.length]);

  const activeSlide = visibleSlides[activeIndex % visibleSlides.length];

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(201,148,93,0.22),_rgba(54,38,27,0.12)_35%,_rgba(245,245,244,1)_100%)] py-14 dark:bg-[radial-gradient(circle_at_top,_rgba(201,148,93,0.12),_rgba(12,10,8,0.35)_40%,_rgba(9,9,11,1)_100%)] sm:py-16">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.38),transparent_50%,rgba(255,255,255,0.15))]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div key={activeIndex} className="hero-slide-turn grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-max items-center rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-brand-700 shadow-sm backdrop-blur dark:border-brand-900/40 dark:bg-stone-900/70 dark:text-brand-200 sm:text-xs">
              {siteSettings.slogan}
              
            </span>
            <h1 className="text-[2.3rem] font-black leading-[1.15] text-stone-900 dark:text-white sm:text-5xl lg:text-[3.5rem]">
              {/* {siteSettings.heroTitle} */}
               {activeSlide.text}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-stone-700 dark:text-stone-300 sm:text-lg">{siteSettings.heroSubtitle} </p>
            {/* <div className="mt-6 max-w-xl rounded-3xl border border-brand-200/70 bg-white/65 px-5 py-4 shadow-sm backdrop-blur dark:border-stone-700 dark:bg-stone-900/65">
              <p className="min-h-14 text-lg font-bold leading-8 text-stone-800 dark:text-stone-100 sm:text-xl" aria-live="polite">
            
                
              </p>
              {visibleSlides.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  {visibleSlides.map((slide, index) => (
                    <button
                      key={`${index}-${slide.text}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-label={`عرض الشريحة ${index + 1}`}
                      aria-current={activeIndex === index ? 'true' : undefined}
                      className={`h-2.5 rounded-full transition-all ${activeIndex === index ? 'w-7 bg-brand-700 dark:bg-brand-300' : 'w-2.5 bg-stone-300 dark:bg-stone-600'}`}
                    />
                  ))}
                </div>
              )}
            </div> */}
            
              {visibleSlides.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  {visibleSlides.map((slide, index) => (
                    <button
                      key={`${index}-${slide.text}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-label={`عرض الشريحة ${index + 1}`}
                      aria-current={activeIndex === index ? 'true' : undefined}
                      className={`h-2.5 rounded-full transition-all ${activeIndex === index ? 'w-7 bg-brand-700 dark:bg-brand-300' : 'w-2.5 bg-stone-300 dark:bg-stone-600'}`}
                    />
                  ))}
                </div>
              )}
            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              <Link to="/products" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-medium text-white shadow-[0_16px_32px_rgba(120,77,31,0.28)] transition hover:-translate-y-0.5 hover:bg-brand-800 sm:px-6 sm:text-base">
                تصفّح المنتجات
              </Link>
              <a
                href={whatsappLink(getWhatsappNumber(siteSettings.contact), 'السلام عليكم، أود الاستفسار عن منتجاتكم.')}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-stone-300 bg-white/90 px-5 py-3 text-sm font-medium text-stone-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-100 sm:px-6 sm:text-base"
              >
                تواصل عبر واتساب
              </a>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-3 shadow-[0_25px_60px_rgba(45,30,20,0.12)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/80">
            <div className="absolute inset-x-6 top-4 h-20 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-500/10" />
            {activeSlide.image && (
              <img
                src={imageUrl(activeSlide.image)}
                alt={activeSlide.text || 'أعمالنا'}
                className="relative h-[340px] w-full rounded-[1.5rem] object-cover sm:h-[430px] lg:h-[500px]"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
