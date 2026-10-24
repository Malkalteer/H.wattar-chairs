import { Heart, Menu, Moon, ShoppingCart, Sun, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Navbar({ siteSettings }) {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [adminCount, setAdminCount] = useState(0);
  const isAdmin = user?.role === 'admin';

  // إشعارات المدير للطلبات الجديدة
  useEffect(() => {
    if (!isAdmin) {
      setAdminCount(0);
      return undefined;
    }
    let active = true;
    const load = () => api.get('/admin/summary').then(({ data }) => active && setAdminCount(data.summary?.notifications || 0)).catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isAdmin]);

  const navItems = [
    { to: '/', label: 'الرئيسية' },
    { to: '/products', label: 'منتجاتنا' },
    { to: '/gallery', label: 'معرضنا' },
    { to: '/orders', label: 'طلباتي', authOnly: true },
    { to: '/admin', label: 'الإدارة', adminOnly: true },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-brand-700 dark:text-brand-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-lg font-bold text-white shadow-soft">W</div>
          <div>
            <p className="text-lg font-bold">{siteSettings.companyName}</p>
            <p className="text-[10px] text-stone-500">{siteSettings.slogan}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems
            .filter((item) => !(item.adminOnly && !isAdmin) && !(item.authOnly && !user))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition ${isActive ? 'text-brand-700 dark:text-brand-200' : 'text-stone-600 hover:text-brand-700 dark:text-stone-300'}`
                }
              >
                {item.label}
                {item.adminOnly && adminCount > 0 && <span className="me-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{adminCount}</span>}
              </NavLink>
            ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="تبديل الوضع"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-brand-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link to="/favorites" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
            <Heart size={18} />
            {favorites.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white">
                {favorites.length}
              </span>
            )}
          </Link>

          <Link to="/cart" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-stone-900">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-3 lg:flex">
              <span className="rounded-full bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800 dark:bg-brand-900/30 dark:text-brand-100">
                {user.name}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate('/');
                  toast.success('تم تسجيل الخروج بنجاح.');
                }}
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900"
              >
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-soft lg:inline-flex">
              تسجيل الدخول
            </Link>
          )}

          <button
            type="button"
            aria-label="فتح القائمة"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 lg:hidden dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950 lg:hidden">
          <div className="flex flex-col gap-3">
            {navItems
              .filter((item) => !(item.adminOnly && !isAdmin) && !(item.authOnly && !user))
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2 text-right text-sm font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-900"
                >
                  {item.label}
                  {item.adminOnly && adminCount > 0 && <span className="me-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{adminCount}</span>}
                </NavLink>
              ))}
            {!user ? (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="rounded-xl bg-brand-700 px-3 py-3 text-center text-sm font-medium text-white">
                تسجيل الدخول
              </Link>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setMobileOpen(false);
                }}
                className="rounded-xl bg-stone-900 px-3 py-3 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900"
              >
                تسجيل الخروج
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
