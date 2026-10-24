const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, optionalAuth, admin } = require('../middleware/auth');
const upload = require('../config/upload');

const router = express.Router();

router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProductById);
router.post('/', protect, admin, upload.array('images', 5), upload.processImages, createProduct);
router.put('/:id', protect, admin, upload.array('images', 5), upload.processImages, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
