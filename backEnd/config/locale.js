// ===== إعدادات الدولة والعملة (مكان واحد للخادم) =====
// تُغيَّر من ملف .env فقط:  COUNTRY_CODE=963   CURRENCY_CODE=USD   CURRENCY_SYMBOL=$
// ملاحظة: للواجهة الأمامية ملف مقابل: frontEnd/src/config/locale.js (يجب أن تتطابق القيم)
const COUNTRY_CODE = String(process.env.COUNTRY_CODE || '963').replace(/\D/g, '');
const CURRENCY_CODE = process.env.CURRENCY_CODE || 'USD';
const CURRENCY_SYMBOL = process.env.CURRENCY_SYMBOL || '$';

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${CURRENCY_SYMBOL}`;

module.exports = { COUNTRY_CODE, CURRENCY_CODE, CURRENCY_SYMBOL, formatMoney };
