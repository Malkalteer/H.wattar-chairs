import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, Copy, MapPin, MessageCircle, Phone, ShoppingBag, StickyNote, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { ORDER_STATUSES, customerWhatsapp, formatCurrency, formatDate, imageUrl } from '../../utils/format';
import ColorLabel from '../../components/ui/ColorLabel';
import { Badge, Button, Card, EmptyState, FilterTabs, PageHeader, SearchInput, Skeleton, errorMessage, inputClass } from './adminUi';

// مراحل الطلب الطبيعية (الإلغاء خارجها)
const FLOW = ['new', 'confirmed', 'in_production', 'ready', 'delivered'];

function StatusStepper({ status }) {
  if (status === 'cancelled') {
    return <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">هذا الطلب ملغي.</p>;
  }
  const currentIndex = FLOW.indexOf(status);
  return (
    <ol className="flex items-start">
      {FLOW.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <li key={step} className="relative flex flex-1 flex-col items-center text-center">
            {index > 0 && <span className={`absolute left-1/2 top-3 h-0.5 w-full ${index <= currentIndex ? 'bg-brand-600 dark:bg-brand-400' : 'bg-stone-200 dark:bg-stone-700'}`} />}
            <span className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-4 ring-white dark:ring-stone-900 ${done ? 'bg-brand-600 text-white dark:bg-brand-400 dark:text-stone-950' : 'bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-400'}`}>
              {done ? <Check size={12} strokeWidth={3} /> : index + 1}
            </span>
            <span className={`mt-1.5 text-[10px] leading-4 sm:text-[11px] ${index === currentIndex ? 'font-bold text-stone-900 dark:text-stone-50' : 'text-stone-500'}`}>{ORDER_STATUSES[step].label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderRow({ order, expanded, onToggle, onSaved }) {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => setStatus(order.status), [order.status]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/orders/${order._id}/status`, { status, note });
      toast.success('تم تحديث حالة الطلب.');
      setNote('');
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر تحديث الطلب.'));
    } finally {
      setSaving(false);
    }
  };

  const nextStep = FLOW[FLOW.indexOf(order.status) + 1];
  const msg = `السلام عليكم ${order.customer.name}، بخصوص طلبك رقم ${order.orderNumber} من Wattar Chair.`;

  const copyNumber = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      toast.success('تم نسخ رقم الطلب.');
    } catch {
      // الحافظة غير متاحة
    }
  };

  return (
    <article className={`overflow-hidden rounded-2xl border bg-white transition dark:bg-stone-900 ${expanded ? 'border-brand-300 shadow-md dark:border-brand-800' : 'border-stone-200/80 hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700'}`}>
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 p-4 text-right">
        <div className="min-w-[140px] flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-stone-900 dark:text-stone-50" dir="ltr">{order.orderNumber}</span>
            <span role="button" tabIndex={-1} onClick={copyNumber} title="نسخ" className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800"><Copy size={12} /></span>
          </div>
          <p className="text-[11px] text-stone-500">{formatDate(order.createdAt, true)}</p>
        </div>
        <div className="min-w-[140px] flex-1">
          <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-200">{order.customer.name}</p>
          <p className="text-[11px] text-stone-500">{order.customer.city || '—'} · {itemCount} قطعة</p>
        </div>
        <Badge map={ORDER_STATUSES} status={order.status} />
        <span className="w-28 text-left text-sm font-black tabular-nums text-stone-900 dark:text-stone-50">{formatCurrency(order.total)}</span>
        <ChevronDown size={18} className={`text-stone-400 transition ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-stone-100 bg-stone-50/50 p-4 animate-[fadeIn_.15s_ease-out] dark:border-stone-800 dark:bg-stone-950/30">
          <div className="mb-5 rounded-xl bg-white p-4 dark:bg-stone-900">
            <StatusStepper status={order.status} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-2.5 rounded-xl bg-white p-4 text-sm dark:bg-stone-900">
              <p className="mb-1 text-xs font-bold text-stone-500">بيانات العميل</p>
              <p className="flex items-center gap-2"><User size={14} className="text-stone-400" /> {order.customer.name}</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-stone-400" /> <a href={`tel:${order.customer.phone}`} dir="ltr" className="hover:underline">{order.customer.phone}</a></p>
              <p className="flex items-start gap-2"><MapPin size={14} className="mt-1 shrink-0 text-stone-400" /> <span>{[order.customer.city, order.customer.address].filter(Boolean).join(' — ')}</span></p>
              {order.customer.notes && <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><StickyNote size={14} className="mt-1 shrink-0" /> {order.customer.notes}</p>}
              <p className="text-[11px] text-stone-500">الحساب: <span dir="ltr">{order.user?.email || 'حساب محذوف'}</span></p>
              <a href={customerWhatsapp(order.customer.phone, msg)} target="_blank" rel="noreferrer" className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-green-600 px-3 text-xs font-semibold text-white hover:bg-green-700">
                <MessageCircle size={14} /> مراسلة عبر واتساب
              </a>
            </div>

            <div className="rounded-xl bg-white p-4 dark:bg-stone-900">
              <p className="mb-3 text-xs font-bold text-stone-500">المنتجات</p>
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {order.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-2 text-sm">
                    <img src={imageUrl(item.image, 'https://placehold.co/80x80/3f2d1f/fff?text=W')} alt="" className="h-11 w-11 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-stone-800 dark:text-stone-200">{item.name}</p>
                      <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-stone-500">
                        <span>الكمية: {item.quantity}</span>
                        {item.color && <ColorLabel name={item.color} hex={item.colorHex} />}
                        {item.fabric && <span>{item.fabric}</span>}
                      </p>
                    </div>
                    <span className="tabular-nums text-stone-700 dark:text-stone-300">{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-stone-800">
                <span className="text-sm font-semibold text-stone-600 dark:text-stone-300">الإجمالي</span>
                <span className="text-lg font-black tabular-nums text-brand-700 dark:text-brand-200">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-white p-4 dark:bg-stone-900">
            <p className="mb-3 text-xs font-bold text-stone-500">تحديث الحالة</p>
            <div className="flex flex-wrap items-center gap-2">
              {nextStep && (
                <Button size="md" disabled={saving} onClick={() => setStatus(nextStep)} variant={status === nextStep ? 'primary' : 'secondary'}>
                  الانتقال إلى: {ORDER_STATUSES[nextStep].label}
                </Button>
              )}
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} !w-auto`} aria-label="الحالة">
                {Object.entries(ORDER_STATUSES).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
              </select>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="ملاحظة تُرسل للعميل (اختياري)" className={`${inputClass} min-w-[200px] flex-1`} />
              <Button disabled={saving || (status === order.status && !note)} onClick={save}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</Button>
            </div>
            {order.statusHistory?.length > 0 && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200">سجل الحالات ({order.statusHistory.length})</summary>
                <ol className="mt-3 space-y-2 border-r-2 border-stone-200 pr-4 dark:border-stone-700">
                  {[...order.statusHistory].reverse().map((entry, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -right-[21px] top-1.5 h-2 w-2 rounded-full bg-brand-500" />
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{ORDER_STATUSES[entry.status]?.label || entry.status}</span>
                      <span className="mx-2 text-stone-400">{formatDate(entry.at, true)}</span>
                      {entry.note && <span className="block text-stone-500">{entry.note}</span>}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default function OrdersAdmin({ summary, onChanged, initialStatus = '' }) {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState(initialStatus);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => setFilter(initialStatus), [initialStatus]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/orders', { params: { status: filter || undefined } });
      setOrders(data.orders || []);
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر تحميل الطلبات.'));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => [order.orderNumber, order.customer?.name, order.customer?.phone, order.customer?.city, order.user?.email]
      .some((value) => String(value || '').toLowerCase().includes(q)));
  }, [orders, query]);

  // افتح الطلب تلقائيًا عند الوصول إليه من النظرة العامة
  useEffect(() => {
    if (query && visible.length === 1) setExpanded(visible[0]._id);
  }, [query, visible]);

  const byStatus = summary?.byStatus || {};
  const options = [
    { value: '', label: 'الكل', count: summary?.totalOrders },
    ...Object.entries(ORDER_STATUSES).map(([key, info]) => ({ value: key, label: info.label, count: byStatus[key] || 0 })),
  ];

  return (
    <div>
      <PageHeader title="الطلبات" description="اضغط على أي طلب لعرض تفاصيله وتحديث حالته." />

      <Card bodyClassName="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <FilterTabs value={filter} onChange={(value) => { setFilter(value); setExpanded(null); }} options={options} />
          <SearchInput value={query} onChange={setQuery} placeholder="رقم الطلب، الاسم، الجوال..." className="xl:w-72" />
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-[72px]" />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState icon={ShoppingBag} title={query ? 'لا توجد نتائج مطابقة' : 'لا توجد طلبات'} description={query ? 'جرّب كلمة بحث أخرى.' : 'ستظهر الطلبات هنا عند وصولها.'} />
        ) : (
          <div className="space-y-2.5">
            {visible.map((order) => (
              <OrderRow
                key={order._id}
                order={order}
                expanded={expanded === order._id}
                onToggle={() => setExpanded((current) => (current === order._id ? null : order._id))}
                onSaved={() => { load(); onChanged?.(); }}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
