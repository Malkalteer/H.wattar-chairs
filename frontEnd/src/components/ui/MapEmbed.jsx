import { MapPin } from 'lucide-react';

// يبني رابط خريطة قابلًا للتضمين: إما رابط embed من Google أو بحث بالعنوان
export function buildMapSrc(contact = {}) {
  const raw = (contact.mapEmbed || '').trim();
  const iframeSrc = raw.match(/src="([^"]+)"/);
  const url = iframeSrc ? iframeSrc[1] : raw;

  if (url.startsWith('https://www.google.com/maps/embed') || url.startsWith('https://maps.google.com/maps?')) {
    return url;
  }
  const query = contact.address || 'Damascus';
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

export default function MapEmbed({ contact }) {
  const query = encodeURIComponent(contact?.address || 'Damascus');

  return (
    <div className="relative overflow-hidden rounded-3xl bg-stone-200 shadow-soft dark:bg-stone-800">
      <iframe
        title="موقع الشركة على الخريطة"
        src={buildMapSrc(contact)}
        className="h-full min-h-[320px] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${query}`}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-stone-800 shadow-lg"
      >
        <MapPin size={14} /> فتح في خرائط Google
      </a>
    </div>
  );
}
