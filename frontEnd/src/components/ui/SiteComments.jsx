import { useEffect, useState } from 'react';
import { MessageSquareQuote, Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import SectionHeading from './SectionHeading';
import { formatDate } from '../../utils/format';


function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="التقييم">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} نجوم`} onClick={() => onChange(n)} className="text-gold transition hover:scale-110">
          <Star size={26} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default function SiteComments({ fallback = [] }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/comments', { params: { limit: 30 } });
      setComments(data.comments || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (text.trim().length < 3) {
      toast.error('اكتب تعليقًا لا يقل عن 3 أحرف.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/comments', { text, rating });
      toast.success(data.message || 'تمت إضافة تعليقك.');
      setText('');
      setRating(5);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إضافة التعليق.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('حذف هذا التعليق؟')) return;
    try {
      await api.delete(`/comments/${id}`);
      toast.success('تم حذف التعليق.');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر حذف التعليق.');
    }
  };

  const hasReal = comments.length > 0;
  const average = hasReal ? comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length : 0;

  return (
    <section id="comments" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading title="آراء وتعليقات العملاء" subtitle="شاركنا تجربتك مع Wattar Chair" />

      {hasReal && (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-4 text-stone-600 dark:text-stone-300">
          <div className="flex items-center gap-1 text-gold">
            {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={18} fill={n <= Math.round(average) ? 'currentColor' : 'none'} />)}
          </div>
          <span className="text-sm font-medium">{average.toFixed(1)} من 5 • {total} تعليق</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="h-fit rounded-3xl bg-white p-6 shadow-soft dark:bg-stone-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-stone-900 dark:text-stone-100">
            <MessageSquareQuote size={20} className="text-brand-700 dark:text-brand-200" /> أضف تعليقك
          </h3>
          {user ? (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">تقييمك</label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="اكتب تجربتك مع منتجاتنا وخدمتنا..."
                  className="w-full rounded-2xl border border-stone-200 bg-transparent px-4 py-3 text-right outline-none focus:border-brand-500 dark:border-stone-700"
                />
                <p className="mt-1 text-left text-xs text-stone-400">{text.length}/500</p>
              </div>
              <button type="submit" disabled={submitting} className="premium-button-primary w-full rounded-full px-5 py-3 font-medium text-white disabled:opacity-60">
                {submitting ? 'جارٍ الإرسال...' : 'نشر التعليق'}
              </button>
            </form>
          ) : (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-6 text-center text-brand-800 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-100">
              <p className="mb-4 font-semibold">سجّل الدخول لتشاركنا رأيك.</p>
              <Link to="/login" className="inline-flex rounded-full bg-brand-700 px-5 py-3 text-sm text-white">تسجيل الدخول</Link>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800" />)
          ) : hasReal ? (
            comments.map((c) => {
              const canDelete = user && (user.role === 'admin' || c.user?._id === user._id);
              return (
                <article key={c._id} className="relative rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900">
                  <div className="mb-2 flex gap-1 text-gold">
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill={n <= c.rating ? 'currentColor' : 'none'} />)}
                  </div>
                  <p className="mb-4 whitespace-pre-wrap break-words text-sm leading-7 text-stone-600 dark:text-stone-300">“{c.text}”</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-brand-700 dark:text-brand-200">{c.user?.name || 'عميل'}</span>
                    <span className="text-xs text-stone-400">{formatDate(c.createdAt)}</span>
                  </div>
                  {canDelete && (
                    <button type="button" onClick={() => remove(c._id)} aria-label="حذف التعليق" className="absolute left-3 top-3 rounded-full p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                      <Trash2 size={15} />
                    </button>
                  )}
                </article>
              );
            })
          ) : (
            fallback.map((item, i) => (
              <article key={i} className="rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900">
                <div className="mb-2 flex gap-1 text-gold">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill="currentColor" />)}</div>
                <p className="mb-4 text-sm leading-7 text-stone-600 dark:text-stone-300">“{item.text}”</p>
                <div className="font-bold text-brand-700 dark:text-brand-200">{item.name}</div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
