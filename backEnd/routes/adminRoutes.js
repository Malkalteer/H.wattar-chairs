const express = require('express');
const { getSummary } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', protect, admin, getSummary);

module.exports = router;
