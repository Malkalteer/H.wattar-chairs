const express = require('express');
const { getComments, createComment, deleteComment } = require('../controllers/commentController');
const { protect, requireVerified } = require('../middleware/auth');

const router = express.Router();

router.get('/', getComments);
router.post('/', protect, requireVerified, createComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
