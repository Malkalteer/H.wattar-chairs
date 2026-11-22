import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Inbox, Search, X } from 'lucide-react';

// ===== أصناف CSS مشتركة =====
export const panelClass = 'rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] dark:border-stone-800 dark:bg-stone-900';
export const inputClass = 'w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-right text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500';
export const fileInputClass = 'block w-full text-sm text-stone-600 file:me-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-800 hover:file:bg-brand-100 dark:text-stone-300 dark:file:bg-brand-900/40 dark:file:text-brand-100';

const BUTTON_VARIANTS = {
  primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500',
  secondary: 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800',
  ghost: 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  'danger-ghost': 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40',
};
const BUTTON_SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  icon: 'h-9 w-9 rounded-lg',
};

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', children, ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ title, description, actions, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`${panelClass} min-w-0 ${className}`}>
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">{title}</h3>}
            {description && <p className="mt-0.5 text-xs leading-5 text-stone-500 dark:text-stone-400">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-50">{title}</h2>
        {description && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-xs font-semibold text-stone-700 dark:text-stone-300">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11px] leading-5 text-stone-500 dark:text-stone-400">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-stone-200 p-3.5 transition hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/50">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-stone-900 dark:text-stone-100">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-5 text-stone-500 dark:text-stone-400">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/20 dark:bg-stone-700" />
        <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:-translate-x-5" />
      </span>
    </label>
  );
}

export function Badge({ map, status }) {
  const info = map[status] || { label: status, color: 'bg-stone-100 text-stone-700' };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${info.color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {info.label}
    </span>
  );
}

export function Pill({ tone = 'stone', children }) {
  const tones = {
    stone: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    brand: 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100',
  };
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function SearchInput({ value, onChange, placeholder = 'بحث...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} pe-9 ps-8`} />
      {value && (
        <button type="button" aria-label="مسح البحث" onClick={() => onChange('')} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// أزرار تصفية على شكل شرائح مع عدّاد
export function FilterTabs({ value, onChange, options }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 dark:bg-stone-800/70">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${active ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-50' : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'}`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] tabular-nums ${active ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/50 dark:text-brand-100' : 'bg-stone-200/70 dark:bg-stone-700'}`}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 dark:bg-stone-800">
        <Icon size={22} />
      </span>
      <p className="font-semibold text-stone-800 dark:text-stone-200">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-500 dark:text-stone-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200/70 dark:bg-stone-800 ${className}`} />;
}

export function Avatar({ name = '', className = '' }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('') || '؟';
  return (
    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white ${className}`}>
      {initials}
    </span>
  );
}

// لوحة جانبية منزلقة للنماذج
export function Drawer({ open, onClose, title, description, children, footer, width = 'max-w-xl' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-[2px] animate-[fadeIn_.15s_ease-out]" onClick={onClose} />
      <div className={`absolute inset-y-0 left-0 flex w-full ${width} flex-col bg-white shadow-2xl animate-[slideInLeft_.2s_ease-out] dark:bg-stone-900`}>
        <header className="flex items-start justify-between gap-3 border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" aria-label="إغلاق" onClick={onClose}><X size={18} /></Button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-2 border-t border-stone-200 bg-stone-50/80 px-5 py-3 dark:border-stone-800 dark:bg-stone-950/40">{footer}</footer>}
      </div>
    </div>
  );
}

// ===== نافذة تأكيد بديلة لـ window.confirm =====
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);
  const confirmButton = useRef(null);

  const confirm = useCallback((options) => new Promise((resolve) => {
    resolver.current = resolve;
    setDialog({ confirmText: 'تأكيد', tone: 'danger', ...options });
  }), []);

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  };

  useEffect(() => {
    if (!dialog) return undefined;
    confirmButton.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialog]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={dialog.title}>
          <div className="absolute inset-0 bg-stone-950/50 backdrop-blur-[2px]" onClick={() => close(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-[popIn_.15s_ease-out] dark:bg-stone-900">
            <div className="flex gap-4">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${dialog.tone === 'danger' ? 'bg-red-50 text-red-600 dark:bg-red-950/50' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50'}`}>
                <AlertTriangle size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">{dialog.title}</h3>
                {dialog.message && <p className="mt-1.5 text-sm leading-6 text-stone-600 dark:text-stone-300">{dialog.message}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => close(false)}>إلغاء</Button>
              <Button ref={confirmButton} variant={dialog.tone === 'danger' ? 'danger' : 'primary'} onClick={() => close(true)}>{dialog.confirmText}</Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const confirm = useContext(ConfirmContext);
  // احتياطي إن استُخدم المكوّن خارج اللوحة
  return confirm || (async ({ title, message }) => window.confirm([title, message].filter(Boolean).join('\n')));
};

// معاينة الصور المختارة قبل رفعها
export function useObjectUrls(files) {
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    const list = Array.from(files || []).map((file) => URL.createObjectURL(file));
    setUrls(list);
    return () => list.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);
  return urls;
}

export const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;
