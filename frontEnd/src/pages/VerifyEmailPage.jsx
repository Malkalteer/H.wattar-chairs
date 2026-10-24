import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Seo from '../components/Seo';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { fetchMe, user } = useAuth();
  const [state, setState] = useState({ status: 'loading', message: '' });

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState({ status: 'error', message: 'رابط التأكيد غير صالح.' });
      return;
    }
    api
      .post('/auth/verify-email', { token })
      .then(({ data }) => {
        setState({ status: 'ok', message: data.message });
        if (user) fetchMe?.();
      })
      .catch((error) => setState({ status: 'error', message: error.response?.data?.message || 'تعذر تأكيد البريد.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Seo title="تأكيد البريد" />
      {state.status === 'loading' && <p>جارٍ التأكيد...</p>}
      {state.status === 'ok' && <CheckCircle2 className="mx-auto mb-4 text-emerald-600" size={64} />}
      {state.status === 'error' && <XCircle className="mx-auto mb-4 text-red-600" size={64} />}
      {state.message && <p className="mb-6 text-lg">{state.message}</p>}
      <Link to="/" className="rounded-full bg-brand-700 px-6 py-3 text-sm text-white">العودة للرئيسية</Link>
    </div>
  );
}
