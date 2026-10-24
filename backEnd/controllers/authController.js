const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Comment = require('../models/Comment');
const { recalculateProductRating } = require('./reviewController');
const { generateToken } = require('../utils/token');
const { canSeePrices, stripCart, stripProducts } = require('../utils/pricing');
const { sendMail, isEmailEnabled } = require('../utils/mailer');

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isBlocked: user.isBlocked,
  lastLoginAt: user.lastLoginAt || null,
  emailVerified: user.emailVerified !== false,
  favorites: user.favorites || [],
  cart: user.cart || [],
  createdAt: user.createdAt,
});

const MAX_QTY = 99;
const clampQty = (value) => Math.min(MAX_QTY, Math.max(1, Math.floor(Number(value)) || 1));

// يرجع السلة مع بيانات المنتج كاملة (الاسم، السعر، الصور) بعد أي تعديل
const populatedCart = async (userId) => {
  const user = await User.findById(userId).populate('cart.product', 'name price images options inStock');
  // نتجاهل أي منتج تم حذفه من المتجر
  return (user.cart || []).filter((item) => item.product);
};

const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

const sendVerificationEmail = async (user) => {
  const raw = crypto.randomBytes(32).toString('hex');
  user.emailVerifyToken = hashToken(raw);
  user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  return sendMail({
    to: user.email,
    subject: 'تأكيد بريدك الإلكتروني - Wattar Chair',
    title: 'أهلًا بك في Wattar Chair',
    text: `مرحبًا ${user.name}، اضغط الرابط لتأكيد بريدك الإلكتروني (صالح 24 ساعة).`,
    bodyHtml: 'اضغط الزر أدناه لتأكيد بريدك الإلكتروني. الرابط صالح لمدة 24 ساعة.',
    buttonText: 'تأكيد البريد',
    buttonUrl: `${clientUrl()}/verify-email?token=${raw}`,
  });
};

// يخفي أسعار السلة عن غير المدير عندما تكون خاصية الأسعار مطفأة
const cartFor = async (req, cart) => ((await canSeePrices(req)) ? cart : stripCart(cart));

