const express = require('express');
const { getSiteSettings, updateSiteSettings } = require('../controllers/siteController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../config/upload');

const router = express.Router();

router.get('/', getSiteSettings);
router.put('/', protect, admin, upload.array('welcomeImages', 3), upload.processImages, updateSiteSettings);

module.exports = router;
