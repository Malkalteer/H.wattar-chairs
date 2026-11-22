import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Images, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { CATEGORIES, imageUrl } from '../../utils/format';
import { Button, Card, EmptyState, Field, PageHeader, inputClass, useConfirm, useObjectUrls } from './adminUi';

const emptyForm = { title: '', description: '', category: 'كراسي' };

export default function ProjectsAdmin() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();
  const previews = useObjectUrls(files);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects || []);
    } catch (error) {
      toast.error('تعذر تحميل المعرض.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setForm(emptyForm);
    setFiles([]);
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      files.forEach((f) => data.append('images', f));
      if (editingId) await api.put(`/projects/${editingId}`, data);
      else await api.post('/projects', data);
      toast.success(editingId ? 'تم تحديث المشروع.' : 'تمت إضافة المشروع.');
      reset();
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حفظ المشروع.');
    } finally {
      setSaving(false);
    }
  };

  const edit = (project) => {
    setEditingId(project._id);
    setForm({ title: project.title, description: project.description || '', category: project.category || 'أخرى' });
    setFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (project) => {
    if (!(await confirm({ title: `حذف المشروع "${project.title}"؟`, message: 'سيُحذف المشروع مع جميع صوره.', confirmText: 'حذف' }))) return;
    try {
      await api.delete(`/projects/${project._id}`);
      toast.success('تم حذف المشروع.');
      if (editingId === project._id) reset();
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر الحذف.');
    }
  };

  const removeImage = async (project, image) => {
    if (project.images.length <= 1) return toast.error('يجب أن يبقى للمشروع صورة واحدة على الأقل.');
    try {
      const data = new FormData();
      data.append('removeImages', image);
      await api.put(`/projects/${project._id}`, data);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حذف الصورة.');
    }
  };

  return (
    <div>
      <PageHeader title="المعرض" description="مشاريع منفّذة تظهر للزوار في صفحة المعرض." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card title={editingId ? 'تعديل مشروع' : 'مشروع جديد'} className="h-fit lg:sticky lg:top-24">
          <form onSubmit={submit} className="space-y-4">
            <Field label="عنوان المشروع"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></Field>
            <Field label="وصف مختصر"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} /></Field>
            <Field label="التصنيف">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <div>
              {previews.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {previews.map((src) => <img key={src} src={src} alt="" className="h-14 w-14 rounded-lg object-cover" />)}
                </div>
              )}
              <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-stone-300 px-4 py-5 text-center transition hover:border-brand-400 dark:border-stone-700">
                <ImagePlus size={20} className="text-stone-400" />
                <span className="text-sm font-semibold">{files.length ? `${files.length} صورة محددة` : editingId ? 'إضافة صور جديدة' : 'اختر الصور (حتى 5)'}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))} />
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">{saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة المشروع'}</Button>
              {editingId && <Button variant="secondary" onClick={reset}>إلغاء</Button>}
            </div>
          </form>
        </Card>

        <div>
          {projects.length === 0 ? (
            <Card><EmptyState icon={Images} title="لا توجد مشاريع بعد" description="أضف أول مشروع ليظهر في صفحة المعرض." /></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <article key={project._id} className={`overflow-hidden rounded-2xl border bg-white transition dark:bg-stone-900 ${editingId === project._id ? 'border-brand-400 ring-4 ring-brand-500/10' : 'border-stone-200/80 dark:border-stone-800'}`}>
                  <div className="relative aspect-[4/3] bg-stone-100 dark:bg-stone-800">
                    {project.images[0] && <img src={imageUrl(project.images[0])} alt={project.title} className="h-full w-full object-cover" />}
                    <span className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-stone-700 backdrop-blur dark:bg-stone-900/90 dark:text-stone-200">{project.category}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-stone-900 dark:text-stone-50">{project.title}</p>
                        {project.description && <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{project.description}</p>}
                      </div>
                      <div className="flex shrink-0">
                        <Button variant="ghost" size="icon" aria-label="تعديل" onClick={() => edit(project)}><Pencil size={15} /></Button>
                        <Button variant="danger-ghost" size="icon" aria-label="حذف" onClick={() => remove(project)}><Trash2 size={15} /></Button>
                      </div>
                    </div>
                    {project.images.length > 1 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.images.map((img) => (
                          <div key={img} className="group relative h-12 w-12 overflow-hidden rounded-lg">
                            <img src={imageUrl(img)} alt="" className="h-full w-full object-cover" />
                            <button type="button" aria-label="حذف الصورة" onClick={() => removeImage(project, img)} className="absolute inset-0 flex items-center justify-center bg-stone-950/60 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
