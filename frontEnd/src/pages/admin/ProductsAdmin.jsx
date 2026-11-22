import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ImagePlus, Package, Pencil, Plus, Sparkles, Star, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatCurrency, imageUrl } from '../../utils/format';
import ColorLabel from '../../components/ui/ColorLabel';
import {
  Button,
  Card,
  Drawer,
  EmptyState,
  Field,
  FilterTabs,
  PageHeader,
  Pill,
  SearchInput,
  Skeleton,
  Toggle,
  errorMessage,
  inputClass,
  useConfirm,
  useObjectUrls,
} from './adminUi';

const emptyForm = (category = '') => ({
  name: '',
  description: '',
  price: '',
  category,
  subcategory: '',
  inStock: true,
  featured: false,
  optionColors: [],
  optFabrics: '',
});

function ProductForm({ open, onClose, editing, categories, onSaved }) {
  const mainCategories = categories.filter((c) => !c.parent);
  const [form, setForm] = useState(emptyForm());
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const previews = useObjectUrls(images);

  useEffect(() => {
    if (!open) return;
    setImages([]);
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description || '',
        price: String(editing.price ?? ''),
        category: editing.category,
        subcategory: editing.subcategory || '',
        inStock: editing.inStock,
        featured: editing.featured,
        optionColors: (editing.options?.colors || []).map((c) => ({ name: c.name || '', hex: c.hex || '#000000' })),
        optFabrics: (editing.options?.fabrics || []).join('، '),
      });
    } else {
      setForm(emptyForm(mainCategories[0]?.name || ''));
    }
  }, [open, editing]);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));
  const subcategories = categories.filter((c) => c.parent?.name === form.category);

  const updateColor = (index, patch) => set({ optionColors: form.optionColors.map((c, i) => (i === index ? { ...c, ...patch } : c)) });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error('أضف صنفًا رئيسيًا أولًا من صفحة الأصناف.');
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('description', form.description);
      data.append('price', Number(form.price));
      data.append('category', form.category);
      data.append('subcategory', form.subcategory || '');
      data.append('featured', String(form.featured));
      data.append('inStock', String(form.inStock));
      data.append('options', JSON.stringify({
        colors: form.optionColors.map((c) => ({ name: c.name.trim() || c.hex, hex: c.hex })),
        fabrics: form.optFabrics.split(/[,،]/).map((f) => f.trim()).filter(Boolean),
      }));
      images.forEach((file) => data.append('images', file));

      if (editing) await api.put(`/products/${editing._id}`, data);
      else await api.post('/products', data);
      toast.success(editing ? 'تم تحديث المنتج.' : 'تمت إضافة المنتج.');
      onSaved();
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر حفظ المنتج.'));
    } finally {
      setSaving(false);
    }
  };

  const currentImages = editing?.images || [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? 'تعديل المنتج' : 'منتج جديد'}
      description={editing ? editing.name : 'املأ البيانات ثم احفظ لينشر المنتج في المتجر'}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button type="submit" form="product-form" disabled={saving}>{saving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة المنتج'}</Button>
        </>
      )}
    >
      <form id="product-form" onSubmit={submit} className="space-y-6">
        <section className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-stone-400">المعلومات الأساسية</h4>
          <Field label="اسم المنتج">
            <input required maxLength={120} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="مثال: كرسي مخملي كلاسيكي" className={inputClass} />
          </Field>
          <Field label="الوصف">
            <textarea value={form.description} rows={4} onChange={(e) => set({ description: e.target.value })} placeholder="وصف مختصر يوضّح الخامات والمقاسات والمميزات" className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="السعر">
              <input required type="number" min="0" step="any" value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder="0" className={inputClass} dir="ltr" />
            </Field>
            <Field label="الصنف الرئيسي">
              <select required value={form.category} onChange={(e) => set({ category: e.target.value, subcategory: '' })} className={inputClass}>
                {!mainCategories.length && <option value="">لا توجد أصناف</option>}
                {mainCategories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="الصنف الفرعي">
              <select value={form.subcategory} disabled={!subcategories.length} onChange={(e) => set({ subcategory: e.target.value })} className={inputClass}>
                <option value="">بدون</option>
                {subcategories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-stone-400">الصور</h4>
          {(previews.length > 0 || currentImages.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {(previews.length ? previews : currentImages.map((img) => imageUrl(img))).map((src, i) => (
                <div key={src} className="relative">
                  <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-700" />
                  {i === 0 && <span className="absolute bottom-1 right-1 rounded bg-stone-900/75 px-1.5 text-[9px] font-semibold text-white">الرئيسية</span>}
                </div>
              ))}
            </div>
          )}
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 px-4 py-6 text-center transition hover:border-brand-400 hover:bg-brand-50/30 dark:border-stone-700 dark:hover:border-brand-600 dark:hover:bg-brand-900/10">
            <ImagePlus size={22} className="text-stone-400" />
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">{images.length ? `${images.length} صورة محددة` : 'اختر صور المنتج'}</span>
            <span className="text-[11px] text-stone-500">JPG أو PNG أو WEBP · حتى 5 صور · 3MB للصورة{editing ? ' · الصور الجديدة تستبدل الحالية' : ''}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 5))} />
          </label>
          {images.length > 0 && <Button variant="ghost" size="sm" onClick={() => setImages([])}><X size={13} /> إلغاء الصور المختارة</Button>}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wide text-stone-400">خيارات الشراء</h4>
            <Button variant="secondary" size="sm" onClick={() => set({ optionColors: [...form.optionColors, { name: '', hex: '#5f3426' }] })}><Plus size={13} /> لون</Button>
          </div>
          {form.optionColors.length === 0 && <p className="text-xs text-stone-500">لم تُحدد ألوان. أضف ألوانًا ليختار العميل منها عند الطلب.</p>}
          {form.optionColors.map((color, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="color" value={color.hex} aria-label={`اللون ${index + 1}`} onChange={(e) => updateColor(index, { hex: e.target.value })} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-stone-200 bg-white p-1 dark:border-stone-700 dark:bg-stone-950" />
              <input value={color.name} maxLength={30} onChange={(e) => updateColor(index, { name: e.target.value })} placeholder="اسم اللون (مثال: بيج)" className={inputClass} />
              <Button variant="danger-ghost" size="icon" aria-label="حذف اللون" onClick={() => set({ optionColors: form.optionColors.filter((_, i) => i !== index) })}><Trash2 size={15} /></Button>
            </div>
          ))}
          <Field label="الأقمشة المتاحة" hint="افصل بينها بفاصلة، مثال: قطيفة، كتان">
            <input value={form.optFabrics} onChange={(e) => set({ optFabrics: e.target.value })} placeholder="اختياري" className={inputClass} />
          </Field>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-stone-400">الحالة</h4>
          <Toggle checked={form.inStock} onChange={(value) => set({ inStock: value })} label="متوفر للطلب" description="عند الإيقاف يظهر المنتج كغير متوفر ولا يمكن طلبه." />
          <Toggle checked={form.featured} onChange={(value) => set({ featured: value })} label="منتج مميز" description="يظهر في قسم المنتجات المميزة بالصفحة الرئيسية." />
        </section>
      </form>
    </Drawer>
  );
}

