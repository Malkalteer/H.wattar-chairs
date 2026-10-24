const crypto = require('crypto');

const isProduction = process.env.NODE_ENV === 'production';

let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret === 'change_me_super_strong_secret') {
  if (isProduction) {
    throw new Error('JWT_SECRET غير مضبوط. أنشئ قيمة عشوائية قوية في ملف .env (انظر README).');
  }
  // في التطوير فقط: مفتاح مؤقت (تنتهي الجلسات عند إعادة تشغيل الخادم)
  jwtSecret = crypto.randomBytes(48).toString('hex');
  console.warn('⚠️  JWT_SECRET غير مضبوط، تم استخدام مفتاح مؤقت للتطوير فقط.');
}

module.exports = { jwtSecret, isProduction };
