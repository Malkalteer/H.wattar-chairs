import { useEffect, useMemo, useState } from 'react';
import { Building2, HelpCircle, ImagePlus, LayoutTemplate, Phone, Plus, Share2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { defaultSiteContent, mergeSiteSettings } from '../../data/siteContent';
import { EXAMPLE_WHATSAPP } from '../../config/locale';
import { imageUrl } from '../../utils/format';
import { Button, Card, Field, PageHeader, Skeleton, Toggle, errorMessage, inputClass, useObjectUrls } from './adminUi';

const SECTIONS = [
  { key: 'general', label: 'عام', icon: Building2 },
  { key: 'home', label: 'الصفحة الرئيسية', icon: LayoutTemplate },
  { key: 'contact', label: 'التواصل', icon: Phone },
  { key: 'social', label: 'التواصل الاجتماعي', icon: Share2 },
  { key: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle },
];

function SlideEditor({ slide, index, file, onChange, onFile, onRemove }) {
  const files = useMemo(() => (file ? [file] : []), [file]);
  const [preview] = useObjectUrls(files);
  const src = preview || (slide.image ? imageUrl(slide.image) : '');

  return (
    <div className="grid gap-3 rounded-xl border border-stone-200 p-3 dark:border-stone-800 sm:grid-cols-[160px_1fr]">
      <label className="group relative flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
        {src ? <img src={src} alt={`صورة الشريحة ${index + 1}`} className="h-full w-full object-cover" /> : <ImagePlus size={22} className="text-stone-400" />}
        <span className="absolute inset-0 flex items-center justify-center bg-stone-950/50 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">تغيير الصورة</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={`رفع صورة الشريحة ${index + 1}`} onChange={(e) => onFile(e.target.files?.[0] || null)} />
      </label>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <textarea value={slide.text} maxLength={200} rows={2} aria-label={`جملة الترحيب ${index + 1}`} onChange={(e) => onChange({ text: e.target.value })} placeholder="جملة قصيرة للزوار" className={inputClass} />
          <Button variant="danger-ghost" size="icon" aria-label={`حذف الشريحة ${index + 1}`} onClick={onRemove}><Trash2 size={15} /></Button>
        </div>
        <input type="text" value={slide.image} onChange={(e) => onChange({ image: e.target.value })} placeholder="أو الصق رابط صورة" aria-label={`رابط صورة الشريحة ${index + 1}`} className={`${inputClass} text-xs`} dir="ltr" />
        <p className="text-[11px] text-stone-400">{(slide.text || '').length}/200 حرف</p>
      </div>
    </div>
  );
}

export default function SettingsAdmin({ onSettingsSaved }) {
  const [saved, setSaved] = useState(null);
  const [data, setData] = useState(defaultSiteContent);
  const [welcomeFiles, setWelcomeFiles] = useState({});
  const [section, setSection] = useState('general');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/site');
        const merged = mergeSiteSettings(res.data.settings || {});
        setData(merged);
        setSaved(merged);
      } catch (error) {
        toast.error(errorMessage(error, 'تعذر تحميل الإعدادات.'));
        setSaved(defaultSiteContent);
      }
    })();
  }, []);

  const dirty = useMemo(
    () => saved !== null && (JSON.stringify(saved) !== JSON.stringify(data) || Object.values(welcomeFiles).some(Boolean)),
    [saved, data, welcomeFiles]
  );

  // تنبيه قبل مغادرة الصفحة مع تغييرات غير محفوظة
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const set = (patch) => setData((current) => ({ ...current, ...patch }));
  const setContact = (patch) => setData((current) => ({ ...current, contact: { ...current.contact, ...patch } }));
  const setSocial = (patch) => setData((current) => ({ ...current, socialLinks: { ...current.socialLinks, ...patch } }));
  const slides = data.welcomeSlides || [];
  const faqs = data.faqs || [];

  const updateSlide = (index, patch) => set({ welcomeSlides: slides.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
  const removeSlide = (index) => {
    set({ welcomeSlides: slides.filter((_, i) => i !== index) });
    setWelcomeFiles((current) => Object.fromEntries(
      Object.entries(current)
        .filter(([i]) => Number(i) !== index)
        .map(([i, file]) => [Number(i) > index ? Number(i) - 1 : Number(i), file])
    ));
  };
  const updateFaq = (index, patch) => set({ faqs: faqs.map((f, i) => (i === index ? { ...f, ...patch } : f)) });

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      const imageIndexes = [];
      slides.forEach((_, index) => {
        const file = welcomeFiles[index];
        if (!file) return;
        imageIndexes.push(index);
        formData.append('welcomeImages', file);
      });
      formData.append('welcomeImageIndexes', JSON.stringify(imageIndexes));
      formData.append('settings', JSON.stringify({ ...data, welcomeMessages: slides.map((s) => s.text) }));

      const res = await api.put('/site', formData);
      const updated = mergeSiteSettings(res.data.settings);
      setData(updated);
      setSaved(updated);
      setWelcomeFiles({});
      onSettingsSaved?.(updated);
      toast.success('تم حفظ الإعدادات وتطبيقها على الموقع.');
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر حفظ الإعدادات.'));
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setData(saved);
    setWelcomeFiles({});
  };

  if (saved === null) {
    return (
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Skeleton className="h-64" />
        <Skeleton className="h-[480px]" />
      </div>
    );
  }

  return (
    <form onSubmit={save} className="pb-24">
      <PageHeader title="إعدادات الموقع" description="التغييرات تُطبَّق على كامل الموقع فور الحفظ." />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:h-fit lg:flex-col" aria-label="أقسام الإعدادات">
          {SECTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${section === item.key ? 'bg-white text-brand-800 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:text-brand-100 dark:ring-stone-800' : 'text-stone-500 hover:bg-white/60 hover:text-stone-800 dark:hover:bg-stone-900/60 dark:hover:text-stone-200'}`}
            >
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 space-y-6">
          {section === 'general' && (
            <>
              <Card title="الأسعار">
                <Toggle
                  checked={data.showPrices !== false}
                  onChange={(value) => set({ showPrices: value })}
                  label="عرض أسعار المنتجات لجميع الزوار"
                  description={data.showPrices !== false
                    ? 'الأسعار ظاهرة في المتجر.'
                    : 'الأسعار مخفية: يظهر بدلها "السعر عند الطلب" في كل الموقع والواتساب والشات، ولا يرسلها الخادم للزوار. تبقى ظاهرة لك في لوحة التحكم.'}
                />
              </Card>
              <Card title="هوية المتجر">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="اسم الشركة"><input value={data.companyName || ''} onChange={(e) => set({ companyName: e.target.value })} className={inputClass} /></Field>
                  <Field label="الشعار النصي"><input value={data.slogan || ''} onChange={(e) => set({ slogan: e.target.value })} className={inputClass} /></Field>
                  <Field label="نبذة عن الشركة" className="sm:col-span-2"><textarea value={data.aboutText || ''} rows={4} onChange={(e) => set({ aboutText: e.target.value })} className={inputClass} /></Field>
                </div>
              </Card>
            </>
          )}

          {section === 'home' && (
            <>
              <Card title="القسم الرئيسي (Hero)">
                <div className="space-y-4">
                  <Field label="العنوان"><textarea value={data.heroTitle || ''} rows={2} onChange={(e) => set({ heroTitle: e.target.value })} className={inputClass} /></Field>
                  <Field label="الوصف"><textarea value={data.heroSubtitle || ''} rows={3} onChange={(e) => set({ heroSubtitle: e.target.value })} className={inputClass} /></Field>
                </div>
              </Card>
              <Card
                title="شاشة الترحيب والشرائح"
                description="تظهر عند فتح الموقع لمدة 6 ثوانٍ، ثم كشرائح متحركة أعلى الصفحة الرئيسية. حتى 3 شرائح."
                actions={<Button variant="secondary" size="sm" disabled={slides.length >= 3} onClick={() => set({ welcomeSlides: [...slides, { text: '', image: '' }] })}><Plus size={13} /> شريحة</Button>}
              >
                <div className="space-y-3">
                  {slides.length === 0 && <p className="py-6 text-center text-sm text-stone-500">لا توجد شرائح. أضف شريحة للبدء.</p>}
                  {slides.map((slide, index) => (
                    <SlideEditor
                      key={index}
                      slide={slide}
                      index={index}
                      file={welcomeFiles[index]}
                      onChange={(patch) => updateSlide(index, patch)}
                      onFile={(file) => setWelcomeFiles((current) => ({ ...current, [index]: file }))}
                      onRemove={() => removeSlide(index)}
                    />
                  ))}
                </div>
              </Card>
            </>
          )}

          {section === 'contact' && (
            <Card title="معلومات التواصل" description="تظهر في الفوتر وصفحات التواصل وأزرار الاتصال والواتساب.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="الهاتف"><input value={data.contact?.phone || ''} onChange={(e) => setContact({ phone: e.target.value })} className={inputClass} dir="ltr" /></Field>
                <Field label="واتساب" hint="بصيغة دولية أو محلية؛ يُستخدم في كل أزرار الواتساب"><input value={data.contact?.whatsapp || ''} onChange={(e) => setContact({ whatsapp: e.target.value })} placeholder={EXAMPLE_WHATSAPP} className={inputClass} dir="ltr" /></Field>
                <Field label="البريد الإلكتروني"><input type="email" value={data.contact?.email || ''} onChange={(e) => setContact({ email: e.target.value })} className={inputClass} dir="ltr" /></Field>
                <Field label="ساعات العمل"><input value={data.contact?.workingHours || ''} onChange={(e) => setContact({ workingHours: e.target.value })} className={inputClass} /></Field>
                <Field label="العنوان" hint="يُستخدم أيضًا لعرض الخريطة" className="sm:col-span-2"><input value={data.contact?.address || ''} onChange={(e) => setContact({ address: e.target.value })} className={inputClass} /></Field>
                <Field label="رابط تضمين خريطة Google" hint="اختياري — اتركه فارغًا لاستخدام العنوان" className="sm:col-span-2"><input value={data.contact?.mapEmbed || ''} onChange={(e) => setContact({ mapEmbed: e.target.value })} placeholder="https://www.google.com/maps/embed?pb=..." className={inputClass} dir="ltr" /></Field>
              </div>
            </Card>
          )}

          {section === 'social' && (
            <Card title="حسابات التواصل الاجتماعي" description="اترك الحقل فارغًا لإخفاء الأيقونة من الموقع.">
              <div className="space-y-4">
                <Field label="انستغرام"><input value={data.socialLinks?.instagram || ''} onChange={(e) => setSocial({ instagram: e.target.value })} placeholder="https://instagram.com/..." className={inputClass} dir="ltr" /></Field>
                <Field label="تيك توك"><input value={data.socialLinks?.tiktok || ''} onChange={(e) => setSocial({ tiktok: e.target.value })} placeholder="https://tiktok.com/@..." className={inputClass} dir="ltr" /></Field>
                <Field label="فيسبوك"><input value={data.socialLinks?.facebook || ''} onChange={(e) => setSocial({ facebook: e.target.value })} placeholder="https://facebook.com/..." className={inputClass} dir="ltr" /></Field>
              </div>
            </Card>
          )}

          {section === 'faq' && (
            <Card
              title="الأسئلة الشائعة"
              description={`${faqs.length} سؤال`}
              actions={<Button variant="secondary" size="sm" onClick={() => set({ faqs: [...faqs, { question: '', answer: '' }] })}><Plus size={13} /> سؤال</Button>}
            >
              <div className="space-y-3">
                {faqs.length === 0 && <p className="py-6 text-center text-sm text-stone-500">لا توجد أسئلة بعد.</p>}
                {faqs.map((faq, i) => (
                  <div key={i} className="space-y-2 rounded-xl border border-stone-200 p-3 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs font-bold text-stone-500 dark:bg-stone-800">{i + 1}</span>
                      <input value={faq.question} onChange={(e) => updateFaq(i, { question: e.target.value })} placeholder="السؤال" className={`${inputClass} font-semibold`} />
                      <Button variant="danger-ghost" size="icon" aria-label="حذف السؤال" onClick={() => set({ faqs: faqs.filter((_, idx) => idx !== i) })}><Trash2 size={15} /></Button>
                    </div>
                    <textarea value={faq.answer} rows={2} onChange={(e) => updateFaq(i, { answer: e.target.value })} placeholder="الإجابة" className={inputClass} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* شريط الحفظ الثابت */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/90 backdrop-blur-md transition-transform duration-200 dark:border-stone-800 dark:bg-stone-900/90 lg:right-64 ${dirty ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" /> لديك تغييرات غير محفوظة
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={discard} disabled={saving}>تجاهل</Button>
            <Button type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</Button>
          </div>
        </div>
      </div>
    </form>
  );
}
