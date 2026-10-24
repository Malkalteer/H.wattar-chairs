import { useEffect, useState } from 'react';
import { imageUrl } from '../../utils/format';

export default function PhraseCarousel({ slides, messages, intervalMs = 4000, className = '' }) {
  const items = Array.isArray(slides)
    ? slides.filter((slide) => slide?.text)
    : (Array.isArray(messages) ? messages.filter(Boolean).map((text) => ({ text })) : []);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return undefined;

    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % items.length);
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [intervalMs, items.length]);

  if (!items.length) return null;

  const currentIndex = activeIndex % items.length;
  const currentSlide = items[currentIndex];

  return (
    <div className={className} dir="rtl">
      <div key={currentIndex} className="hero-slide-turn grid items-center gap-5 sm:grid-cols-[1fr_1.1fr]">
        {currentSlide.image && (
          <img
            src={imageUrl(currentSlide.image)}
            alt={currentSlide.text}
            className="h-44 w-full rounded-2xl object-cover sm:h-56"
          />
        )}
        <p className="min-h-14 text-lg font-bold leading-8 text-stone-800 dark:text-stone-100 sm:text-xl" aria-live="polite">
          {currentSlide.text}
        </p>
      </div>
      {items.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {items.map((slide, index) => (
            <button
              key={`${index}-${slide.text}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`عرض الجملة ${index + 1}`}
              aria-current={currentIndex === index ? 'true' : undefined}
              className={`h-2.5 rounded-full transition-all ${currentIndex === index ? 'w-7 bg-brand-700 dark:bg-brand-300' : 'w-2.5 bg-stone-300 dark:bg-stone-600'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
