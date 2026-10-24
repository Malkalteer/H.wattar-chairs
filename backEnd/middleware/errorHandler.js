const notFound = (req, res, next) => {
  const error = new Error(`غير موجود: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'حدث خطأ غير متوقع.';

  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'حجم الصورة كبير (الحد الأقصى 3 ميجابايت).' : 'تعذر رفع الملفات. تأكد من عدد وحجم الصور.';
  } else if (err.status) {
    statusCode = err.status;
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
