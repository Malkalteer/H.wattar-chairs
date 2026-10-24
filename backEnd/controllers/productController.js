const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const User = require('../models/User');
const { canSeePrices, stripProduct, stripProducts } = require('../utils/pricing');
const { removeUploads, filesToUrls } = require('../utils/files');

// يقرأ خيارات المنتج (الألوان والأقمشة) ويُنظّفها
const parseOptions = (raw) => {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (error) {
      value = {};
    }
  }
  value = value || {};

  const colors = (Array.isArray(value.colors) ? value.colors : [])
    .map((c) => ({
      name: String(c?.name || '').trim().slice(0, 30),
      hex: /^#[0-9a-f]{3,8}$/i.test(String(c?.hex || '').trim()) ? String(c.hex).trim() : '',
    }))
    .filter((c) => c.name);
  const fabrics = (Array.isArray(value.fabrics) ? value.fabrics : [])
    .map((f) => String(f || '').trim().slice(0, 40))
    .filter(Boolean);

  return { colors, fabrics };
};

const validateCategorySelection = async (categoryName, subcategoryName = '') => {
  const category = await Category.findOne({ name: String(categoryName || '').trim(), parent: null });
  if (!category) return 'اختر صنفًا رئيسيًا صالحًا.';

  const subcategory = String(subcategoryName || '').trim();
  if (subcategory && !(await Category.exists({ name: subcategory, parent: category._id }))) {
    return 'الصنف الفرعي لا يتبع الصنف الرئيسي المحدد.';
  }

  return null;
};

const getProducts = async (req, res) => {
  try {
    const showPrices = await canSeePrices(req);
    const { category, subcategory, search, featured, inStock } = req.query;
    // عند إخفاء الأسعار نتجاهل الترتيب والفلترة بالسعر حتى لا يمكن استنتاج الأسعار منهما
    const sort = showPrices || !String(req.query.sort || '').startsWith('price') ? req.query.sort : undefined;
    const minPrice = showPrices ? req.query.minPrice : undefined;
    const maxPrice = showPrices ? req.query.maxPrice : undefined;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }
    if (subcategory) {
      filter.subcategory = subcategory;
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    if (inStock === 'true') {
      filter.inStock = true;
    }

    const min = Number(minPrice);
    const max = Number(maxPrice);
    if ((minPrice !== undefined && minPrice !== '' && !Number.isNaN(min)) || (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(max))) {
      filter.price = {};
      if (minPrice !== undefined && minPrice !== '' && !Number.isNaN(min)) filter.price.$gte = min;
      if (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(max)) filter.price.$lte = max;
    }

    if (search) {
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' };
    }

    let query = Product.find(filter);

    if (sort === 'price-asc') {
      query = query.sort('price');
    } else if (sort === 'price-desc') {
      query = query.sort('-price');
    } else if (sort === 'rating') {
      query = query.sort('-ratingAverage -ratingCount');
    } else {
      query = query.sort('-createdAt');
    }

    const products = await query;
    res.json({ products: showPrices ? products : stripProducts(products) });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل المنتجات.' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود.' });
    }

    const reviews = await Review.find({ product: product._id }).populate('user', 'name').sort({ createdAt: -1 });
    res.json({ product: (await canSeePrices(req)) ? product : stripProduct(product), reviews });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل تفاصيل المنتج.' });
  }
};

const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    if (typeof productData.specs === 'string') {
      productData.specs = JSON.parse(productData.specs);
    }

    if (productData.options !== undefined) {
      productData.options = parseOptions(productData.options);
    }

    if (Array.isArray(req.files) && req.files.length) {
      productData.images = req.files.map((file) => `/uploads/${file.filename}`);
    }

    const categoryError = await validateCategorySelection(productData.category, productData.subcategory);
    if (categoryError) {
      removeUploads(filesToUrls(req.files));
      return res.status(400).json({ message: categoryError });
    }

    if (!Array.isArray(productData.images) || productData.images.length === 0) {
      productData.images = ['https://placehold.co/800x800/3f2d1f/fff?text=Wattar+Chair'];
    }

    const product = await Product.create({
      ...productData,
      price: Number(productData.price),
      featured: productData.featured === true || productData.featured === 'true',
      inStock: productData.inStock === true || productData.inStock === 'true',
    });

    res.status(201).json({ product, message: 'تمت إضافة المنتج بنجاح.' });
  } catch (error) {
    removeUploads(filesToUrls(req.files));
    res.status(500).json({ message: 'تعذر إنشاء المنتج. تأكد من صحة البيانات.' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      removeUploads(filesToUrls(req.files));
      return res.status(404).json({ message: 'المنتج غير موجود.' });
    }

    const updates = { ...req.body };

    if (updates.category !== undefined || updates.subcategory !== undefined) {
      const categoryError = await validateCategorySelection(
        updates.category ?? product.category,
        updates.subcategory ?? product.subcategory
      );
      if (categoryError) {
        removeUploads(filesToUrls(req.files));
        return res.status(400).json({ message: categoryError });
      }
    }

    if (typeof updates.specs === 'string') {
      updates.specs = JSON.parse(updates.specs);
    }

    if (updates.options !== undefined) {
      updates.options = parseOptions(updates.options);
    }

    let replacedImages = [];
    if (Array.isArray(req.files) && req.files.length) {
      // الصور الجديدة تستبدل القديمة؛ تُحذف القديمة بعد نجاح الحفظ فقط
      replacedImages = product.images;
      updates.images = filesToUrls(req.files);
    }

    if (updates.price) updates.price = Number(updates.price);
    updates.featured = updates.featured === true || updates.featured === 'true';
    updates.inStock = updates.inStock === true || updates.inStock === 'true';

    Object.assign(product, updates);
    await product.save();
    removeUploads(replacedImages);

    res.json({ product, message: 'تم تحديث المنتج بنجاح.' });
  } catch (error) {
    removeUploads(filesToUrls(req.files));
    res.status(500).json({ message: 'تعذر تحديث المنتج. تأكد من صحة البيانات.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود.' });
    }

    await Review.deleteMany({ product: product._id });
    // إزالة المنتج من سلات ومفضلات المستخدمين
    await User.updateMany({}, { $pull: { favorites: product._id, cart: { product: product._id } } });
    removeUploads(product.images);
    await product.deleteOne();
    res.json({ message: 'تم حذف المنتج بنجاح.' });
  } catch (error) {
    res.status(500).json({ message: 'تعذر حذف المنتج.' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
