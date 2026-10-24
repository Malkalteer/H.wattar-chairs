import { useCallback, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import api from './api/axios';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ChatAssistant from './components/chat/ChatAssistant';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import FavoritesPage from './pages/FavoritesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import OrdersPage from './pages/OrdersPage';
import GalleryPage from './pages/GalleryPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { defaultSiteContent, mergeSiteSettings } from './data/siteContent';
import { SiteProvider } from './context/SiteContext';
import IntroSplash from './components/ui/IntroSplash';

export default function App() {
  const { user, resendVerification } = useAuth();
  const [siteSettings, setSiteSettings] = useState(defaultSiteContent);
  const [showIntro, setShowIntro] = useState(true);

  const handleResend = async () => {
    try {
      const data = await resendVerification();
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إرسال الرابط.');
    }
  };

  useEffect(() => {
    const loadSite = async () => {
      try {
        const { data } = await api.get('/site');
        if (data.settings) setSiteSettings(mergeSiteSettings(data.settings));
      } catch (error) {
        console.error(error);
      }
    };

    loadSite();
  }, []);

  const applySettings = (settings) => setSiteSettings(mergeSiteSettings(settings));
  const dismissIntro = useCallback(() => setShowIntro(false), []);

  return (
    <SiteProvider value={{ siteSettings, applySettings }}>
    <div className="min-h-screen bg-stone-100 text-stone-900 transition-colors duration-300 dark:bg-stone-950 dark:text-stone-100">
      {showIntro && <IntroSplash siteSettings={siteSettings} onComplete={dismissIntro} />}
      <Navbar siteSettings={siteSettings} />
      {user && user.emailVerified === false && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
          بريدك الإلكتروني غير مؤكد. أكّده لتتمكن من إرسال الطلبات والتعليقات.{' '}
          <button type="button" onClick={handleResend} className="font-bold underline">إعادة إرسال رابط التأكيد</button>
        </div>
      )}
      <main>
        <Routes>
          <Route path="/" element={<HomePage siteSettings={siteSettings} />} />
          <Route path="/products" element={<ProductsPage siteSettings={siteSettings} />} />
          <Route path="/products/:id" element={<ProductDetailPage siteSettings={siteSettings} />} />
          <Route path="/cart" element={<CartPage siteSettings={siteSettings} />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/orders" element={<OrdersPage siteSettings={siteSettings} />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminPage onSettingsSaved={applySettings} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer siteSettings={siteSettings} />
      <ChatAssistant />
    </div>
    </SiteProvider>
  );
}
