import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bell,
  ExternalLink,
  FolderTree,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Moon,
  Package,
  Settings,
  ShoppingBag,
  Sun,
  Users,
  X,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSite } from '../context/SiteContext';
import LoginPrompt from '../components/ui/LoginPrompt';
import Seo from '../components/Seo';
import { Avatar, Button, ConfirmProvider } from './admin/adminUi';
import OverviewAdmin from './admin/OverviewAdmin';
import OrdersAdmin from './admin/OrdersAdmin';
import ProductsAdmin from './admin/ProductsAdmin';
import CategoriesAdmin from './admin/CategoriesAdmin';
import ProjectsAdmin from './admin/ProjectsAdmin';
import UsersAdmin from './admin/UsersAdmin';
import CommentsAdmin from './admin/CommentsAdmin';
import SettingsAdmin from './admin/SettingsAdmin';

const NAV = [
  { group: 'الرئيسية', items: [{ key: 'overview', label: 'نظرة عامة', icon: LayoutDashboard, description: 'ملخص أداء المتجر وآخر النشاطات' }] },
  { group: 'المبيعات', items: [{ key: 'orders', label: 'الطلبات', icon: ShoppingBag, description: 'متابعة الطلبات وتحديث حالاتها' }] },
  {
    group: 'الكتالوج',
    items: [
      { key: 'products', label: 'المنتجات', icon: Package, description: 'إضافة المنتجات وتعديلها' },
      { key: 'categories', label: 'الأصناف', icon: FolderTree, description: 'تنظيم الأصناف الرئيسية والفرعية' },
      { key: 'projects', label: 'المعرض', icon: Images, description: 'مشاريع منفّذة تظهر في صفحة المعرض' },
    ],
  },
  {
    group: 'العملاء',
    items: [
      { key: 'users', label: 'المشتركون', icon: Users, description: 'إدارة حسابات العملاء' },
      { key: 'comments', label: 'التعليقات', icon: MessageSquareQuote, description: 'آراء الزوار المنشورة في الموقع' },
    ],
  },
  { group: 'النظام', items: [{ key: 'settings', label: 'إعدادات الموقع', icon: Settings, description: 'المحتوى ومعلومات التواصل والأسعار' }] },
];
const ALL_ITEMS = NAV.flatMap((group) => group.items);

function Sidebar({ tab, onSelect, summary, siteSettings, user, onLogout, onClose }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-5">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-lg font-black text-white shadow-md shadow-brand-900/20">
            {(siteSettings?.companyName || 'W').trim()[0]}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-stone-900 dark:text-stone-50">{siteSettings?.companyName || 'Wattar Chair'}</span>
            <span className="block text-[11px] text-stone-500 dark:text-stone-400">لوحة التحكم</span>
          </span>
        </Link>
        {onClose && <Button variant="ghost" size="icon" aria-label="إغلاق القائمة" onClick={onClose} className="lg:hidden"><X size={18} /></Button>}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2" aria-label="أقسام لوحة التحكم">
        {NAV.map((group) => (
          <div key={group.group}>
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">{group.group}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = tab === item.key;
                const badge = item.key === 'orders' ? summary?.newOrders : 0;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.key)}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-brand-700 text-white shadow-md shadow-brand-900/15 dark:bg-brand-600' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-50'}`}
                    >
                      <Icon size={18} className={active ? '' : 'text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200'} />
                      <span className="flex-1 text-right">{item.label}</span>
                      {badge > 0 && (
                        <span className={`min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums ${active ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>{badge}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-stone-200 p-3 dark:border-stone-800">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">{user.name}</p>
            <p className="truncate text-[11px] text-stone-500" dir="ltr">{user.email}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="تسجيل الخروج" title="تسجيل الخروج" onClick={onLogout}><LogOut size={16} /></Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage({ onSettingsSaved }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { siteSettings } = useSite() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [summary, setSummary] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const tab = ALL_ITEMS.some((item) => item.key === searchParams.get('tab')) ? searchParams.get('tab') : 'overview';
  const current = ALL_ITEMS.find((item) => item.key === tab);
  const isAdmin = user?.role === 'admin';

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/summary');
      setSummary(data.summary);
    } catch {
      setSummary((prev) => prev || {});
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadSummary();
  }, [isAdmin, loadSummary]);

  const selectTab = useCallback((key, extra = {}) => {
    setSearchParams({ ...(key === 'overview' ? {} : { tab: key }), ...extra });
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [setSearchParams]);

  if (!isAdmin) {
    return (
      <div className="py-16">
        <LoginPrompt text="يجب أن تكون مديرًا للوصول إلى لوحة التحكم." />
      </div>
    );
  }

  const sidebarProps = { tab, onSelect: selectTab, summary, siteSettings, user, onLogout: logout };

  return (
    <ConfirmProvider>
      <Seo title={`${current.label} | لوحة التحكم`} />
      <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        {/* الشريط الجانبي (سطح المكتب) */}
        <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 border-l border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 lg:block">
          <Sidebar {...sidebarProps} />
        </aside>

        {/* الشريط الجانبي (الجوال) */}
        {menuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-stone-950/40 animate-[fadeIn_.15s_ease-out]" onClick={() => setMenuOpen(false)} />
            <aside className="absolute inset-y-0 right-0 w-72 max-w-[85%] bg-white shadow-2xl animate-[slideInRight_.2s_ease-out] dark:bg-stone-900">
              <Sidebar {...sidebarProps} onClose={() => setMenuOpen(false)} />
            </aside>
          </div>
        )}

        <div className="lg:pr-64">
          <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/80 backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/80">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <Button variant="ghost" size="icon" aria-label="فتح القائمة" onClick={() => setMenuOpen(true)} className="lg:hidden"><Menu size={20} /></Button>
              <div className="min-w-0 flex-1">
                <nav className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400" aria-label="المسار">
                  <span>لوحة التحكم</span>
                  <span aria-hidden="true">/</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{current.label}</span>
                </nav>
                <p className="hidden truncate text-[11px] text-stone-400 sm:block">{current.description}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => selectTab('orders', { status: 'new' })}
                  aria-label={`الطلبات الجديدة: ${summary?.newOrders || 0}`}
                  title="الطلبات الجديدة"
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  <Bell size={18} />
                  {summary?.newOrders > 0 && (
                    <span className="absolute -left-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-stone-900">{summary.newOrders}</span>
                  )}
                </button>
                <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'} title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}>
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </Button>
                <Link to="/" className="ms-1 hidden h-9 items-center gap-1.5 rounded-lg border border-stone-200 px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 sm:inline-flex">
                  <ExternalLink size={14} /> عرض المتجر
                </Link>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl">
              {tab === 'overview' && <OverviewAdmin summary={summary} user={user} onNavigate={selectTab} onRefresh={loadSummary} />}
              {tab === 'orders' && <OrdersAdmin summary={summary} onChanged={loadSummary} initialStatus={searchParams.get('status') || ''} />}
              {tab === 'products' && <ProductsAdmin onChanged={loadSummary} autoOpen={searchParams.get('new') === '1'} />}
              {tab === 'categories' && <CategoriesAdmin />}
              {tab === 'projects' && <ProjectsAdmin />}
              {tab === 'users' && <UsersAdmin currentUser={user} />}
              {tab === 'comments' && <CommentsAdmin onChanged={loadSummary} />}
              {tab === 'settings' && <SettingsAdmin onSettingsSaved={onSettingsSaved} />}
            </div>
          </main>
        </div>
      </div>
    </ConfirmProvider>
  );
}
