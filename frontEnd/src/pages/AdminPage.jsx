import { useEffect, useState } from 'react';
import { Banknote, ClipboardList, MessageSquareQuote, Package, Plus, Search, ShieldCheck, ShieldOff, Star, Trash2, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { defaultSiteContent, mergeSiteSettings } from '../data/siteContent';
import LoginPrompt from '../components/ui/LoginPrompt';
import SectionHeading from '../components/ui/SectionHeading';
import Seo from '../components/Seo';
import ColorLabel from '../components/ui/ColorLabel';
import OrdersAdmin from './admin/OrdersAdmin';
import ProjectsAdmin from './admin/ProjectsAdmin';
import { formatCurrency, formatDate, imageUrl } from '../utils/format';
import { EXAMPLE_WHATSAPP } from '../config/locale';
import { panelClass } from './admin/adminUi';

const fieldClass = 'w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-2.5 text-right text-sm outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900';

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-[28px] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,242,236,0.94))] p-5 shadow-[0_18px_35px_rgba(61,46,32,0.07)] dark:border-stone-700 dark:bg-[linear-gradient(135deg,rgba(31,27,24,0.98),rgba(21,18,17,0.96))]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-stone-500 dark:text-stone-400">{label}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7e7d4] text-brand-800 shadow-sm dark:bg-brand-900/30 dark:text-brand-200">{icon}</span>
      </div>
      <div className="text-2xl font-black text-stone-900 dark:text-stone-100">{value}</div>
    </div>
  );
}