const sendTokenResponse = (res, user, statusCode = 200) => {
  const token = generateToken(user);

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(statusCode).json({
    token,
    user: sanitizeUser(user),
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'يرجى إدخال الاسم والبريد الإلكتروني وكلمة المرور.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'هذا البريد الإلكتروني مسجل مسبقًا.' });
    }

    const emailOn = isEmailEnabled();
    // لا يُمنح أي مستخدم جديد صلاحية الإدارة عبر التسجيل أبدًا
    const user = await User.create({
      name: String(name).trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'user',
      lastLoginAt: new Date(),
      emailVerified: !emailOn,
    });

    if (emailOn) {
      sendVerificationEmail(user).catch((err) => console.error('Verification mail error:', err.message));
    }

    sendTokenResponse(res, user, 201);
  } catch (error) {
    res.status(500).json({ message: 'تعذر إنشاء الحساب.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'تم حظر الحساب. تواصل مع الإدارة.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    sendTokenResponse(res, user, 200);
  } catch (error) {
    res.status(500).json({ message: 'تعذر تسجيل الدخول.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const raw = String(req.body.token || '');
    if (!raw) return res.status(400).json({ message: 'رابط التأكيد غير صالح.' });

    const user = await User.findOne({
      emailVerifyToken: hashToken(raw),
      emailVerifyExpires: { $gt: new Date() },
    }).select('+emailVerifyToken +emailVerifyExpires');

    if (!user) {
      return res.status(400).json({ message: 'رابط التأكيد غير صالح أو منتهي. اطلب رابطًا جديدًا من حسابك.' });
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();
    res.json({ message: 'تم تأكيد بريدك الإلكتروني بنجاح.' });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تأكيد البريد.' });
  }
};

const resendVerification = async (req, res) => {
  try {
    if (!isEmailEnabled()) {
      return res.json({ message: 'خدمة البريد غير مفعّلة، حسابك يعمل دون حاجة للتأكيد.' });
    }
    const user = await User.findById(req.user._id);
    if (user.emailVerified !== false) {
      return res.json({ message: 'بريدك مؤكد مسبقًا.' });
    }
    await sendVerificationEmail(user);
    res.json({ message: 'تم إرسال رابط التأكيد إلى بريدك.' });
  } catch (error) {
    res.status(500).json({ message: 'تعذر إرسال رابط التأكيد.' });
  }
};

const forgotPassword = async (req, res) => {
  const genericMessage = 'إذا كان البريد مسجلًا لدينا فقد أرسلنا إليه رابط استعادة كلمة المرور.';
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ message: 'يرجى إدخال البريد الإلكتروني.' });

    const user = await User.findOne({ email });
    if (user && !user.isBlocked) {
      const raw = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = hashToken(raw);
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      await sendMail({
        to: user.email,
        subject: 'استعادة كلمة المرور - Wattar Chair',
        title: 'استعادة كلمة المرور',
        text: 'وصلنا طلب لاستعادة كلمة المرور. الرابط صالح لمدة ساعة. إن لم تطلب ذلك فتجاهل الرسالة.',
        bodyHtml: 'وصلنا طلب لاستعادة كلمة المرور. الرابط صالح لمدة ساعة. إن لم تطلب ذلك فتجاهل الرسالة.',
        buttonText: 'تعيين كلمة مرور جديدة',
        buttonUrl: `${clientUrl()}/reset-password?token=${raw}`,
      });
    }
    // نفس الرد دائمًا حتى لا يمكن معرفة البريدات المسجلة
    res.json({ message: genericMessage });
  } catch (error) {
    res.status(500).json({ message: 'تعذر معالجة الطلب.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const raw = String(req.body.token || '');
    const password = String(req.body.password || '');

    if (password.length < 8) {
      return res.status(400).json({ message: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.' });
    }

    const user = await User.findOne({
      passwordResetToken: hashToken(raw),
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'رابط الاستعادة غير صالح أو منتهي. اطلب رابطًا جديدًا.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // استلام الرابط عبر البريد يثبت ملكيته
    user.emailVerified = true;
    await user.save();
    res.json({ message: 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.' });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تغيير كلمة المرور.' });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'تم تسجيل الخروج بنجاح.' });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites', 'name price images description category subcategory featured inStock ratingAverage options').lean();
    const showPrices = await canSeePrices(req);
    const cart = await cartFor(req, await populatedCart(req.user._id));
    const favorites = showPrices ? user.favorites || [] : stripProducts(user.favorites || []);

    const plainUser = sanitizeUser({ ...user, cart, favorites });
    res.json({ user: plainUser });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل بيانات المستخدم.' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل المستخدمين.' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role, isBlocked } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود.' });
    }

    if (user._id.toString() === req.user._id.toString() && (role === 'user' || isBlocked === true)) {
      return res.status(400).json({ message: 'لا يمكنك تغيير صلاحياتك أو حظر حسابك بنفسك.' });
    }

    if (role) {
      user.role = ['user', 'admin'].includes(role) ? role : user.role;
    }

    if (typeof isBlocked === 'boolean') {
      user.isBlocked = isBlocked;
    }

    await user.save();
    res.json({ message: 'تم تحديث بيانات المستخدم بنجاح.', user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحديث بيانات المستخدم.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'المشترك غير موجود.' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'لا يمكنك حذف حسابك الحالي.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'لا يمكن حذف حساب مدير. أزل صلاحية الإدارة أولًا.' });
    }

    // حذف بيانات المشترك المرتبطة وإعادة حساب تقييمات المنتجات المتأثرة
    const userReviews = await Review.find({ user: user._id }).select('product');
    const affectedProducts = [...new Set(userReviews.map((r) => r.product.toString()))];

    await Review.deleteMany({ user: user._id });
    await Comment.deleteMany({ user: user._id });
    await user.deleteOne();

    for (const productId of affectedProducts) {
      await recalculateProductRating(new mongoose.Types.ObjectId(productId));
    }

    res.json({ message: 'تم حذف المشترك بنجاح.', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'تعذر حذف المشترك.' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'معرف المنتج مطلوب.' });
    }

    const user = await User.findById(req.user._id);
    const hasFavorite = user.favorites.some((id) => id.toString() === productId);

    if (hasFavorite) {
      user.favorites = user.favorites.filter((id) => id.toString() !== productId);
    } else {
      user.favorites.push(productId);
    }

    await user.save();
    res.json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحديث المفضلة.' });
  }
};

const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites', 'name price images description category subcategory featured inStock ratingAverage options');
    res.json({ favorites: (await canSeePrices(req)) ? user.favorites : stripProducts(user.favorites) });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل المفضلة.' });
  }
};

// يتحقق من الخيارات (اللون/القماش) حسب ما يعرّفه المنتج
const resolveOptions = (product, body) => {
  const colors = product.options?.colors || [];
  const fabrics = product.options?.fabrics || [];
  const color = String(body.color || '').trim();
  const colorHex = String(body.colorHex || '').trim();
  const fabric = String(body.fabric || '').trim();
  const selectedColor = colors.find((option) =>
    option.name === color && (!colorHex || option.hex === colorHex)
  );

  if (colors.length) {
    if (!color) return { error: 'اختر اللون أولًا.' };
    if (!selectedColor) return { error: 'اللون المختار غير متاح.' };
  }
  if (fabrics.length) {
    if (!fabric) return { error: 'اختر القماش أولًا.' };
    if (!fabrics.includes(fabric)) return { error: 'القماش المختار غير متاح.' };
  }

  return {
    color: colors.length ? color : '',
    colorHex: selectedColor?.hex || '',
    fabric: fabrics.length ? fabric : '',
  };
};

const sameLine = (item, productId, color, fabric, colorHex = '') =>
  item.product.toString() === String(productId) &&
  (item.color || '') === (color || '') &&
  (item.colorHex || '') === (colorHex || '') &&
  (item.fabric || '') === (fabric || '');

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'معرف المنتج مطلوب.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود.' });
    }
    if (!product.inStock) {
      return res.status(400).json({ message: 'هذا المنتج غير متوفر حاليًا.' });
    }

    const opts = resolveOptions(product, req.body);
    if (opts.error) {
      return res.status(400).json({ message: opts.error });
    }

    const user = await User.findById(req.user._id);
    const existingItem = user.cart.find((item) => sameLine(item, productId, opts.color, opts.fabric, opts.colorHex));

    if (existingItem) {
      existingItem.quantity = clampQty(existingItem.quantity + clampQty(quantity));
    } else {
      user.cart.push({ product: productId, quantity: clampQty(quantity), color: opts.color, colorHex: opts.colorHex, fabric: opts.fabric });
    }

    await user.save();
    res.json({ cart: await cartFor(req, await populatedCart(user._id)) });
  } catch (error) {
    res.status(500).json({ message: 'تعذر إضافة المنتج إلى السلة.' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity, color = '', colorHex = '', fabric = '' } = req.body;
    const user = await User.findById(req.user._id);
    const item = user.cart.find((entry) => sameLine(entry, productId, color, fabric, colorHex));

    if (!item) {
      return res.status(404).json({ message: 'العنصر غير موجود في السلة.' });
    }

    item.quantity = clampQty(quantity);
    await user.save();
    res.json({ cart: await cartFor(req, await populatedCart(user._id)) });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحديث السلة.' });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { color = '', colorHex = '', fabric = '' } = req.query;
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter((item) => !sameLine(item, req.params.productId, color, fabric, colorHex));
    await user.save();
    res.json({ cart: await cartFor(req, await populatedCart(user._id)) });
  } catch (error) {
    res.status(500).json({ message: 'تعذر حذف المنتج من السلة.' });
  }
};

const getCart = async (req, res) => {
  try {
    res.json({ cart: await cartFor(req, await populatedCart(req.user._id)) });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل السلة.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  getUsers,
  updateUserRole,
  deleteUser,
  toggleFavorite,
  getFavorites,
  addToCart,
  updateCartItem,
  removeCartItem,
  getCart,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
