const multer = require('multer');
const path = require('path');
const gridfs = require('./gridfs');

const ALLOWED_ORIGINAL_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// الملفات تُقرأ في الذاكرة أولًا (حد 3MB × 5)، ثم تُفحص، ثم تُحفظ في MongoDB فقط إن كانت صورًا حقيقية
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const okType = ALLOWED_MIME.includes(file.mimetype);
    const okExt = ALLOWED_ORIGINAL_EXT.includes(path.extname(file.originalname || '').toLowerCase());

    if (okType && okExt) return cb(null, true);

    const error = new Error('نوع الملف غير مدعوم. فقط الصور (JPG, PNG, WEBP).');
    error.status = 400;
    cb(error, false);
  },
  limits: { fileSize: 3 * 1024 * 1024, files: 5 },
});

// يحدد النوع الحقيقي من أول بايتات الملف (وليس مما يدّعيه العميل)
const detectImageType = (buf) => {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: '.jpg' };
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: '.png' };
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return { mime: 'image/webp', ext: '.webp' };
  return null;
};

// 1) يتحقق من كل الملفات  2) يحفظها في MongoDB  3) يضع file.filename ليستخدمه الكنترولر لبناء /uploads/<filename>
upload.processImages = async (req, res, next) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) return next();

  const detected = files.map((file) => detectImageType(file.buffer));
  if (detected.some((d) => !d)) {
    return res.status(400).json({ message: 'أحد الملفات ليس صورة صالحة.' });
  }

  const saved = [];
  try {
    for (let i = 0; i < files.length; i += 1) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${detected[i].ext}`;
      await gridfs.saveBuffer(filename, files[i].buffer, detected[i].mime);
      files[i].filename = filename;
      files[i].mimetype = detected[i].mime;
      files[i].buffer = undefined; // تحرير الذاكرة
      saved.push(filename);
    }
    next();
  } catch (error) {
    console.error('GridFS save error:', error.message);
    // تراجع: نحذف ما تم حفظه من هذا الطلب
    await Promise.all(saved.map((name) => gridfs.deleteByName(name).catch(() => {})));
    res.status(500).json({ message: 'تعذر حفظ الصور. حاول مرة أخرى.' });
  }
};

upload.detectImageType = detectImageType;

module.exports = upload;
