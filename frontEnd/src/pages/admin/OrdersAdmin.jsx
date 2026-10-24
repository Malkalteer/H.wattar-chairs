import { useCallback, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { ORDER_STATUSES, customerWhatsapp, formatCurrency, formatDate, imageUrl } from '../../utils/format';
import ColorLabel from '../../components/ui/ColorLabel';
import { Badge, inputClass, panelClass } from './adminUi';

function OrderCard({ order, onSaved }) {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/orders/${order._id}/status`, { status, note });
      toast.success('تم تحديث حالة الطلب.');
      setNote('');
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحديث الطلب.');
    } finally {
      setSaving(false);
    }
  };

  const msg = `السلام عليكم ${order.customer.name}، بخصوص طلبك رقم ${order.orderNumber} من Wattar Chair.`;

  return (
    <article className="rounded-[24px] border border-stone-200 bg-white/70 p-5 dark:border-stone-700 dark:bg-stone-900/60">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-black text-stone-900 dark:text-stone-100">{order.orderNumber}</p>
          <p className="text-xs text-stone-500">{formatDate(order.createdAt, true)}</p>
        </div>
        <Badge map={ORDER_STATUSES} status={order.status} />
      </div>

      <div className="mt-3 grid gap-1 text-sm text-stone-700 dark:text-stone-300 sm:grid-cols-2">
        <p><strong>العميل:</strong> {order.customer.name}</p>
        <p dir="ltr" className="text-right"><strong dir="rtl">الجوال:</strong> {order.customer.phone}</p>
        <p><strong>المدينة:</strong> {order.customer.city || '—'}</p>
        <p><strong>الحساب:</strong> {order.user?.email || 'حساب محذوف'}</p>
        <p className="sm:col-span-2"><strong>العنوان:</strong> {order.customer.address}</p>
        {order.customer.notes && <p className="sm:col-span-2"><strong>ملاحظات:</strong> {order.customer.notes}</p>}
      </div>

      <div className="mt-3 space-y-2 border-t border-stone-100 pt-3 dark:border-stone-800">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <img src={imageUrl(item.image, 'https://placehold.co/80x80/3f2d1f/fff?text=W')} alt="" className="h-10 w-10 rounded-lg object-cover" />
            <span className="flex-1">
              {item.name}
              {(item.color || item.fabric) && (
                <span className="ml-1 inline-flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
                  {item.color && <ColorLabel name={item.color} hex={item.colorHex} />}
                  {item.fabric && <span>{item.fabric}</span>}
                </span>
              )}
              {' '}× {item.quantity}
            </span>
            <span>{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
        <p className="pt-1 text-left text-lg font-black text-brand-700 dark:text-brand-200">{formatCurrency(order.total)}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm outline-none dark:border-stone-700 dark:bg-stone-900">
          {Object.entries(ORDER_STATUSES).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="ملاحظة للعميل (اختياري)" className={`${inputClass} !w-auto min-w-[180px] flex-1 !py-2 text-sm`} />
        <button type="button" disabled={saving || (status === order.status && !note)} onClick={save} className="rounded-full bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50">حفظ</button>
        <a href={customerWhatsapp(order.customer.phone, msg)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-green-600 px-4 py-2 text-sm text-white"><MessageCircle size={14} /> واتساب</a>
      </div>
    </article>
  );
}

export default function OrdersAdmin({ onChanged }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/orders', { params: { status: filter || undefined } });
      setOrders(data.orders || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل الطلبات.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={panelClass}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-black text-stone-900 dark:text-stone-100">الطلبات ({orders.length})</h3>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm outline-none dark:border-stone-700 dark:bg-stone-900">
          <option value="">كل الحالات</option>
          {Object.entries(ORDER_STATUSES).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
        </select>
      </div>
      {loading ? <p className="py-8 text-center text-sm text-stone-500">جارٍ التحميل...</p> : orders.length === 0 ? <p className="py-8 text-center text-sm text-stone-500">لا توجد طلبات.</p> : (
        <div className="space-y-4">
          {orders.map((order) => <OrderCard key={order._id} order={order} onSaved={() => { load(); onChanged?.(); }} />)}
        </div>
      )}
    </div>
  );
}
