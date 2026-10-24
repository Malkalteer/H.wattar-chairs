const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const { chatWithAI } = require('../controllers/aiController');

const router = express.Router();
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'لقد تجاوزت الحد المسموح. حاول مرة أخرى بعد دقيقة.' },
});

router.post('/chat', protect, aiLimiter, chatWithAI);

module.exports = router;
