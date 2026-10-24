const express = require('express');
const {
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
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.get('/users', protect, admin, getUsers);
router.put('/users/:id', protect, admin, updateUserRole);
router.delete('/users/:id', protect, admin, deleteUser);
router.post('/favorites', protect, toggleFavorite);
router.get('/favorites', protect, getFavorites);
router.get('/cart', protect, getCart);
router.post('/cart', protect, addToCart);
router.put('/cart', protect, updateCartItem);
router.delete('/cart/:productId', protect, removeCartItem);

module.exports = router;
