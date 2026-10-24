const path = require('path');
const gridfs = require('../config/gridfs');

const FILENAME_RE = /^[A-Za-z0-9._-]{1,100}$/;
const MIME_BY_EXT = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// GET /uploads/:filename — يقدّم الصورة من MongoDB
const serveUpload = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!FILENAME_RE.test(filename)) return res.status(404).end();

    const file = await gridfs.findByName(filename);
    if (!file) return res.status(404).end();

    const mime = file.metadata?.contentType || MIME_BY_EXT[path.extname(filename).toLowerCase()];
    if (!mime) return res.status(404).end();

    const lastModified = new Date(file.uploadDate);
    lastModified.setMilliseconds(0);

    res.set({
      'Content-Type': mime,
      'Content-Length': String(file.length),
      'Last-Modified': lastModified.toUTCString(),
      // أسماء الملفات فريدة ولا تتغير محتوياتها، فيمكن تخزينها طويلًا في المتصفح وNginx
      'Cache-Control': 'public, max-age=2592000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; sandbox",
    });

    const since = req.headers['if-modified-since'];
    if (since && new Date(since) >= lastModified) return res.status(304).end();

    if (req.method === 'HEAD') return res.status(200).end();

    const stream = gridfs.openStream(filename);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).end();
      else res.destroy();
    });
    stream.pipe(res);
  } catch (error) {
    console.error('serveUpload error:', error.message);
    if (!res.headersSent) res.status(500).end();
  }
};

module.exports = { serveUpload };
