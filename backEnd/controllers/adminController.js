const Order = require('../models/Order');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Product = require('../models/Product');

const DAY = 24 * 60 * 60 * 1000;
const CHART_DAYS = 30;
const NOT_CANCELLED = { status: { $ne: 'cancelled' } };

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const dayKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// مجموع الإيرادات وعدد الطلبات ضمن فترة
const periodTotals = async (from, to) => {
  const [agg] = await Order.aggregate([
    { $match: { ...NOT_CANCELLED, createdAt: { $gte: from, $lt: to } } },
    { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
  ]);
  return { revenue: agg?.revenue || 0, orders: agg?.orders || 0 };
};

const getSummary = async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * DAY);
    const chartStart = startOfDay(new Date(now.getTime() - (CHART_DAYS - 1) * DAY));
    const periodStart = new Date(now.getTime() - 30 * DAY);
    const prevPeriodStart = new Date(now.getTime() - 60 * DAY);

    const [
      totalOrders,
      recentComments,
      users,
      newUsers,
      products,
      outOfStock,
      revenueAgg,
      statusAgg,
      dailyAgg,
      topProducts,
      recentOrders,
      current,
      previous,
      ratingAgg,
    ] = await Promise.all([
      Order.countDocuments(),
      Comment.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: periodStart } }),
      Product.countDocuments(),
      Product.countDocuments({ inStock: false }),
      Order.aggregate([{ $match: NOT_CANCELLED }, { $group: { _id: null, revenue: { $sum: '$total' } } }]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { ...NOT_CANCELLED, createdAt: { $gte: chartStart } } },
        { $project: { total: 1, createdAt: 1 } },
      ]),
      Order.aggregate([
        { $match: NOT_CANCELLED },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $last: '$items.name' },
            image: { $last: '$items.image' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('orderNumber customer.name total status createdAt items.quantity')
        .lean(),
      periodTotals(periodStart, now),
      periodTotals(prevPeriodStart, periodStart),
      Product.aggregate([{ $group: { _id: null, count: { $sum: '$ratingCount' } } }]),
    ]);

    const byStatus = Object.fromEntries(statusAgg.map((s) => [s._id, s.count]));

    // نجمع اليوميات في JavaScript حتى تتطابق الأيام مع توقيت الخادم
    const buckets = new Map();
    for (let i = 0; i < CHART_DAYS; i += 1) {
      buckets.set(dayKey(chartStart.getTime() + i * DAY), { revenue: 0, orders: 0 });
    }
    dailyAgg.forEach((order) => {
      const bucket = buckets.get(dayKey(order.createdAt));
      if (bucket) {
        bucket.revenue += order.total || 0;
        bucket.orders += 1;
      }
    });

    res.json({
      summary: {
        newOrders: byStatus.new || 0,
        inProduction: byStatus.in_production || 0,
        totalOrders,
        recentComments,
        users,
        newUsers,
        products,
        outOfStock,
        ratings: ratingAgg[0]?.count || 0,
        revenue: revenueAgg[0]?.revenue || 0,
        notifications: byStatus.new || 0,
        byStatus,
        period: { current, previous },
        daily: Array.from(buckets, ([date, values]) => ({ date, ...values })),
        topProducts,
        recentOrders: recentOrders.map((order) => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          customer: order.customer?.name || '',
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
          items: (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0),
        })),
      },
    });
  } catch (error) {
    console.error('getSummary error:', error.message);
    res.status(500).json({ message: 'تعذر تحميل الملخص.' });
  }
};

module.exports = { getSummary };
