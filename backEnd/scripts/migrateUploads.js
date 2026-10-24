// ينقل الصور الموجودة في مجلد uploads إلى MongoDB (GridFS) بنفس أسمائها،
// فتبقى مسارات /uploads/<اسم> المحفوظة في المنتجات والمشاريع تعمل دون تعديل.
// الاستخدام:  npm run migrate:uploads            (نسخ فقط)
//             npm run migrate:uploads -- --delete (نسخ ثم حذف الملف المحلي بعد التأكد)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const uploadDir = require('../config/uploadDir');
const gridfs = require('../config/gridfs');
const upload = require('../config/upload');

const shouldDelete = process.argv.includes('--delete');

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI غير مضبوط.');
  await mongoose.connect(process.env.MONGO_URI);

  if (!fs.existsSync(uploadDir)) {
    console.log(`لا يوجد مجلد صور قديم (${uploadDir}). لا شيء للنقل.`);
    return;
  }

  const names = fs.readdirSync(uploadDir).filter((n) => /^[A-Za-z0-9._-]+$/.test(n));
  let migrated = 0;
  let skipped = 0;
  let invalid = 0;

  for (const name of names) {
    const filePath = path.join(uploadDir, name);
    if (!fs.statSync(filePath).isFile()) continue;

    const buffer = fs.readFileSync(filePath);
    const type = upload.detectImageType(buffer);
    if (!type) {
      console.log(`تخطي (ليس صورة): ${name}`);
      invalid += 1;
      continue;
    }

    if (await gridfs.findByName(name)) {
      skipped += 1;
    } else {
      await gridfs.saveBuffer(name, buffer, type.mime);
      migrated += 1;
      console.log(`نُقلت: ${name}`);
    }

    // نتأكد أن الصورة صارت في القاعدة قبل حذف النسخة المحلية
    if (shouldDelete && (await gridfs.findByName(name))) fs.unlinkSync(filePath);
  }

  console.log(`\nانتهى: نُقل ${migrated} | موجود مسبقًا ${skipped} | غير صالح ${invalid}${shouldDelete ? ' | حُذفت النسخ المحلية' : ''}`);
};

run()
  .catch((error) => {
    console.error('فشل النقل:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
