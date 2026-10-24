const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/env');
const { isEmailEnabled } = require('../utils/mailer');

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
};

const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'سجّل الدخول للمتابعة.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user || req.user.isBlocked) {
      return res.status(401).json({ message: 'تم حظر الحساب. تواصل مع الإدارة.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'رمز غير صالح أو منتهي الصلاحية.' });
  }
};

// يضيف المستخدم إن وُجد رمز صالح، ويكمل بدونه كزائر
const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id).select('-password');
    if (user && !user.isBlocked) req.user = user;
  } catch (error) {
    // نتجاهل الرمز غير الصالح ونعامله كزائر
  }
  next();
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ message: 'لا تملك صلاحية الوصول إلى هذه الصفحة.' });
};

// يشترط تأكيد البريد (فقط عند تفعيل خدمة البريد)
const requireVerified = (req, res, next) => {
  if (isEmailEnabled() && req.user && req.user.emailVerified === false) {
    return res.status(403).json({
      code: 'EMAIL_NOT_VERIFIED',
      message: 'يرجى تأكيد بريدك الإلكتروني أولًا. تفقد صندوق الوارد أو أعد إرسال رابط التأكيد.',
    });
  }
  next();
};

module.exports = { protect, optionalAuth, admin, requireVerified };
