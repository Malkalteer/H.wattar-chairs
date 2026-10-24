const express = require('express');
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', getCategories);
router.post('/', protect, admin, createCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;
