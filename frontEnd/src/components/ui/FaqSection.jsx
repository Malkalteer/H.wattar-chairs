import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import SectionHeading from './SectionHeading';

export default function FaqSection({ faqs = [] }) {
  const [openIndex, setOpenIndex] = useState(0);
  if (!faqs.length) return null;

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
          }).replace(/</g, '\\u003c'),
        }}
      />
      <SectionHeading title="الأسئلة الشائعة" subtitle="إجابات سريعة لأكثر ما يُسأل عنه" />
      <div className="space-y-3">
        {faqs.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-soft dark:bg-stone-900">
              <button type="button" aria-expanded={open} onClick={() => setOpenIndex(open ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-right font-bold text-stone-900 dark:text-stone-100">
                <span>{item.question}</span>
                <ChevronDown size={18} className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && <p className="px-5 pb-5 text-sm leading-7 text-stone-600 dark:text-stone-300">{item.answer}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
