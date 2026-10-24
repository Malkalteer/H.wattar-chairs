const crypto = require('crypto');
const Order = require('../models/Order');
const { ORDER_STATUSES } = require('../models/Order');
const User = require('../models/User');
const { sendMail, notifyAdmin, escapeHtml } = require('../utils/mailer');
const { formatMoney } = require('../config/locale');
const { canSeePrices, stripOrder, stripOrders } = require('../utils/pricing');

const STATUS_LABELS = {
  new: 'جديد',
  confirmed: 'تم التأكيد',
  in_production: 'قيد التصنيع',
  ready: 'جاهز للتسليم',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

const PHONE_REGEX = /^[+\d\s()-]{7,20}$/;

const generateOrderNumber = () => {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `WT-${ymd}-${crypto.randomInt(1000, 10000)}`;
};

const createOrder = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const city = String(req.body.city || '').trim();
    const address = String(req.body.address || '').trim();
    const notes = String(req.body.notes || '').trim().slice(0, 500);

    if (name.length < 2) return res.status(400).json({ message: 'يرجى إدخال الاسم.' });
    if (!PHONE_REGEX.test(phone)) return res.status(400).json({ message: 'يرجى إدخال رقم جوال صحيح.' });
    if (address.length < 5) return res.status(400).json({ message: 'يرجى إدخال عنوان التوصيل بالتفصيل.' });

    const user = await User.findById(req.user._id).populate('cart.product');
    const lines = (user.cart || []).filter((item) => item.product);

    if (!lines.length) {
      return res.status(400).json({ message: 'السلة فارغة.' });
    }

    const unavailable = lines.filter((item) => !item.product.inStock).map((item) => item.product.name);
    if (unavailable.length) {
      return res.status(400).json({ message: `المنتجات التالية لم تعد متوفرة: ${unavailable.join('، ')}. احذفها من السلة للمتابعة.` });
    }

    // الأسعار تُؤخذ من قاعدة البيانات وليس من العميل
    const items = lines.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.images?.[0] || '',
      quantity: item.quantity,
      color: item.color || '',
      colorHex: item.colorHex || '',
      fabric: item.fabric || '',
    }));
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let order = null;
    for (let attempt = 0; attempt < 5 && !order; attempt += 1) {
      try {
        order = await Order.create({
          orderNumber: generateOrderNumber(),
          user: user._id,
          items,
          total,
          customer: { name, phone, city, address, notes },
          status: 'new',
          statusHistory: [{ status: 'new', note: 'تم استلام الطلب' }],
        });
      } catch (error) {
        if (error.code !== 11000) throw error; // رقم طلب مكرر: نعيد المحاولة
      }
    }
    if (!order) return res.status(500).json({ message: 'تعذر إنشاء الطلب. حاول مرة أخرى.' });

    user.cart = [];
    await user.save();

    notifyAdmin(
      `طلب جديد ${order.orderNumber}`,
      `طلب جديد من ${name} (${phone})\nالإجمالي: ${formatMoney(total)}\nعدد المنتجات: ${items.length}`,
      '/admin'
    );

    res.status(201).json({ message: 'تم استلام طلبك بنجاح!', order: (await canSeePrices(req)) ? order : stripOrder(order) });
  } catch (error) {
    console.error('createOrder error:', error.message);
    res.status(500).json({ message: 'تعذر إنشاء الطلب.' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders: (await canSeePrices(req)) ? orders : stripOrders(orders) });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل الطلبات.' });
  }
};

const cancelMyOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود.' });

    if (order.status !== 'new') {
      return res.status(400).json({ message: 'لا يمكن إلغاء الطلب بعد بدء معالجته. تواصل معنا عبر واتساب.' });
    }

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: 'ألغاه العميل' });
    await order.save();

    notifyAdmin(`تم إلغاء الطلب ${order.orderNumber}`, `قام العميل ${order.customer.name} بإلغاء طلبه.`);
    res.json({ message: 'تم إلغاء الطلب.', order: (await canSeePrices(req)) ? order : stripOrder(order) });
  } catch (error) {
    res.status(500).json({ message: 'تعذر إلغاء الطلب.' });
  }
};

// ---- الإدارة ----
const getAllOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && ORDER_STATUSES.includes(req.query.status)) filter.status = req.query.status;

    const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(300);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل الطلبات.' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const note = String(req.body.note || '').trim().slice(0, 300);

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'حالة غير صالحة.' });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود.' });

    if (order.status !== status) {
      order.status = status;
      order.statusHistory.push({ status, note });
      await order.save();

      if (order.user?.email) {
        sendMail({
          to: order.user.email,
          subject: `تحديث حالة طلبك ${order.orderNumber}`,
          title: 'تحديث على طلبك',
          text: `حالة طلبك ${order.orderNumber} الآن: ${STATUS_LABELS[status]}${note ? `\n${note}` : ''}`,
          bodyHtml: `حالة طلبك <b>${escapeHtml(order.orderNumber)}</b> أصبحت: <b>${STATUS_LABELS[status]}</b>${note ? `<br>${escapeHtml(note)}` : ''}`,
          buttonText: 'تتبع طلباتي',
          buttonUrl: `${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')}/orders`,
        });
      }
    }

    res.json({ message: 'تم تحديث حالة الطلب.', order });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحديث الطلب.' });
  }
};

module.exports = { createOrder, getMyOrders, cancelMyOrder, getAllOrders, updateOrderStatus };
