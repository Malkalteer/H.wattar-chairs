import { COUNTRY_CODE, CURRENCY, DATE_LOCALE, NUMBER_LOCALE } from '../config/locale';

export const formatCurrency = (value) => `${Number(value || 0).toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 2 })} ${CURRENCY.symbol}`;

export const formatDate = (value, withTime = false) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(DATE_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

const API_URL = import.meta.env.VITE_API_URL || 'https://h-wattar-chairs.onrender.com/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// الصور المرفوعة تُخزَّن كمسار نسبي (/uploads/..) ويجب أن تُحمَّل من نطاق الخادم لا الواجهة
export const imageUrl = (src, fallback = 'https://placehold.co/800x800/3f2d1f/fff?text=Wattar+Chair') => {
  if (!src) return fallback;
  if (src.startsWith('/uploads/')) return `${API_ORIGIN}${src}`;
  return src;
};

export const ORDER_STATUSES = {
  new: { label: 'جديد', color: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300' },
  confirmed: { label: 'تم التأكيد', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' },
  in_production: { label: 'قيد التصنيع', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' },
  ready: { label: 'جاهز للتسليم', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' },
  delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  cancelled: { label: 'ملغي', color: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' },
};

export const CATEGORIES = ['كراسي', 'مجالس', 'مفروشات', 'اكسسوارات', 'أخرى'];

export const cartLineKey = (item) => `${item.product?._id}|${item.color || ''}|${item.colorHex || ''}|${item.fabric || ''}`;

export const hasOptions = (product) => Boolean(product?.options?.colors?.length || product?.options?.fabrics?.length);

// يوحّد الرقم إلى أرقام دولية فقط: 00963.. و +963.. و 09.. كلها تصبح 963.. (الرمز من config/locale.js)
export const normalizeWhatsapp = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `${COUNTRY_CODE}${digits.slice(1)}`;
  return digits;
};

// رقم التواصل المعتمد في كامل الموقع: الواتساب من الإعدادات، وإن كان فارغًا فالهاتف
export const getWhatsappNumber = (contact = {}) => normalizeWhatsapp(contact.whatsapp) || normalizeWhatsapp(contact.phone);

export const whatsappLink = (number, text = '') => `https://wa.me/${normalizeWhatsapp(number)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const telHref = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;

// عرض الرقم للزائر بشكل مقروء: +963900000000
export const displayWhatsapp = (contact = {}) => {
  const n = getWhatsappNumber(contact);
  return n ? `+${n}` : '';
};

// رابط واتساب لرقم عميل (مثل 09xxxxxxxx)
export const customerWhatsapp = (phone, text = '') => whatsappLink(phone, text);
