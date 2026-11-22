import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquareQuote, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatDate } from '../../utils/format';
import { Avatar, Button, Card, EmptyState, FilterTabs, PageHeader, SearchInput, Skeleton, errorMessage, useConfirm } from './adminUi';

function Stars({ value }) {
  return (
    <span className="flex text-amber-400" aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={12} className={n <= value ? 'fill-current' : 'text-stone-300 dark:text-stone-600'} />)}
    </span>
  );
}

export default function CommentsAdmin({ onChanged }) {
  const confirm = useConfirm();
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [rating, setRating] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/comments', { params: { limit: 100 } });
      setComments(data.comments || []);
      setTotal(data.total || 0);
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر تحميل التعليقات.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const average = comments.length ? comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length : 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return comments.filter((c) => {
      if (rating === 'low' && c.rating > 3) return false;
      if (rating === 'high' && c.rating < 4) return false;
      return !q || c.text?.toLowerCase().includes(q) || c.user?.name?.toLowerCase().includes(q);
    });
  }, [comments, query, rating]);

  const remove = async (comment) => {
    const ok = await confirm({ title: 'حذف هذا التعليق؟', message: `"${comment.text.slice(0, 120)}"`, confirmText: 'حذف' });
    if (!ok) return;
    try {
      await api.delete(`/comments/${comment._id}`);
      setComments((list) => list.filter((c) => c._id !== comment._id));
      setTotal((t) => Math.max(t - 1, 0));
      toast.success('تم حذف التعليق.');
      onChanged?.();
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر حذف التعليق.'));
    }
  };

  return (
    <div>
      <PageHeader
        title="التعليقات"
        description={`${total} تعليق${total > comments.length ? ` · يُعرض أحدث ${comments.length}` : ''}`}
        actions={comments.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 dark:border-stone-800 dark:bg-stone-900">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-black tabular-nums">{average.toFixed(1)}</span>
            <span className="text-xs text-stone-500">متوسط التقييم</span>
          </div>
        )}
      />
      <Card bodyClassName="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs
            value={rating}
            onChange={setRating}
            options={[
              { value: '', label: 'الكل', count: comments.length },
              { value: 'high', label: '4-5 نجوم', count: comments.filter((c) => c.rating >= 4).length },
              { value: 'low', label: '3 نجوم أو أقل', count: comments.filter((c) => c.rating <= 3).length },
            ]}
          />
          <SearchInput value={query} onChange={setQuery} placeholder="ابحث في التعليقات..." className="lg:w-72" />
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-28" />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState icon={MessageSquareQuote} title={comments.length ? 'لا توجد تعليقات مطابقة' : 'لا توجد تعليقات بعد'} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {visible.map((c) => (
              <article key={c._id} className="group flex gap-3 rounded-2xl border border-stone-200/80 p-4 transition hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700">
                <Avatar name={c.user?.name || '؟'} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">{c.user?.name || 'مستخدم محذوف'}</span>
                      <Stars value={c.rating} />
                    </div>
                    <Button variant="danger-ghost" size="icon" aria-label="حذف التعليق" onClick={() => remove(c)} className="opacity-60 group-hover:opacity-100"><Trash2 size={14} /></Button>
                  </div>
                  <p className="mt-1 break-words text-sm leading-6 text-stone-600 dark:text-stone-300">{c.text}</p>
                  <p className="mt-1.5 text-[11px] text-stone-400">{formatDate(c.createdAt, true)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
