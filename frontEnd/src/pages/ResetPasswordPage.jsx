import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Seo from '../components/Seo';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('كلمة المرور 8 أحرف على الأقل.');
    if (password !== confirm) return toast.error('كلمتا المرور غير متطابقتين.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      toast.success(data.message);
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تغيير كلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Seo title="تعيين كلمة مرور جديدة" />
      <div className="rounded-3xl bg-white p-6 shadow-soft dark:bg-stone-900">
        <h1 className="mb-6 text-3xl font-bold">كلمة مرور جديدة</h1>
        {!token ? (
          <p className="text-sm text-red-600">الرابط غير صالح. <Link to="/forgot-password" className="underline">اطلب رابطًا جديدًا</Link></p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)" className="w-full rounded-2xl border border-stone-200 bg-transparent px-4 py-3 text-right outline-none dark:border-stone-700" />
            <input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="تأكيد كلمة المرور" className="w-full rounded-2xl border border-stone-200 bg-transparent px-4 py-3 text-right outline-none dark:border-stone-700" />
            <button type="submit" disabled={loading} className="w-full rounded-full bg-brand-700 px-4 py-3 font-medium text-white disabled:opacity-60">{loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
