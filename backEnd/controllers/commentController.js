const Comment = require('../models/Comment');

const MAX_PER_DAY = 3;

// عام: يعرض آخر التعليقات (بدون بيانات حساسة، الاسم فقط)
const getComments = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const comments = await Comment.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
    const total = await Comment.countDocuments();
    res.json({ comments, total });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل التعليقات.' });
  }
};

const createComment = async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    const rating = Number(req.body.rating) || 5;

    if (text.length < 3) {
      return res.status(400).json({ message: 'اكتب تعليقًا لا يقل عن 3 أحرف.' });
    }
    if (text.length > 500) {
      return res.status(400).json({ message: 'التعليق طويل جدًا (الحد الأقصى 500 حرف).' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'التقييم يجب أن يكون بين 1 و 5.' });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await Comment.countDocuments({ user: req.user._id, createdAt: { $gte: since } });
    if (recent >= MAX_PER_DAY) {
      return res.status(429).json({ message: 'وصلت للحد اليومي من التعليقات. حاول غدًا.' });
    }

    const comment = await Comment.create({ user: req.user._id, text, rating });
    await comment.populate('user', 'name');
    res.status(201).json({ message: 'شكرًا لك! تمت إضافة تعليقك.', comment });
  } catch (error) {
    res.status(500).json({ message: 'تعذر إضافة التعليق.' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'التعليق غير موجود.' });
    }

    const isOwner = comment.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'لا يمكنك حذف تعليق مستخدم آخر.' });
    }

    await comment.deleteOne();
    res.json({ message: 'تم حذف التعليق.' });
  } catch (error) {
    res.status(500).json({ message: 'تعذر حذف التعليق.' });
  }
};

module.exports = { getComments, createComment, deleteComment };
