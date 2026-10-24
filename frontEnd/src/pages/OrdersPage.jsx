import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Seo from '../components/Seo';
import { useShowPrices } from '../context/SiteContext';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import LoginPrompt from '../components/ui/LoginPrompt';
import SectionHeading from '../components/ui/SectionHeading';
import ColorLabel from '../components/ui/ColorLabel';
import { ORDER_STATUSES, formatCurrency, formatDate, imageUrl, getWhatsappNumber, whatsappLink } from '../utils/format';

const FLOW = ['new', 'confirmed', 'in_production', 'ready', 'delivered'];

function Badge({ map, status }) {
  const info = map[status] || { label: status, color: 'bg-stone-100 text-stone-700' };
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${info.color}`}>{info.label}</span>;
}

function Timeline({ status }) {
  if (status === 'cancelled') return null;
  const current = FLOW.indexOf(status);
  return (
    <ol className="my-4 flex items-start justify-between gap-1">
      {FLOW.map((step, i) => (
        <li key={step} className="flex flex-1 flex-col items-center text-center">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= current ? 'bg-brand-700 text-white' : 'bg-stone-200 text-stone-500 dark:bg-stone-700'}`}>
            {i <= current ? <CheckCircle2 size={15} /> : i + 1}
          </span>
          <span className={`mt-1 text-[10px] leading-tight sm:text-xs ${i <= current ? 'font-bold text-brand-700 dark:text-brand-200' : 'text-stone-500'}`}>{ORDER_STATUSES[step].label}</span>
        </li>
      ))}
    </ol>
  );
}

export default function OrdersPage({ siteSettings }) {
  const { user } = useAuth();
  const showPrices = useShowPrices();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/orders/mine');
      setOrders(data.orders || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تحميل الطلبات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (!user) return <LoginPrompt text="سجّل الدخول لمتابعة طلباتك." />;

  const cancelOrder = async (order) => {
    if (!window.confirm('هل تريد إلغاء هذا الطلب؟')) return;
    try {
      await api.put(`/orders/${order._id}/cancel`);
      toast.success('تم إلغاء الطلب.');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إلغاء الطلب.');
    }
  };

  const orderWhatsApp = (order) =>
    whatsappLink(getWhatsappNumber(siteSettings.contact), `السلام عليكم، بخصوص طلبي رقم ${order.orderNumber}${showPrices && order.total != null ? ` بإجمالي ${formatCurrency(order.total)}` : ''}.`);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Seo title="طلباتي" />
      <SectionHeading title="طلباتي" subtitle="تابع حالة طلباتك" />

      {loading ? (
        <LoadingState />
      ) : orders.length === 0 ? (
          <div className="space-y-4 text-center">
            <EmptyState text="لا توجد طلبات بعد." />
            <Link to="/products" className="inline-flex rounded-full bg-brand-700 px-5 py-3 text-sm text-white">تصفح المنتجات</Link>
          </div>
      ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article key={order._id} className={`rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900 ${location.state?.justOrdered === order._id ? 'ring-2 ring-brand-500' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-black text-stone-900 dark:text-stone-100">طلب {order.orderNumber}</p>
                    <p className="text-xs text-stone-500">{formatDate(order.createdAt, true)}</p>
                  </div>
                  <Badge map={ORDER_STATUSES} status={order.status} />
                </div>

                <Timeline status={order.status} />

                <div className="space-y-2 border-t border-stone-100 pt-3 dark:border-stone-800">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <img src={imageUrl(item.image, 'https://placehold.co/100x100/3f2d1f/fff?text=W')} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
                          {item.color && <ColorLabel name={item.color} hex={item.colorHex} />}
                          {item.fabric && <span>{item.fabric}</span>}
                          {item.quantity > 0 && <span>× {item.quantity}</span>}
                        </div>
                      </div>
                      {showPrices && item.price != null && <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {showPrices && order.total != null ? <p className="text-lg font-black text-brand-700 dark:text-brand-200">الإجمالي: {formatCurrency(order.total)}</p> : <span />}
                  <div className="flex gap-2">
                    <a href={orderWhatsApp(order)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-xs font-medium text-white">
                      <MessageCircle size={14} /> واتساب
                    </a>
                    {order.status === 'new' && (
                      <button type="button" onClick={() => cancelOrder(order)} className="rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50">إلغاء الطلب</button>
                    )}
                  </div>
                </div>

                {order.statusHistory?.length > 1 && (
                  <details className="mt-3 text-xs text-stone-500">
                    <summary className="cursor-pointer">سجل الحالة</summary>
                    <ul className="mt-2 space-y-1">
                      {order.statusHistory.map((h, i) => (
                        <li key={i}>{formatDate(h.at, true)} — {ORDER_STATUSES[h.status]?.label}{h.note ? `: ${h.note}` : ''}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </article>
            ))}
          </div>
      )}
    </div>
  );
}
