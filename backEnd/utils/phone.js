const { COUNTRY_CODE } = require('../config/locale');

// يوحّد الرقم إلى أرقام فقط بصيغة دولية: 00963.. و +963.. و 09.. كلها تصبح 963..
const normalizeWhatsapp = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `${COUNTRY_CODE}${digits.slice(1)}`;
  return digits;
};

module.exports = { normalizeWhatsapp };
