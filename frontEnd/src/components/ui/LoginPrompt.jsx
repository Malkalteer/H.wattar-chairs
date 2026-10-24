import { useNavigate } from 'react-router-dom';

export default function LoginPrompt({ text }) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="rounded-3xl bg-white p-8 shadow-soft dark:bg-stone-900">
        <p className="mb-4 text-xl font-bold">{text}</p>
        <button type="button" onClick={() => navigate('/login')} className="rounded-full bg-brand-700 px-5 py-3 text-white">
          تسجيل الدخول
        </button>
      </div>
    </div>
  );
}
