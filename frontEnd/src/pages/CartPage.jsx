import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Seo from '../components/Seo';
import { useShowPrices } from '../context/SiteContext';
import SectionHeading from '../components/ui/SectionHeading';
import EmptyState from '../components/ui/EmptyState';
import LoginPrompt from '../components/ui/LoginPrompt';
import ColorLabel from '../components/ui/ColorLabel';
import { cartLineKey, formatCurrency, imageUrl, getWhatsappNumber, whatsappLink } from '../utils/format';

const inputClass = 'w-full rounded-2xl border border-stone-200 bg-transparent px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700';

export default function CartPage({ siteSettings }) {
  const { cart, updateQuantity, removeFromCart, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const showPrices = useShowPrices();
  const [busyKey, setBusyKey] = useState(null);
  const [checkout, setCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: '', city: '', address: '', notes: '' });
  const subtotal = cart.reduce((sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0), 0);

  const changeQuantity = async (item, nextQuantity) => {
    const quantity = Math.min(99, Math.max(1, nextQuantity));
    if (quantity === Number(item.quantity) || busyKey) return;

    const key = cartLineKey(item);
    setBusyKey(key);
    const result = await updateQuantity(item, quantity);
    setBusyKey(null);
    if (!result.ok) toast.error(result.message || 'تعذر تحديث الكمية.');
  };

  const removeItem = async (item) => {
    if (busyKey) return;
    const key = cartLineKey(item);
    setBusyKey(key);
    const result = await removeFromCart(item);
    setBusyKey(null);
    if (!result.ok) toast.error(result.message || 'تعذر حذف المنتج.');
  };

  const handleWhatsAppCart = () => {
    const orderLines = cart
      .map((item) => {
        const opts = [item.color, item.fabric].filter(Boolean).join(' / ');
        return `• ${item.product?.name || 'منتج'}${opts ? ` (${opts})` : ''} | الكمية: ${item.quantity}${showPrices ? ` | السعر: ${formatCurrency(item.product?.price || 0)}` : ''}`;
      })
      .join('\n');

    const text = `السلام عليكم، أود الاستفسار عن طلب السلة التالية:\n\n${orderLines}${showPrices ? `\n\nالإجمالي: ${formatCurrency(subtotal)}` : ''}`;
    window.open(whatsappLink(getWhatsappNumber(siteSettings.contact), text), '_blank');
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', form);
      toast.success(`تم استلام طلبك رقم ${data.order.orderNumber}`);
      await refreshCart();
      navigate('/orders', { state: { justOrdered: data.order._id } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إرسال الطلب.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return <LoginPrompt text="سجّل الدخول لمشاهدة السلة." />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Seo title="السلة" />
      <SectionHeading title="السلة" subtitle="قائمة المنتجات المختارة" />

      {cart.length === 0 ? (
        <>
          <EmptyState text="السلة فارغة حاليًا." />
          <div className="mt-4 text-center">
            <Link to="/orders" className="text-sm text-brand-700 underline dark:text-brand-200">عرض طلباتي السابقة</Link>
          </div>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {cart.map((item) => {
              const key = cartLineKey(item);
              const busy = busyKey === key;
              const options = [item.color, item.fabric].filter(Boolean).join(' • ');
              return (
                <div key={key} className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
                  <img src={imageUrl(item.product?.images?.[0], 'https://placehold.co/300x200/3f2d1f/fff?text=Chair')} alt={item.product?.name} className="h-24 w-24 rounded-2xl object-cover" />
                  <div className="min-w-[140px] flex-1">
                    <h3 className="text-lg font-bold">{item.product?.name}</h3>
                    {options && (
                      <div className="flex flex-wrap gap-x-2 text-xs text-stone-500 dark:text-stone-400">
                        {item.color && <ColorLabel name={item.color} hex={item.colorHex} />}
                        {item.fabric && <span>{item.fabric}</span>}
                      </div>
                    )}
                    {showPrices && <p className="text-brand-700 dark:text-brand-200">{formatCurrency(item.product?.price || 0)}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" aria-label="تقليل الكمية" disabled={busy || Number(item.quantity) <= 1} onClick={() => changeQuantity(item, Number(item.quantity || 1) - 1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 transition hover:bg-stone-300 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-stone-700 dark:hover:bg-stone-600">
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button type="button" aria-label="زيادة الكمية" disabled={busy || Number(item.quantity) >= 99} onClick={() => changeQuantity(item, Number(item.quantity || 1) + 1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 transition hover:bg-stone-300 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-stone-700 dark:hover:bg-stone-600">
                      <Plus size={16} />
                    </button>
                  </div>

                  <button type="button" aria-label="حذف من السلة" disabled={busy} onClick={() => removeItem(item)} className="rounded-full bg-red-600 p-3 text-white disabled:opacity-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="h-fit rounded-[28px] border border-stone-200 bg-gradient-to-br from-white to-stone-50 p-6 shadow-[0_18px_45px_rgba(28,25,23,0.08)] dark:border-stone-700 dark:from-stone-900 dark:to-stone-950">
            <h3 className="mb-4 text-xl font-black">ملخص الطلب</h3>

            <div className="mb-4 rounded-2xl bg-stone-100 p-4 dark:bg-stone-800">
              <div className="mb-2 flex justify-between text-sm text-stone-600 dark:text-stone-300">
                <span>العناصر</span>
                <span>{cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</span>
              </div>
              {showPrices ? (
                <div className="flex justify-between text-lg font-black text-stone-900 dark:text-stone-100">
                  <span>المجموع</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              ) : (
                <p className="text-sm text-stone-600 dark:text-stone-300">سنؤكد لك السعر النهائي عند التواصل معك بعد إرسال الطلب.</p>
              )}
            </div>

            {!checkout ? (
              <>
                <button type="button" onClick={() => setCheckout(true)} className="premium-button-primary w-full rounded-full px-4 py-3 font-medium text-white">
                  إتمام الطلب
                </button>
                <button type="button" onClick={handleWhatsAppCart} className="mt-3 w-full rounded-full bg-green-600 px-4 py-3 font-medium text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700">
                  الاستفسار عبر واتساب
                </button>
              </>
            ) : (
              <form onSubmit={submitOrder} className="space-y-3">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم" className={inputClass} />
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="رقم الجوال" type="tel" dir="ltr" className={`${inputClass} text-right`} />
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="المدينة" className={inputClass} />
                <textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="عنوان التوصيل بالتفصيل" rows={2} className={inputClass} />
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات (اختياري)" rows={2} maxLength={500} className={inputClass} />
                <button type="submit" disabled={submitting} className="premium-button-primary w-full rounded-full px-4 py-3 font-medium text-white disabled:opacity-60">
                  {submitting ? 'جارٍ الإرسال...' : 'تأكيد وإرسال الطلب'}
                </button>
                <button type="button" onClick={() => setCheckout(false)} className="w-full rounded-full border border-stone-200 px-4 py-2.5 text-sm text-stone-700 dark:border-stone-700 dark:text-stone-200">
                  رجوع
                </button>
                <p className="text-center text-xs text-stone-500 dark:text-stone-400">سنتواصل معك لتأكيد الطلب والدفع والتوصيل.</p>
              </form>
            )}

            <button type="button" onClick={() => navigate('/products')} className="mt-3 w-full rounded-full border border-stone-200 px-4 py-3 font-medium text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800">
              متابعة التسوق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
