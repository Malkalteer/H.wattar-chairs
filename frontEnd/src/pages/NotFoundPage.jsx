import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="rounded-3xl bg-white p-8 shadow-soft dark:bg-stone-900">
        <h1 className="mb-4 text-4xl font-black">404</h1>
        <p className="mb-6 text-stone-600 dark:text-stone-300">الصفحة التي تبحث عنها غير موجودة.</p>
        <Link to="/" className="rounded-full bg-brand-700 px-5 py-3 text-white">العودة إلى الرئيسية</Link>
      </div>
    </div>
  );
}
