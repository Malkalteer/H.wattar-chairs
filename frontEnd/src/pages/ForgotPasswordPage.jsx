import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Seo from '../components/Seo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إرسال الطلب.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Seo title="استعادة كلمة المرور" />
      <div className="rounded-3xl bg-white p-6 shadow-soft dark:bg-stone-900">
        <h1 className="mb-2 text-3xl font-bold">نسيت كلمة المرور؟</h1>
        {sent ? (
          <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-7 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">إذا كان البريد مسجلًا لدينا فقد أرسلنا إليه رابط الاستعادة (صالح لمدة ساعة). تفقد صندوق الوارد والرسائل غير المرغوبة.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <p className="text-sm text-stone-600 dark:text-stone-300">أدخل بريدك وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.</p>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full rounded-2xl border border-stone-200 bg-transparent px-4 py-3 text-right outline-none dark:border-stone-700" />
            <button type="submit" disabled={loading} className="w-full rounded-full bg-brand-700 px-4 py-3 font-medium text-white disabled:opacity-60">{loading ? 'جارٍ الإرسال...' : 'إرسال الرابط'}</button>
          </form>
        )}
        <p className="mt-4 text-center text-sm"><Link to="/login" className="text-brand-700 dark:text-brand-200">العودة لتسجيل الدخول</Link></p>
      </div>
    </div>
  );
}
