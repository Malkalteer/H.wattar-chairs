const SiteSettings = require('../models/SiteSettings');

// إظهار الأسعار يُفرض هنا في الخادم (وليس بإخفاء النص في الواجهة فقط)،
// حتى لا يمكن قراءة الأسعار من استجابات الـ API عندما يطفئ المدير الخاصية.
const TTL_MS = 5000;
let cache = { value: true, at: 0 };

const pricesEnabled = async () => {
  if (Date.now() - cache.at < TTL_MS) return cache.value;
  const settings = await SiteSettings.findOne().select('showPrices').lean();
  cache = { value: settings?.showPrices !== false, at: Date.now() };
  return cache.value;
};

const invalidatePricesCache = () => {
  cache.at = 0;
};

// المدير يرى الأسعار دائمًا (لإدارة المنتجات)، والبقية حسب إعداد الموقع
const canSeePrices = async (req) => req.user?.role === 'admin' || pricesEnabled();

const plain = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc);

const stripProduct = (product) => {
  if (!product) return product;
  const { price, ...rest } = plain(product); // eslint-disable-line no-unused-vars
  return rest;
};

const stripProducts = (products) => (Array.isArray(products) ? products.map(stripProduct) : products);

const stripCart = (cart) => (Array.isArray(cart) ? cart.map((item) => ({ ...plain(item), product: stripProduct(plain(item).product) })) : cart);

const stripOrder = (order) => {
  const { total, ...rest } = plain(order); // eslint-disable-line no-unused-vars
  return { ...rest, items: (rest.items || []).map(({ price, ...item }) => item) }; // eslint-disable-line no-unused-vars
};

const stripOrders = (orders) => (Array.isArray(orders) ? orders.map(stripOrder) : orders);

module.exports = { pricesEnabled, canSeePrices, invalidatePricesCache, stripProduct, stripProducts, stripCart, stripOrder, stripOrders };
