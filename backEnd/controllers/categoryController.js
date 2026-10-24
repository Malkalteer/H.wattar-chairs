const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const ensureDefaultCategories = async () => {
  const existingNames = new Set(await Category.distinct('name', { parent: null }));
  const productCategories = await Product.distinct('category');
  for (const name of productCategories.filter((value) => value && !existingNames.has(value))) {
    try {
      await Category.updateOne(
        { name, parent: null },
        { $setOnInsert: { name, parent: null } },
        { upsert: true }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
};

const getCategories = async (req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await Category.find().populate('parent', 'name').sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل الأصناف.' });
  }
};

const createCategory = async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 60) {
      return res.status(400).json({ message: 'اسم الصنف مطلوب ويجب ألا يتجاوز 60 حرفًا.' });
    }

    let parent = null;
    if (req.body.parentId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.parentId)) {
        return res.status(400).json({ message: 'الصنف الرئيسي المحدد غير صالح.' });
      }
      parent = await Category.findById(req.body.parentId);
      if (!parent || parent.parent) {
        return res.status(400).json({ message: 'الصنف الرئيسي المحدد غير صالح.' });
      }
    }

    const duplicate = await Category.findOne({
      parent: parent?._id || null,
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
    if (duplicate) {
      return res.status(409).json({ message: 'يوجد صنف بهذا الاسم ضمن هذا التصنيف.' });
    }

    const category = await Category.create({ name, parent: parent?._id || null });
    await category.populate('parent', 'name');
    res.status(201).json({ category, message: 'تمت إضافة الصنف بنجاح.' });
  } catch (error) {
    res.status(500).json({ message: 'تعذرت إضافة الصنف.' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'الصنف غير موجود.' });
    }
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'الصنف غير موجود.' });

    if (await Category.exists({ parent: category._id })) {
      return res.status(400).json({ message: 'احذف الأصناف الفرعية أولًا.' });
    }

    const productFilter = category.parent
      ? { category: (await Category.findById(category.parent))?.name, subcategory: category.name }
      : { category: category.name };
    if (await Product.exists(productFilter)) {
      return res.status(400).json({ message: 'لا يمكن حذف صنف مرتبط بمنتج. غيّر صنف المنتج أولًا.' });
    }

    await category.deleteOne();
    res.json({ message: 'تم حذف الصنف بنجاح.' });
  } catch (error) {
    res.status(500).json({ message: 'تعذر حذف الصنف.' });
  }
};

module.exports = { getCategories, createCategory, deleteCategory };
