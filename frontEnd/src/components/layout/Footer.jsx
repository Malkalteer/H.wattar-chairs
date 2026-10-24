import { Link } from 'react-router-dom';
import { displayWhatsapp, getWhatsappNumber, telHref, whatsappLink } from '../../utils/format';

const socialNetworks = [
  {
    key: 'instagram',
    label: 'إنستغرام',
    Icon: InstagramIcon,
  },
  {
    key: 'tiktok',
    label: 'تيك توك',
    Icon: TikTokIcon,
  },
  {
    key: 'facebook',
    label: 'فيسبوك',
    Icon: FacebookIcon,
  },
];

function InstagramIcon({ size = 22 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ size = 22 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.03 1.75 4.12 1.11 1.05 2.61 1.72 4.14 1.86v3.98c-1.43-.05-2.86-.39-4.14-1.03-.56-.27-1.08-.61-1.59-.96-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.93-1.31 1.91-3.59 3.15-5.91 3.19-1.42.08-2.84-.31-4.02-1.05-1.96-1.23-3.34-3.55-3.38-5.87-.21-2.18.8-4.42 2.51-5.79 1.94-1.59 4.71-1.94 6.97-.93.02 1.47-.04 2.94-.04 4.41-1.01-.33-2.19-.24-3.06.37-.64.42-1.12 1.08-1.27 1.83-.13.75.05 1.56.55 2.15 1.01 1.27 3.23 1.34 4.31.12.38-.45.64-1.03.65-1.62.02-2.92-.01-5.84.02-8.75-.01-2.89-.01-5.79 0-8.68z" />
    </svg>
  );
}

function FacebookIcon({ size = 22 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.006 10.125 11.854v-8.385H7.078v-3.47h3.047V9.426c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.955.93-1.955 1.886v2.252h3.328l-.532 3.47h-2.796v8.385C19.612 23.08 24 18.092 24 12.073Z" />
    </svg>
  );
}

export default function Footer({ siteSettings }) {
  return (
    <footer className="border-t border-stone-200 bg-stone-900 text-stone-200 dark:border-stone-800">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <h3 className="mb-3 text-xl font-bold text-white">{siteSettings.companyName}</h3>
          <p className="text-sm text-stone-300">{siteSettings.aboutText}</p>
        </div>

        <div>
          <h4 className="mb-3 text-lg font-semibold text-white">روابط سريعة</h4>
          <ul className="space-y-2 text-sm text-stone-300">
            <li><Link to="/products">منتجاتنا</Link></li>
            <li><Link to="/gallery">معرض أعمالنا</Link></li>
            <li><Link to="/orders">طلباتي</Link></li>
            <li><Link to="/cart">السلة</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-lg font-semibold text-white">تواصل معنا</h4>
          <ul className="space-y-2 text-sm text-stone-300">
            {siteSettings.contact.phone && (
              <li><a href={telHref(siteSettings.contact.phone)} dir="ltr" className="inline-block hover:text-white">{siteSettings.contact.phone}</a></li>
            )}
            {getWhatsappNumber(siteSettings.contact) && (
              <li>
                <a href={whatsappLink(getWhatsappNumber(siteSettings.contact), 'السلام عليكم، أريد الاستفسار.')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                  واتساب: <span dir="ltr">{displayWhatsapp(siteSettings.contact)}</span>
                </a>
              </li>
            )}
            <li>{siteSettings.contact.address}</li>
            <li>{siteSettings.contact.workingHours}</li>
            {siteSettings.contact.email && <li>{siteSettings.contact.email}</li>}
          </ul>
          <div className="mt-4 flex items-center gap-3">
            {socialNetworks.map(({ key, label, Icon }) =>
              siteSettings.socialLinks?.[key] ? (
                <a
                  key={key}
                  href={siteSettings.socialLinks[key]}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${label} - ${siteSettings.companyName}`}
                  title={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-brand-200 transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                >
                  <Icon size={21} />
                </a>
              ) : null
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
