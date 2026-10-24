const express = require('express');
const rateLimit = require('express-rate-limit');
const { createOrder, getMyOrders, cancelMyOrder, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, admin, requireVerified } = require('../middleware/auth');

const router = express.Router();
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'عدد كبير من الطلبات. حاول لاحقًا.' },
});

router.post('/', protect, requireVerified, orderLimiter, createOrder);
router.get('/mine', protect, getMyOrders);
router.put('/:id/cancel', protect, cancelMyOrder);
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
