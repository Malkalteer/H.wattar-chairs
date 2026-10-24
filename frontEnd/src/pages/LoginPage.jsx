import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Seo from '../components/Seo';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
      navigate(location.state?.from || '/');
      toast.success('تم تسجيل الدخول بنجاح.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تسجيل الدخول.');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Seo title="تسجيل الدخول" />
      <div className="rounded-3xl bg-white p-6 shadow-soft dark:bg-stone-900">
        <h1 className="mb-6 text-3xl font-bold">تسجيل الدخول</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="البريد الإلكتروني" className="w-full rounded-2xl border border-stone-200 bg-transparent px-4 py-3 text-right outline-none dark:border-stone-700" />
          <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" placeholder="كلمة المرور" className="w-full rounded-2xl border border-stone-200 bg-transparent px-4 py-3 text-right outline-none dark:border-stone-700" />
          <button type="submit" className="w-full rounded-full bg-brand-700 px-4 py-3 font-medium text-white">دخول</button>
        </form>
        <p className="mt-4 text-center text-sm"><Link to="/forgot-password" className="text-brand-700 dark:text-brand-200">نسيت كلمة المرور؟</Link></p>
        <p className="mt-2 text-center text-sm text-stone-600 dark:text-stone-300">
          ليس لديك حساب؟ <Link to="/register" className="text-brand-700 dark:text-brand-200">إنشاء حساب جديد</Link>
        </p>
      </div>
    </div>
  );
}
