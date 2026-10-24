import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { CATEGORIES, imageUrl } from '../../utils/format';
import { inputClass, panelClass } from './adminUi';

const emptyForm = { title: '', description: '', category: 'كراسي' };

export default function ProjectsAdmin() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

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
    if (!window.confirm(`حذف المشروع "${project.title}" مع صوره؟`)) return;
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
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className={`${panelClass} h-fit`}>
        <h3 className="mb-4 text-xl font-black text-stone-900 dark:text-stone-100">{editingId ? 'تعديل مشروع' : 'إضافة مشروع للمعرض'}</h3>
        <form onSubmit={submit} className="space-y-3">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان المشروع" className={inputClass} />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف مختصر" rows={3} className={inputClass} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <div className="rounded-2xl border border-dashed border-stone-300 p-3 text-sm dark:border-stone-700">
            <label className="block font-medium">{editingId ? 'إضافة صور جديدة' : 'الصور (حتى 5)'}</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))} className="mt-2 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-brand-700 file:px-4 file:py-2 file:text-white" />
            {files.length > 0 && <p className="mt-2 text-xs text-brand-700">{files.length} صورة محددة</p>}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="premium-button-primary flex-1 rounded-full px-4 py-3 text-white disabled:opacity-60">{saving ? 'جارٍ الحفظ...' : editingId ? 'تحديث' : 'إضافة'}</button>
            {editingId && <button type="button" onClick={reset} className="rounded-full border border-stone-300 px-4 py-3 dark:border-stone-700">إلغاء</button>}
          </div>
        </form>
      </div>

      <div className={panelClass}>
        <h3 className="mb-4 text-xl font-black text-stone-900 dark:text-stone-100">مشاريع المعرض ({projects.length})</h3>
        {projects.length === 0 ? <p className="py-8 text-center text-sm text-stone-500">لم تُضف مشاريع بعد. أضف أول مشروع ليظهر في المعرض.</p> : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project._id} className="rounded-[22px] border border-stone-200 bg-white/70 p-4 dark:border-stone-700 dark:bg-stone-900/60">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{project.title}</p>
                    <p className="text-xs text-stone-500">{project.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => edit(project)} className="rounded-full bg-amber-500 px-3 py-1.5 text-xs text-white">تعديل</button>
                    <button type="button" onClick={() => remove(project)} className="rounded-full bg-red-600 px-3 py-1.5 text-xs text-white">حذف</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.images.map((img) => (
                    <div key={img} className="relative h-20 w-20 overflow-hidden rounded-xl">
                      <img src={imageUrl(img)} alt="" className="h-full w-full object-cover" />
                      {project.images.length > 1 && (
                        <button type="button" aria-label="حذف الصورة" onClick={() => removeImage(project, img)} className="absolute left-1 top-1 rounded-full bg-black/70 p-1 text-white"><X size={11} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
