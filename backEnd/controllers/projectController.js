const Project = require('../models/Project');
const { removeUploads, filesToUrls } = require('../utils/files');

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل المعرض.' });
  }
};

const createProject = async (req, res) => {
  const images = filesToUrls(req.files);
  try {
    const title = String(req.body.title || '').trim();
    if (!title) {
      removeUploads(images);
      return res.status(400).json({ message: 'عنوان المشروع مطلوب.' });
    }
    if (!images.length) {
      return res.status(400).json({ message: 'أضف صورة واحدة على الأقل.' });
    }

    const project = await Project.create({
      title,
      description: String(req.body.description || ''),
      category: String(req.body.category || 'أخرى'),
      images,
    });
    res.status(201).json({ message: 'تمت إضافة المشروع.', project });
  } catch (error) {
    removeUploads(images);
    res.status(500).json({ message: 'تعذر إضافة المشروع.' });
  }
};

const updateProject = async (req, res) => {
  const newImages = filesToUrls(req.files);
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      removeUploads(newImages);
      return res.status(404).json({ message: 'المشروع غير موجود.' });
    }

    if (req.body.title !== undefined) project.title = String(req.body.title).trim() || project.title;
    if (req.body.description !== undefined) project.description = String(req.body.description);
    if (req.body.category !== undefined) project.category = String(req.body.category);

    // إضافة صور جديدة (مع حد أقصى 10 صور للمشروع)
    if (newImages.length) project.images = [...project.images, ...newImages].slice(0, 10);

    // حذف صور محددة
    let toRemove = req.body.removeImages;
    if (typeof toRemove === 'string') toRemove = [toRemove];
    if (Array.isArray(toRemove) && toRemove.length) {
      const removable = project.images.filter((img) => toRemove.includes(img));
      if (project.images.length - removable.length >= 1) {
        project.images = project.images.filter((img) => !removable.includes(img));
        removeUploads(removable);
      }
    }

    await project.save();
    res.json({ message: 'تم تحديث المشروع.', project });
  } catch (error) {
    removeUploads(newImages);
    res.status(500).json({ message: 'تعذر تحديث المشروع.' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'المشروع غير موجود.' });
    removeUploads(project.images);
    await project.deleteOne();
    res.json({ message: 'تم حذف المشروع.' });
  } catch (error) {
    res.status(500).json({ message: 'تعذر حذف المشروع.' });
  }
};

module.exports = { getProjects, createProject, updateProject, deleteProject };
