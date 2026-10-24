const path = require('path');

// مجلد الصور القديمة (قبل الانتقال إلى MongoDB). يُستخدم فقط في سكربت: npm run migrate:uploads
module.exports = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(__dirname, '../uploads');
