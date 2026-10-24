const Order = require('../models/Order');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Product = require('../models/Product');

const getSummary = async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [newOrders, totalOrders, recentComments, users, products, revenueAgg, inProduction] = await Promise.all([
      Order.countDocuments({ status: 'new' }),
      Order.countDocuments(),
      Comment.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ status: 'in_production' }),
    ]);

    res.json({
      summary: {
        newOrders,
        totalOrders,
        recentComments,
        users,
        products,
        inProduction,
        revenue: revenueAgg[0]?.revenue || 0,
        notifications: newOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل الملخص.' });
  }
};

module.exports = { getSummary };
