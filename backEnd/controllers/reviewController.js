const Review = require('../models/Review');
const Product = require('../models/Product');

const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingAverage: Number(stats[0].average.toFixed(1)),
      ratingCount: stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingAverage: 0,
      ratingCount: 0,
    });
  }
};

const getReviewsForProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name').sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل التقييمات.' });
  }
};

const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'التقييم يجب أن يكون بين 1 و 5.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود.' });
    }

    const existingReview = await Review.findOne({ product: productId, user: req.user._id });

    if (existingReview) {
      existingReview.rating = Number(rating);
      existingReview.comment = comment || '';
      await existingReview.save();
      await recalculateProductRating(productId);
      return res.json({ message: 'تم تحديث تقييمك بنجاح.', review: existingReview });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: Number(rating),
      comment: comment || '',
    });

    await recalculateProductRating(productId);
    res.status(201).json({ message: 'تم إضافة تقييمك بنجاح.', review });
  } catch (error) {
    res.status(500).json({ message: error.message || 'تعذر إضافة التقييم.' });
  }
};

const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'التقييم غير موجود.' });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'لا يمكنك تعديل تقييم مستخدم آخر.' });
    }

    const { rating, comment } = req.body;
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'التقييم يجب أن يكون بين 1 و 5.' });
    }

    review.rating = rating || review.rating;
    review.comment = comment !== undefined ? comment : review.comment;
    await review.save();
    await recalculateProductRating(review.product);

    res.json({ message: 'تم تحديث التقييم بنجاح.', review });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحديث التقييم.' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'التقييم غير موجود.' });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'لا يمكنك حذف تقييم مستخدم آخر.' });
    }

    await review.deleteOne();
    await recalculateProductRating(review.product);
    res.json({ message: 'تم حذف التقييم بنجاح.' });
  } catch (error) {
    res.status(500).json({ message: 'تعذر حذف التقييم.' });
  }
};

module.exports = {
  getReviewsForProduct,
  createReview,
  updateReview,
  deleteReview,
  recalculateProductRating,
};
