const express = require('express');
const {
  getReviewsForProduct,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, requireVerified } = require('../middleware/auth');

const router = express.Router();

router.get('/product/:productId', getReviewsForProduct);
router.post('/product/:productId', protect, requireVerified, createReview);
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
