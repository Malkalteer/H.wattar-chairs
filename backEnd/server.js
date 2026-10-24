require('dotenv').config();
require('./config/env');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { serveUpload } = require('./controllers/fileController');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const siteRoutes = require('./routes/siteRoutes');
const aiRoutes = require('./routes/aiRoutes');
const orderRoutes = require('./routes/orderRoutes');
const projectRoutes = require('./routes/projectRoutes');
const adminRoutes = require('./routes/adminRoutes');
const commentRoutes = require('./routes/commentRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
const PORT = process.env.PORT || 5000;
const allowedOrigins = Array.from(
  new Set(
    [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      ...(process.env.CLIENT_URLS || '').split(',').filter(Boolean),
    ].filter(Boolean)
  )
);

const startServer = async () => {
  await connectDB();

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'تم تجاوز عدد المحاولات. حاول مرة أخرى لاحقًا.' },
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );
  // السماح بعرض الصور المرفوعة من نطاق الواجهة الأمامية
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan('dev'));
  // الصور تُقدَّم من MongoDB (GridFS)
  app.get('/uploads/:filename', serveUpload);

  app.get('/api/health', (req, res) => {
    res.json({ message: 'خادم Wattar Chair يعمل بشكل صحيح.', status: 'ok' });
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/site', siteRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ai', aiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
};

startServer();
