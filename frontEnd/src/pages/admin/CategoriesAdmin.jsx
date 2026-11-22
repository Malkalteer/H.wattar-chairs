import { useCallback, useEffect, useState } from 'react';
import { CornerDownLeft, FolderTree, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Button, Card, EmptyState, PageHeader, Skeleton, errorMessage, inputClass, useConfirm } from './adminUi';

function AddSubcategory({ parent, onAdded }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post('/categories', { name, parentId: parent._id });
      onAdded(data.category);
      setName('');
      toast.success(data.message || 'تمت إضافة الصنف الفرعي.');
    } catch (error) {
      toast.error(errorMessage(error, 'تعذرت إضافة الصنف.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="relative">
      <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="إضافة صنف فرعي..." className={`${inputClass} !py-2 pe-3 ps-10 text-xs`} />
      <button type="submit" disabled={saving || !name.trim()} aria-label="إضافة" className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-400 transition hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40 dark:hover:bg-brand-900/30">
        <CornerDownLeft size={14} />
      </button>
    </form>
  );
}

export default function CategoriesAdmin() {
  const confirm = useConfirm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories || []);
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر تحميل الأصناف.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createMain = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/categories', { name });
      setCategories((current) => [...current, data.category]);
      setName('');
      toast.success(data.message || 'تمت إضافة الصنف.');
    } catch (error) {
      toast.error(errorMessage(error, 'تعذرت إضافة الصنف.'));
    }
  };

  const remove = async (category, isSub) => {
    const ok = await confirm({
      title: `حذف ${isSub ? 'الصنف الفرعي' : 'الصنف'} "${category.name}"؟`,
      message: 'لا يمكن حذف صنف مرتبط بمنتجات أو صنف رئيسي ما زالت تحته أصناف فرعية.',
      confirmText: 'حذف',
    });
    if (!ok) return;
    try {
      await api.delete(`/categories/${category._id}`);
      setCategories((current) => current.filter((c) => c._id !== category._id));
      toast.success('تم حذف الصنف.');
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر حذف الصنف.'));
    }
  };

  const mains = categories.filter((c) => !c.parent);
  const subsOf = (id) => categories.filter((c) => c.parent?._id === id);

  return (
    <div>
      <PageHeader title="الأصناف" description="تظهر الأصناف تلقائيًا كمرشحات في المتجر والصفحة الرئيسية." />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card title="صنف رئيسي جديد" description="مثال: كراسي، مجالس، طاولات" className="h-fit">
          <form onSubmit={createMain} className="space-y-3">
            <input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الصنف" className={inputClass} />
            <Button type="submit" className="w-full" disabled={!name.trim()}><Plus size={16} /> إضافة صنف</Button>
          </form>
          <p className="mt-4 rounded-xl bg-stone-50 p-3 text-[11px] leading-5 text-stone-500 dark:bg-stone-950/50">
            يمكنك إضافة أصناف فرعية مباشرة من بطاقة كل صنف رئيسي. الأصناف الفرعية اختيارية.
          </p>
        </Card>

        <div>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-40" />)}</div>
          ) : mains.length === 0 ? (
            <Card><EmptyState icon={FolderTree} title="لا توجد أصناف بعد" description="أضف صنفًا رئيسيًا للبدء، ثم أضف منتجاتك تحته." /></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {mains.map((category) => {
                const subs = subsOf(category._id);
                return (
                  <div key={category._id} className="flex flex-col rounded-2xl border border-stone-200/80 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"><FolderTree size={16} /></span>
                        <div>
                          <p className="font-bold text-stone-900 dark:text-stone-50">{category.name}</p>
                          <p className="text-[11px] text-stone-500">{subs.length ? `${subs.length} صنف فرعي` : 'بدون أصناف فرعية'}</p>
                        </div>
                      </div>
                      <Button variant="danger-ghost" size="icon" aria-label={`حذف ${category.name}`} onClick={() => remove(category, false)}><Trash2 size={15} /></Button>
                    </div>
                    <div className="mb-3 flex min-h-[28px] flex-1 flex-wrap content-start gap-1.5">
                      {subs.map((sub) => (
                        <span key={sub._id} className="inline-flex items-center gap-1 rounded-lg bg-stone-100 py-1 pe-1 ps-2.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-200">
                          {sub.name}
                          <button type="button" aria-label={`حذف ${sub.name}`} onClick={() => remove(sub, true)} className="rounded p-0.5 text-stone-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/50">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <AddSubcategory parent={category} onAdded={(c) => setCategories((current) => [...current, c])} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