export default function ProductsAdmin({ onChanged, autoOpen = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const confirm = useConfirm();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState(searchParams.get('stock') === 'out' ? 'out' : '');
  const [drawer, setDrawer] = useState({ open: autoOpen, editing: null });

  const load = useCallback(async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([api.get('/products'), api.get('/categories')]);
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data.categories || []);
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر تحميل المنتجات.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (autoOpen) setDrawer({ open: true, editing: null });
  }, [autoOpen]);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, editing: null });
    if (searchParams.get('new')) {
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const counts = useMemo(() => ({
    all: products.length,
    in: products.filter((p) => p.inStock).length,
    out: products.filter((p) => !p.inStock).length,
    featured: products.filter((p) => p.featured).length,
  }), [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.category !== category) return false;
      if (stock === 'in' && !p.inStock) return false;
      if (stock === 'out' && p.inStock) return false;
      if (stock === 'featured' && !p.featured) return false;
      return !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    });
  }, [products, query, category, stock]);

  const quickUpdate = async (product, patch) => {
    const next = { inStock: product.inStock, featured: product.featured, ...patch };
    setProducts((list) => list.map((p) => (p._id === product._id ? { ...p, ...next } : p)));
    try {
      await api.put(`/products/${product._id}`, next);
      onChanged?.();
    } catch (error) {
      setProducts((list) => list.map((p) => (p._id === product._id ? product : p)));
      toast.error(errorMessage(error, 'تعذر تحديث المنتج.'));
    }
  };

  const remove = async (product) => {
    const ok = await confirm({ title: `حذف "${product.name}"؟`, message: 'سيُحذف المنتج وصوره وتقييماته نهائيًا ولا يمكن التراجع.', confirmText: 'حذف المنتج' });
    if (!ok) return;
    try {
      await api.delete(`/products/${product._id}`);
      toast.success('تم حذف المنتج.');
      load();
      onChanged?.();
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر حذف المنتج.'));
    }
  };

  const mainCategories = categories.filter((c) => !c.parent);

  return (
    <div>
      <PageHeader
        title="المنتجات"
        description={`${products.length} منتج في المتجر`}
        actions={<Button onClick={() => setDrawer({ open: true, editing: null })}><Plus size={16} /> منتج جديد</Button>}
      />

      <Card bodyClassName="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <FilterTabs
            value={stock}
            onChange={setStock}
            options={[
              { value: '', label: 'الكل', count: counts.all },
              { value: 'in', label: 'متوفر', count: counts.in },
              { value: 'out', label: 'غير متوفر', count: counts.out },
              { value: 'featured', label: 'مميز', count: counts.featured },
            ]}
          />
          <div className="flex flex-1 flex-col gap-3 sm:flex-row xl:justify-end">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} sm:w-44`} aria-label="الصنف">
              <option value="">كل الأصناف</option>
              {mainCategories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
            <SearchInput value={query} onChange={setQuery} placeholder="ابحث عن منتج..." className="sm:w-64" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3, 4, 5].map((n) => <Skeleton key={n} className="h-16" />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Package}
            title={products.length ? 'لا توجد منتجات مطابقة' : 'لا توجد منتجات بعد'}
            description={products.length ? 'غيّر عوامل التصفية أو كلمة البحث.' : 'ابدأ بإضافة أول منتج إلى المتجر.'}
            action={!products.length && <Button onClick={() => setDrawer({ open: true, editing: null })}><Plus size={16} /> إضافة منتج</Button>}
          />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead>
                <tr className="border-y border-stone-100 bg-stone-50/70 text-[11px] font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-950/30">
                  <th className="px-5 py-2.5">المنتج</th>
                  <th className="px-3 py-2.5">الصنف</th>
                  <th className="px-3 py-2.5">السعر</th>
                  <th className="px-3 py-2.5">التقييم</th>
                  <th className="px-3 py-2.5">متوفر</th>
                  <th className="px-3 py-2.5">مميز</th>
                  <th className="px-5 py-2.5 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <tr key={product._id} className="border-b border-stone-100 transition last:border-0 hover:bg-stone-50/60 dark:border-stone-800 dark:hover:bg-stone-800/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={imageUrl(product.images?.[0], 'https://placehold.co/120x120/3f2d1f/fff?text=W')} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-700" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-stone-900 dark:text-stone-100">{product.name}</p>
                          {product.options?.colors?.length > 0 && (
                            <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-stone-500">
                              {product.options.colors.slice(0, 4).map((c, i) => <ColorLabel key={`${c.name}-${i}`} name={c.name} hex={c.hex} />)}
                              {product.options.colors.length > 4 && <span>+{product.options.colors.length - 4}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-stone-700 dark:text-stone-300">{product.category}</span>
                      {product.subcategory && <span className="block text-[11px] text-stone-400">{product.subcategory}</span>}
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums text-stone-900 dark:text-stone-100">{formatCurrency(product.price)}</td>
                    <td className="px-3 py-3">
                      {product.ratingCount ? (
                        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-stone-600 dark:text-stone-300"><Star size={13} className="fill-amber-400 text-amber-400" /> {Number(product.ratingAverage || 0).toFixed(1)} <span className="text-stone-400">({product.ratingCount})</span></span>
                      ) : <span className="text-xs text-stone-400">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => quickUpdate(product, { inStock: !product.inStock })} title="تبديل التوفر">
                        {product.inStock ? <Pill tone="green">متوفر</Pill> : <Pill tone="red">غير متوفر</Pill>}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => quickUpdate(product, { featured: !product.featured })}
                        aria-label={product.featured ? 'إلغاء التمييز' : 'تمييز المنتج'}
                        title={product.featured ? 'إلغاء التمييز' : 'تمييز المنتج'}
                        className={`rounded-lg p-1.5 transition ${product.featured ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40' : 'text-stone-300 hover:bg-stone-100 hover:text-stone-500 dark:text-stone-600 dark:hover:bg-stone-800'}`}
                      >
                        <Sparkles size={17} className={product.featured ? 'fill-current' : ''} />
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="تعديل" title="تعديل" onClick={() => setDrawer({ open: true, editing: product })}><Pencil size={15} /></Button>
                        <Button variant="danger-ghost" size="icon" aria-label="حذف" title="حذف" onClick={() => remove(product)}><Trash2 size={15} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ProductForm open={drawer.open} editing={drawer.editing} onClose={closeDrawer} categories={categories} onSaved={() => { load(); onChanged?.(); }} />
    </div>
  );
}
