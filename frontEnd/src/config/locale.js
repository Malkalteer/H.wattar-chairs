// ===== إعدادات الدولة والعملة والتاريخ (مكان واحد للواجهة) =====
// غيّر القيم هنا (أو عبر متغيرات VITE_ في ملف .env قبل البناء).
// مهم: يجب أن تتطابق مع backEnd/.env  (COUNTRY_CODE, CURRENCY_CODE, CURRENCY_SYMBOL)

// رمز الدولة لأرقام الواتساب (سوريا = 963)
export const COUNTRY_CODE = String(import.meta.env.VITE_COUNTRY_CODE || '963').replace(/\D/g, '');

// العملة: دولار أمريكي
export const CURRENCY = {
  code: import.meta.env.VITE_CURRENCY_CODE || 'USD',
  symbol: import.meta.env.VITE_CURRENCY_SYMBOL || '$',
};

// الأرقام لاتينية (1,250) والتاريخ ميلادي بأسماء الأشهر العربية السورية
export const NUMBER_LOCALE = 'en-US';
export const DATE_LOCALE = 'ar-SY-u-ca-gregory-nu-latn';

// مثال رقم محلي للعرض في حقول الإدخال
export const EXAMPLE_WHATSAPP = `${COUNTRY_CODE}900000000`;