export default function AdminPage({ onSettingsSaved }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryParentId, setNewSubcategoryParentId] = useState('');
  const [summary, setSummary] = useState(null);
  const [tab, setTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [siteData, setSiteData] = useState(defaultSiteContent);
  const [selectedWelcomeImages, setSelectedWelcomeImages] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    inStock: true,
    featured: false,
    optionColors: [],
    optFabrics: '',
  });

  const loadSummary = async () => {
    try {
      const { data } = await api.get('/admin/summary');
      setSummary(data.summary);
    } catch (error) {
      // الملخص اختياري
    }
  };

  const loadData = async () => {
    try {
      const [productsRes, usersRes, settingsRes, commentsRes, categoriesRes] = await Promise.all([
        api.get('/products'),
        api.get('/auth/users'),
        api.get('/site'),
        api.get('/comments', { params: { limit: 100 } }),
        api.get('/categories'),
      ]);

      setComments(commentsRes.data.comments || []);
      const loadedCategories = categoriesRes.data.categories || [];
      const mainCategories = loadedCategories.filter((category) => !category.parent);
      setCategories(loadedCategories);
      setProductForm((current) => {
        const selectedCategory = mainCategories.some((category) => category.name === current.category)
          ? current.category
          : mainCategories[0]?.name || '';
        const hasSubcategory = loadedCategories.some(
          (category) => category.parent?.name === selectedCategory && category.name === current.subcategory
        );
        return {
          ...current,
          category: selectedCategory,
          subcategory: hasSubcategory ? current.subcategory : '',
        };
      });
      loadSummary();

      setProducts(productsRes.data.products || []);
      setUsers(usersRes.data.users || []);
      setSiteData(mergeSiteSettings(settingsRes.data.settings || {}));
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل لوحة التحكم.');
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadData();
  }, [user]);

  if (!user || user.role !== 'admin') return <LoginPrompt text="يجب أن تكون مديرًا للوصول إلى لوحة التحكم." />;

  const resetProductForm = () => {
    setSelectedImages([]);
    setEditingProductId(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: categories.find((category) => !category.parent)?.name || '',
      subcategory: '',
      inStock: true,
      featured: false,
      optionColors: [],
      optFabrics: '',
    });
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', Number(productForm.price));
      formData.append('category', productForm.category);
      formData.append('subcategory', productForm.subcategory || '');
      formData.append('featured', String(productForm.featured));
      formData.append('inStock', String(productForm.inStock));

      formData.append('options', JSON.stringify({
        colors: productForm.optionColors.map((color) => ({
          name: color.name.trim() || color.hex,
          hex: color.hex,
        })),
        fabrics: productForm.optFabrics.split(/[,،]/).map((f) => f.trim()).filter(Boolean),
      }));

      if (selectedImages.length) {
        Array.from(selectedImages).forEach((file) => formData.append('images', file));
      }

      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, formData);
        toast.success('تم تحديث المنتج بنجاح.');
      } else {
        await api.post('/products', formData);
        toast.success('تمت إضافة المنتج بنجاح.');
      }

      resetProductForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حفظ المنتج.');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product._id);
    setSelectedImages([]);
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      subcategory: product.subcategory || '',
      inStock: product.inStock,
      featured: product.featured,
      optionColors: (product.options?.colors || []).map((color) => ({
        name: color.name || '',
        hex: color.hex || '#000000',
      })),
      optFabrics: (product.options?.fabrics || []).join('، '),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateCategory = async (e, parentId = null) => {
    e.preventDefault();
    const name = parentId ? newSubcategoryName : newCategoryName;
    try {
      const { data } = await api.post('/categories', { name, ...(parentId ? { parentId } : {}) });
      setCategories((current) => [...current, data.category]);
      if (parentId) {
        setNewSubcategoryName('');
        setNewSubcategoryParentId(parentId);
      } else {
        setNewCategoryName('');
        if (!productForm.category) setProductForm((current) => ({ ...current, category: data.category.name }));
      }
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذرت إضافة الصنف.');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`هل تريد حذف الصنف "${category.name}"؟`)) return;
    try {
      await api.delete(`/categories/${category._id}`);
      setCategories((current) => current.filter((item) => item._id !== category._id));
      if (productForm.category === category.name) {
        const nextMain = categories.find((item) => !item.parent && item._id !== category._id);
        setProductForm((current) => ({ ...current, category: nextMain?.name || '', subcategory: '' }));
      } else if (productForm.subcategory === category.name) {
        setProductForm((current) => ({ ...current, subcategory: '' }));
      }
      if (newSubcategoryParentId === category._id) setNewSubcategoryParentId('');
      toast.success('تم حذف الصنف.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حذف الصنف.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      await api.delete(`/products/${productId}`);
      toast.success('تم حذف المنتج بنجاح.');
      if (editingProductId === productId) resetProductForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حذف المنتج.');
    }
  };

  const handleDeleteUser = async (subscriber) => {
    if (!window.confirm(`هل أنت متأكد من حذف المشترك "${subscriber.name}"؟ سيتم حذف تقييماته وتعليقاته أيضًا ولا يمكن التراجع.`)) return;

    try {
      await api.delete(`/auth/users/${subscriber._id}`);
      toast.success('تم حذف المشترك بنجاح.');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حذف المشترك.');
    }
  };

  const handleToggleBlock = async (subscriber) => {
    try {
      await api.put(`/auth/users/${subscriber._id}`, { isBlocked: !subscriber.isBlocked });
      toast.success(subscriber.isBlocked ? 'تم إلغاء الحظر.' : 'تم حظر المشترك.');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحديث المشترك.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('حذف هذا التعليق؟')) return;

    try {
      await api.delete(`/comments/${commentId}`);
      toast.success('تم حذف التعليق.');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حذف التعليق.');
    }
  };

  const filteredUsers = users.filter((item) => {
    const q = userSearch.trim().toLowerCase();
    return !q || item.name?.toLowerCase().includes(q) || item.email?.toLowerCase().includes(q);
  });

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      const imageIndexes = [];
      siteData.welcomeSlides.forEach((slide, index) => {
        const file = selectedWelcomeImages[index];
        if (!file) return;
        imageIndexes.push(index);
        formData.append('welcomeImages', file);
      });
      formData.append('welcomeImageIndexes', JSON.stringify(imageIndexes));
      formData.append('settings', JSON.stringify({
        ...siteData,
        welcomeMessages: siteData.welcomeSlides.map((slide) => slide.text),
      }));

      const { data } = await api.put('/site', formData);
      const updatedSettings = mergeSiteSettings(data.settings);
      setSiteData(updatedSettings);
      setSelectedWelcomeImages({});
      // تحديث فوري لكامل الموقع (الأزرار والفوتر والرسائل) دون إعادة تحميل
      onSettingsSaved?.(updatedSettings);
      toast.success('تم تحديث إعدادات الموقع، وسيُطبَّق الرقم الجديد على كامل الموقع.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحديث الإعدادات.');
    }
  };

  const tabs = [
    { key: 'overview', label: 'نظرة عامة' },
    { key: 'orders', label: 'الطلبات', badge: summary?.newOrders },
    { key: 'products', label: 'المنتجات' },
    { key: 'projects', label: 'المعرض' },
    { key: 'users', label: 'المشتركون والتعليقات' },
    { key: 'settings', label: 'إعدادات الموقع' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Seo title="لوحة التحكم" />
      <SectionHeading title="لوحة التحكم" subtitle="إدارة الموقع والطلبات والمنتجات" />

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`relative shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition ${tab === item.key ? 'bg-brand-700 text-white shadow-lg shadow-brand-700/20' : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-200 dark:ring-stone-700'}`}
          >
            {item.label}
            {item.badge > 0 && <span className="me-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {summary && summary.newOrders > 0 && (
            <div className="mb-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setTab('orders')} className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-900/50">
                🔔 لديك {summary.newOrders} طلب جديد بانتظار المعالجة
              </button>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="إجمالي الطلبات" value={summary?.totalOrders ?? '—'} icon={<ClipboardList size={18} />} />
            <StatCard label="الإيرادات (بدون الملغي)" value={summary ? formatCurrency(summary.revenue) : '—'} icon={<Banknote size={18} />} />
            <StatCard label="قيد التصنيع" value={summary?.inProduction ?? '—'} icon={<Package size={18} />} />
            <StatCard label="المنتجات" value={products.length} icon={<Package size={18} />} />
            <StatCard label="المشتركين" value={users.length} icon={<Users size={18} />} />
            <StatCard label="التقييمات" value={products.reduce((sum, product) => sum + Number(product.ratingCount || 0), 0)} icon={<Star size={18} />} />
            <StatCard label="تعليقات آخر 7 أيام" value={summary?.recentComments ?? '—'} icon={<MessageSquareQuote size={18} />} />
          </div>
        </>
      )}

      {tab === 'orders' && <OrdersAdmin onChanged={loadSummary} />}
      {tab === 'projects' && <ProjectsAdmin />}

      {tab === 'products' && (
      <div className="max-w-4xl">
        <section className={`${panelClass} mb-6`}>
          <h3 className="mb-2 text-xl font-black text-stone-900 dark:text-stone-100">إدارة الأصناف</h3>
          <p className="mb-5 text-sm leading-7 text-stone-600 dark:text-stone-300">
            أضف أصنافًا رئيسية، ثم أضف أصنافًا فرعية تحت الصنف الرئيسي عند الحاجة. يمكن أن يبقى الصنف الرئيسي بلا أصناف فرعية.
          </p>
          <form onSubmit={handleCreateCategory} className="mb-6 flex flex-wrap gap-3">
            <input
              required
              maxLength={60}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="اسم الصنف الرئيسي"
              className={`${fieldClass} min-w-[220px] flex-1`}
            />
            <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-medium text-white">
              إضافة صنف رئيسي
            </button>
          </form>

          <form
            onSubmit={(e) => handleCreateCategory(e, newSubcategoryParentId || categories.find((category) => !category.parent)?._id)}
            className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <select
              required
              value={newSubcategoryParentId || categories.find((category) => !category.parent)?._id || ''}
              onChange={(e) => setNewSubcategoryParentId(e.target.value)}
              className={fieldClass}
            >
              {categories.filter((category) => !category.parent).map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
            <input
              required
              maxLength={60}
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
              placeholder="اسم الصنف الفرعي"
              className={fieldClass}
            />
            <button
              type="submit"
              disabled={!categories.some((category) => !category.parent)}
              className="rounded-full bg-stone-800 px-5 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-stone-700"
            >
              إضافة صنف فرعي
            </button>
          </form>

          <div className="space-y-3">
            {categories.filter((category) => !category.parent).map((category) => (
              <div key={category._id} className="rounded-2xl border border-stone-200 p-4 dark:border-stone-700">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-stone-900 dark:text-stone-100">{category.name}</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category)}
                    aria-label={`حذف الصنف ${category.name}`}
                    className="rounded-full p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.filter((subcategory) => subcategory.parent?._id === category._id).map((subcategory) => (
                    <span key={subcategory._id} className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5 text-xs dark:bg-stone-800">
                      {subcategory.name}
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(subcategory)}
                        aria-label={`حذف الصنف الفرعي ${subcategory.name}`}
                        className="rounded-full p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {!categories.some((subcategory) => subcategory.parent?._id === category._id) && (
                    <span className="text-xs text-stone-500">لا توجد أصناف فرعية</span>
                  )}
                </div>
              </div>
            ))}
            {!categories.some((category) => !category.parent) && (
              <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-500 dark:bg-stone-900">
                لا توجد أصناف بعد. أضف صنفًا رئيسيًا للبدء.
              </p>
            )}
          </div>
        </section>

        <div className="rounded-[32px] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(249,245,240,0.92))] p-6 shadow-[0_22px_55px_rgba(58,39,23,0.08)] dark:border-stone-700 dark:bg-[linear-gradient(135deg,rgba(31,27,24,0.98),rgba(21,18,17,0.96))]">
          <h3 className="mb-4 text-xl font-black text-stone-900 dark:text-stone-100">{editingProductId ? 'تعديل المنتج' : 'إضافة منتج'}</h3>

          <form onSubmit={handleSubmitProduct} className="grid gap-4 md:grid-cols-2">
            <input
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="اسم المنتج"
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900 md:col-span-2"
            />
            <textarea
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="وصف المنتج"
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900 md:col-span-2"
              rows={3}
            />
            <input
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              placeholder="السعر"
              type="number"
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900"
            />
            <select
              value={productForm.category}
              required
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value, subcategory: '' })}
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900"
            >
              {categories.filter((category) => !category.parent).map((item) => (
                <option key={item._id} value={item.name}>{item.name}</option>
              ))}
            </select>
            <select
              value={productForm.subcategory}
              onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
              disabled={!categories.some((category) => category.parent?.name === productForm.category)}
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-right outline-none transition focus:border-brand-500 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900"
            >
              <option value="">بدون صنف فرعي</option>
              {categories.filter((category) => category.parent?.name === productForm.category).map((item) => (
                <option key={item._id} value={item.name}>{item.name}</option>
              ))}
            </select>
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <label className="font-medium text-stone-700 dark:text-stone-200">ألوان المنتج المتاحة للشراء</label>
                <button
                  type="button"
                  onClick={() => setProductForm({
                    ...productForm,
                    optionColors: [...productForm.optionColors, { name: '', hex: '#5f3426' }],
                  })}
                  className="flex items-center gap-1 rounded-full bg-brand-700 px-3 py-2 text-xs font-medium text-white"
                >
                  <Plus size={14} /> إضافة لون
                </button>
              </div>
              {productForm.optionColors.map((color, index) => (
                <div key={index} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white/70 p-3 dark:border-stone-700 dark:bg-stone-900/60">
                  <input
                    type="color"
                    value={color.hex}
                    aria-label={`اختيار اللون ${index + 1}`}
                    onChange={(e) => setProductForm({
                      ...productForm,
                      optionColors: productForm.optionColors.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, hex: e.target.value } : item
                      ),
                    })}
                    className="h-11 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-1"
                  />
                  <span className="font-mono text-xs text-stone-500" dir="ltr">{color.hex}</span>
                  <input
                    value={color.name}
                    onChange={(e) => setProductForm({
                      ...productForm,
                      optionColors: productForm.optionColors.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, name: e.target.value } : item
                      ),
                    })}
                    placeholder="اسم اللون (اختياري)"
                    className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-right text-sm outline-none focus:border-brand-500 dark:border-stone-700 dark:bg-stone-800"
                  />
                  <button
                    type="button"
                    aria-label="حذف اللون"
                    onClick={() => setProductForm({
                      ...productForm,
                      optionColors: productForm.optionColors.filter((_, itemIndex) => itemIndex !== index),
                    })}
                    className="rounded-full p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {!productForm.optionColors.length && <p className="text-xs text-stone-500">لا توجد ألوان محددة لهذا المنتج.</p>}
            </div>
            <input
              value={productForm.optFabrics}
              onChange={(e) => setProductForm({ ...productForm, optFabrics: e.target.value })}
              placeholder="أقمشة للاختيار عند الشراء: قطيفة، كتان (اختياري)"
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900 md:col-span-2"
            />
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 p-3 text-sm dark:border-stone-700 dark:bg-stone-900/50 md:col-span-2">
              <label className="block font-medium text-stone-700 dark:text-stone-200">صور المنتج (اختياري){editingProductId ? ' — رفع صور جديدة يستبدل القديمة' : ''}</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setSelectedImages(e.target.files)}
                className="mt-2 block w-full text-sm text-stone-600 file:mr-4 file:rounded-full file:border-0 file:bg-brand-700 file:px-4 file:py-2 file:text-white dark:text-stone-300"
              />
              {selectedImages?.length > 0 && <p className="mt-2 text-xs text-brand-700 dark:text-brand-200">{selectedImages.length} صورة محددة</p>}
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
              <input type="checkbox" checked={productForm.inStock} onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })} />
              متوفر
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
              <input type="checkbox" checked={productForm.featured} onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })} />
              مميز
            </label>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className="premium-button-primary flex-1 rounded-full px-4 py-3 text-white">
                {editingProductId ? 'تحديث المنتج' : 'حفظ المنتج'}
              </button>
              {editingProductId && (
                <button type="button" onClick={resetProductForm} className="premium-button-secondary rounded-full px-4 py-3 text-stone-700 dark:text-stone-200">
                  إلغاء
                </button>
              )}
            </div>
          </form>

          <div className="mt-8">
            <h3 className="mb-4 text-lg font-black text-stone-900 dark:text-stone-100">إدارة المنتجات</h3>
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product._id} className="flex items-center justify-between gap-3 rounded-[22px] border border-stone-200 bg-white/70 p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900/60">
                  <div className="flex items-center gap-3">
                    <img src={imageUrl(product.images?.[0], 'https://placehold.co/120x120/3f2d1f/fff?text=Wattar')} alt={product.name} className="h-14 w-14 rounded-xl object-cover" />
                    <div>
                      <div className="font-medium text-stone-900 dark:text-stone-100">{product.name}</div>
                      <div className="text-xs text-stone-500 dark:text-stone-400">
                        {product.category}{product.subcategory ? ` / ${product.subcategory}` : ''}
                      </div>
                      {!!product.options?.colors?.length && (
                        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-stone-500">
                          {product.options.colors.map((color, index) => (
                            <ColorLabel key={`${color.name}-${color.hex || index}`} name={color.name} hex={color.hex} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleEditProduct(product)} className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-amber-600">تعديل</button>
                    <button type="button" onClick={() => handleDeleteProduct(product._id)} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700">حذف</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
      )}

      {tab === 'users' && (
        <>
      <div className="rounded-[32px] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(249,245,240,0.92))] p-6 shadow-[0_22px_55px_rgba(58,39,23,0.08)] dark:border-stone-700 dark:bg-[linear-gradient(135deg,rgba(31,27,24,0.98),rgba(21,18,17,0.96))]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-xl font-black text-stone-900 dark:text-stone-100">
            <Users size={20} /> المشتركون ({users.length})
          </h3>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="بحث بالاسم أو البريد..."
              className="w-full rounded-full border border-stone-200 bg-white py-2.5 pe-10 ps-4 text-right text-sm outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs text-stone-500 dark:border-stone-700 dark:text-stone-400">
                <th className="px-3 py-3 font-medium">الاسم</th>
                <th className="px-3 py-3 font-medium">البريد الإلكتروني</th>
                <th className="px-3 py-3 font-medium">تاريخ التسجيل</th>
                <th className="px-3 py-3 font-medium">آخر دخول</th>
                <th className="px-3 py-3 font-medium">الحالة</th>
                <th className="px-3 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((item) => {
                const isSelf = item._id === user._id;
                const isAdminUser = item.role === 'admin';
                return (
                  <tr key={item._id} className="border-b border-stone-100 dark:border-stone-800">
                    <td className="px-3 py-3 font-medium text-stone-900 dark:text-stone-100">{item.name}</td>
                    <td className="px-3 py-3 text-stone-600 dark:text-stone-300" dir="ltr">{item.email}</td>
                    <td className="px-3 py-3 text-stone-600 dark:text-stone-300">{formatDate(item.createdAt)}</td>
                    <td className="px-3 py-3 text-stone-600 dark:text-stone-300">{formatDate(item.lastLoginAt)}</td>
                    <td className="px-3 py-3">
                      {isAdminUser ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900/30 dark:text-brand-200"><ShieldCheck size={12} /> مدير</span>
                      ) : item.isBlocked ? (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-300">محظور</span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">نشط</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isAdminUser || isSelf ? (
                        <span className="text-xs text-stone-400">—</span>
                      ) : (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleToggleBlock(item)} title={item.isBlocked ? 'إلغاء الحظر' : 'حظر'} className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
                            <ShieldOff size={13} /> {item.isBlocked ? 'إلغاء الحظر' : 'حظر'}
                          </button>
                          <button type="button" onClick={() => handleDeleteUser(item)} className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                            <Trash2 size={13} /> حذف
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <p className="py-8 text-center text-sm text-stone-500">لا يوجد مشتركون مطابقون.</p>}
        </div>
      </div>

      <div className="mt-6 rounded-[32px] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(249,245,240,0.92))] p-6 shadow-[0_22px_55px_rgba(58,39,23,0.08)] dark:border-stone-700 dark:bg-[linear-gradient(135deg,rgba(31,27,24,0.98),rgba(21,18,17,0.96))]">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-black text-stone-900 dark:text-stone-100">
          <MessageSquareQuote size={20} /> تعليقات الموقع ({comments.length})
        </h3>
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">لا توجد تعليقات بعد.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {comments.map((c) => (
              <div key={c._id} className="flex items-start justify-between gap-3 rounded-[22px] border border-stone-200 bg-white/70 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/60">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium text-stone-900 dark:text-stone-100">{c.user?.name || 'مستخدم محذوف'}</span>
                    <span className="flex text-amber-500">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={12} fill={n <= c.rating ? 'currentColor' : 'none'} />)}</span>
                  </div>
                  <p className="break-words text-sm text-stone-600 dark:text-stone-300">{c.text}</p>
                  <p className="mt-1 text-xs text-stone-400">{formatDate(c.createdAt)}</p>
                </div>
                <button type="button" onClick={() => handleDeleteComment(c._id)} aria-label="حذف التعليق" className="shrink-0 rounded-full bg-red-600 p-2 text-white hover:bg-red-700">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}

      {tab === 'settings' && (
      <div className={`${panelClass} max-w-3xl`}>
        <h3 className="mb-4 text-xl font-black text-stone-900 dark:text-stone-100">إعدادات الموقع</h3>

        <form onSubmit={handleSettingsUpdate} className="space-y-3">
          <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${siteData.showPrices !== false ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'}`}>
            <input
              type="checkbox"
              checked={siteData.showPrices !== false}
              onChange={(e) => setSiteData({ ...siteData, showPrices: e.target.checked })}
              className="mt-1 h-5 w-5 accent-brand-700"
            />
            <span>
              <span className="block font-bold text-stone-900 dark:text-stone-100">عرض أسعار المنتجات لجميع الزوار</span>
              <span className="mt-1 block text-xs leading-6 text-stone-600 dark:text-stone-300">
                {siteData.showPrices !== false
                  ? 'الأسعار ظاهرة في المتجر.'
                  : 'الأسعار مخفية: يظهر بدلها "السعر عند الطلب" في كل الموقع وفي الواتساب والشات، ولا تُرسَل الأسعار من الخادم للزوار. تبقى الأسعار ظاهرة لك أنت في لوحة التحكم.'}
              </span>
            </span>
          </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">اسم الشركة</span>
              <input value={siteData.companyName || ''} onChange={(e) => setSiteData({ ...siteData, companyName: e.target.value })} placeholder="" className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">الشعار النصي</span>
              <input value={siteData.slogan || ''} onChange={(e) => setSiteData({ ...siteData, slogan: e.target.value })} placeholder="" className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">عنوان الصفحة الرئيسية</span>
              <textarea value={siteData.heroTitle || ''} onChange={(e) => setSiteData({ ...siteData, heroTitle: e.target.value })} rows={2} placeholder="" className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">وصف الصفحة الرئيسية</span>
              <textarea value={siteData.heroSubtitle || ''} onChange={(e) => setSiteData({ ...siteData, heroSubtitle: e.target.value })} rows={2} placeholder="" className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <div className="rounded-2xl border border-stone-200 p-4 dark:border-stone-700">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <span className="block font-bold">جمل شاشة الترحيب والشرائح الرئيسية</span>
                  <span className="mt-1 block text-xs leading-6 text-stone-500 dark:text-stone-400">
                    تظهر عند كل تحميل للموقع لمدة 6 ثوانٍ، ثم تُعرض كشرائح متحركة في أول الصفحة الرئيسية. أضف حتى 3 جمل، مع صورة لكل جملة.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={(siteData.welcomeSlides || []).length >= 3}
                  onClick={() => setSiteData({ ...siteData, welcomeSlides: [...(siteData.welcomeSlides || []), { text: '', image: '' }] })}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-700 px-3 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={12} /> إضافة جملة
                </button>
              </div>
              <div className="space-y-3">
                {(siteData.welcomeSlides || []).map((slide, index) => (
                  <div key={index} className="rounded-2xl border border-stone-200 bg-white/50 p-3 dark:border-stone-700 dark:bg-stone-900/40">
                    <div className="flex items-start gap-2">
                      <textarea
                        value={slide.text}
                        maxLength={200}
                        rows={2}
                        aria-label={`جملة الترحيب ${index + 1}`}
                        onChange={(e) => setSiteData({
                          ...siteData,
                          welcomeSlides: siteData.welcomeSlides.map((item, itemIndex) => (
                            itemIndex === index ? { ...item, text: e.target.value } : item
                          )),
                        })}
                        placeholder="اكتب جملة قصيرة للزوار"
                        className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900"
                      />
                      <button
                        type="button"
                        aria-label={`حذف جملة الترحيب ${index + 1}`}
                        onClick={() => {
                          setSiteData({
                            ...siteData,
                            welcomeSlides: siteData.welcomeSlides.filter((_, itemIndex) => itemIndex !== index),
                          });
                          setSelectedWelcomeImages((current) => Object.fromEntries(
                            Object.entries(current)
                              .filter(([slideIndex]) => Number(slideIndex) !== index)
                              .map(([slideIndex, file]) => [Number(slideIndex) > index ? Number(slideIndex) - 1 : Number(slideIndex), file])
                          ));
                        }}
                        className="rounded-full bg-red-600 p-2 text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]">
                      <div className="h-24 overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800">
                        {selectedWelcomeImages[index] ? (
                          <p className="flex h-full items-center justify-center px-2 text-center text-xs text-stone-600 dark:text-stone-300">
                            {selectedWelcomeImages[index].name}
                          </p>
                        ) : slide.image ? (
                          <img
                            src={imageUrl(slide.image)}
                            alt={`صورة الشريحة ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={slide.image}
                          onChange={(e) => setSiteData({
                            ...siteData,
                            welcomeSlides: siteData.welcomeSlides.map((item, itemIndex) => (
                              itemIndex === index ? { ...item, image: e.target.value } : item
                            )),
                          })}
                          placeholder="رابط الصورة (أو ارفع صورة من جهازك)"
                          aria-label={`رابط صورة الشريحة ${index + 1}`}
                          className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right text-sm outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900"
                        />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          aria-label={`رفع صورة الشريحة ${index + 1}`}
                          onChange={(e) => setSelectedWelcomeImages((current) => ({
                            ...current,
                            [index]: e.target.files?.[0] || null,
                          }))}
                          className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-700 file:px-3 file:py-2 file:text-white dark:text-stone-300"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">نبذة عن الشركة</span>
              <textarea value={siteData.aboutText || ''} onChange={(e) => setSiteData({ ...siteData, aboutText: e.target.value })} rows={3} placeholder="" className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">الهاتف (يظهر في الفوتر وصفحة التواصل وزر الاتصال)</span>
              <input value={siteData.contact?.phone || ''} onChange={(e) => setSiteData({ ...siteData, contact: { ...siteData.contact, phone: e.target.value } })} placeholder="" className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">واتساب — بصيغة دولية أو محلية (يُستخدم في كل أزرار ورسائل الواتساب بالموقع)</span>
              <input value={siteData.contact?.whatsapp || ''} onChange={(e) => setSiteData({ ...siteData, contact: { ...siteData.contact, whatsapp: e.target.value } })} placeholder={EXAMPLE_WHATSAPP} className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">البريد الإلكتروني</span>
              <input value={siteData.contact?.email || ''} onChange={(e) => setSiteData({ ...siteData, contact: { ...siteData.contact, email: e.target.value } })} placeholder="" className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">العنوان (يُستخدم أيضًا للخريطة)</span>
              <input value={siteData.contact?.address || ''} onChange={(e) => setSiteData({ ...siteData, contact: { ...siteData.contact, address: e.target.value } })} placeholder="" className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">ساعات العمل</span>
              <input value={siteData.contact?.workingHours || ''} onChange={(e) => setSiteData({ ...siteData, contact: { ...siteData.contact, workingHours: e.target.value } })} placeholder="" className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">رابط تضمين خريطة Google (اختياري — اتركه فارغًا لاستخدام العنوان)</span>
              <input value={siteData.contact?.mapEmbed || ''} onChange={(e) => setSiteData({ ...siteData, contact: { ...siteData.contact, mapEmbed: e.target.value } })} placeholder="https://www.google.com/maps/embed?pb=..." className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">انستغرام</span>
              <input value={siteData.socialLinks?.instagram || ''} onChange={(e) => setSiteData({ ...siteData, socialLinks: { ...siteData.socialLinks, instagram: e.target.value } })} placeholder="https://instagram.com/..." className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">تيك توك</span>
              <input value={siteData.socialLinks?.tiktok || ''} onChange={(e) => setSiteData({ ...siteData, socialLinks: { ...siteData.socialLinks, tiktok: e.target.value } })} placeholder="https://tiktok.com/@..." className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">فيسبوك</span>
              <input value={siteData.socialLinks?.facebook || ''} onChange={(e) => setSiteData({ ...siteData, socialLinks: { ...siteData.socialLinks, facebook: e.target.value } })} placeholder="https://facebook.com/..." className="w-full rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" />
            </label>

          <div className="rounded-2xl border border-stone-200 p-4 dark:border-stone-700">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold">الأسئلة الشائعة</span>
              <button type="button" onClick={() => setSiteData({ ...siteData, faqs: [...(siteData.faqs || []), { question: '', answer: '' }] })} className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-3 py-1.5 text-xs text-white"><Plus size={12} /> إضافة سؤال</button>
            </div>
            <div className="space-y-3">
              {(siteData.faqs || []).map((faq, i) => (
                <div key={i} className="space-y-2 rounded-2xl bg-stone-50 p-3 dark:bg-stone-900">
                  <div className="flex gap-2">
                    <input value={faq.question} onChange={(e) => setSiteData({ ...siteData, faqs: siteData.faqs.map((f, idx) => (idx === i ? { ...f, question: e.target.value } : f)) })} placeholder="السؤال" className={fieldClass} />
                    <button type="button" aria-label="حذف السؤال" onClick={() => setSiteData({ ...siteData, faqs: siteData.faqs.filter((_, idx) => idx !== i) })} className="rounded-full bg-red-600 p-2 text-white"><X size={14} /></button>
                  </div>
                  <textarea value={faq.answer} rows={2} onChange={(e) => setSiteData({ ...siteData, faqs: siteData.faqs.map((f, idx) => (idx === i ? { ...f, answer: e.target.value } : f)) })} placeholder="الإجابة" className={fieldClass} />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="premium-button-primary w-full rounded-full px-4 py-3 text-white">
            حفظ الإعدادات
          </button>
        </form>
      </div>
      )}
    </div>
  );
}
