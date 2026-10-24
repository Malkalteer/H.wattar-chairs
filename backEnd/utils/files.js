const path = require('path');
const gridfs = require('../config/gridfs');

// يحذف الصور من MongoDB (GridFS) للمسارات المحلية فقط (/uploads/..) ويتجاهل الروابط الخارجية.
// لا ينتظر النتيجة ولا يوقف العملية الأصلية إن فشل.
const removeUploads = (urls = []) => {
  for (const url of [].concat(urls || [])) {
    if (typeof url !== 'string' || !url.startsWith('/uploads/')) continue;
    const filename = path.basename(url);
    gridfs.deleteByName(filename).catch((error) => console.error('removeUploads error:', error.message));
  }
};

const filesToUrls = (files) => (Array.isArray(files) ? files.filter((f) => f.filename).map((file) => `/uploads/${file.filename}`) : []);

module.exports = { removeUploads, filesToUrls };
