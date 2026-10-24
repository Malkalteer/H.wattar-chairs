const express = require('express');
const { getProjects, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../config/upload');

const router = express.Router();

router.get('/', getProjects);
router.post('/', protect, admin, upload.array('images', 5), upload.processImages, createProject);
router.put('/:id', protect, admin, upload.array('images', 5), upload.processImages, updateProject);
router.delete('/:id', protect, admin, deleteProject);

module.exports = router;
