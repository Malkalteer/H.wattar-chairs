import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  BellRing,
  Factory,
  Images,
  MessageSquareQuote,
  PackagePlus,
  PackageX,
  RefreshCw,
  Settings,
  ShoppingBag,
  Star,
  UserPlus,
} from 'lucide-react';
import { ORDER_STATUSES, formatCurrency, formatDate, imageUrl } from '../../utils/format';
import { DATE_LOCALE, NUMBER_LOCALE } from '../../config/locale';
import { Badge, Button, Card, EmptyState, FilterTabs, Skeleton } from './adminUi';

const formatNumber = (value) => Number(value || 0).toLocaleString(NUMBER_LOCALE);

// صيغة مختصرة لقيم المحور: 1.2K، 3M
const compact = (value) => {
  try {
    return new Intl.NumberFormat(NUMBER_LOCALE, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  } catch {
    return formatNumber(value);
  }
};

const percentChange = (current, previous) => {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'صباح الخير';
  if (hour < 18) return 'مساء الخير';
  return 'مساء النور';
};

function Delta({ value }) {
  if (value === null) return <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">جديد</span>;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${up ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'}`}>
      <Icon size={12} />
      {Math.abs(value).toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 0 })}٪
    </span>
  );
}

function KpiCard({ label, value, icon: Icon, delta, hint, onClick, highlight }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border bg-white p-5 text-right shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition dark:bg-stone-900 ${highlight ? 'border-brand-300 ring-4 ring-brand-500/5 dark:border-brand-700' : 'border-stone-200/80 dark:border-stone-800'} ${onClick ? 'hover:-translate-y-0.5 hover:shadow-md' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-stone-900 dark:text-stone-50">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
        {delta !== undefined && <Delta value={delta} />}
        <span>{hint}</span>
        {onClick && <ArrowLeft size={13} className="ms-auto opacity-0 transition group-hover:opacity-100" />}
      </div>
    </Wrapper>
  );
}

// مخطط أعمدة لسلسلة واحدة مع تلميح عند المرور
function DailyChart({ data, metric }) {
  const [active, setActive] = useState(null);
  const values = data.map((d) => d[metric]);
  const max = Math.max(...values, 0);
  // سقف مقرّب للمحور حتى تكون خطوط الشبكة أرقامًا مقروءة
  const ceiling = useMemo(() => {
    if (!max) return 1;
    const magnitude = 10 ** Math.floor(Math.log10(max));
    return Math.ceil(max / magnitude) * magnitude;
  }, [max]);
  const format = metric === 'revenue' ? formatCurrency : formatNumber;
  const ticks = [ceiling, ceiling / 2, 0];
  const total = values.reduce((sum, v) => sum + v, 0);
  const point = active !== null ? data[active] : null;

  const dayLabel = (date, opts) => new Date(`${date}T00:00:00`).toLocaleDateString(DATE_LOCALE, opts);

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-2xl font-black tabular-nums text-stone-900 dark:text-stone-50">{format(total)}</span>
        <span className="text-xs text-stone-500">خلال آخر {data.length} يومًا</span>
      </div>
      <div className="relative flex gap-2" onMouseLeave={() => setActive(null)}>
        {/* محور القيم */}
        <div className="flex h-56 w-12 shrink-0 flex-col justify-between pb-6 text-left text-[10px] tabular-nums text-stone-400">
          {ticks.map((tick) => <span key={tick} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{metric === 'revenue' ? compact(tick) : formatNumber(Math.round(tick))}</span>)}
        </div>
        <div className="relative min-w-0 flex-1">
          {/* خطوط الشبكة */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: 'calc(100% - 1.5rem)' }}>
            {ticks.map((tick) => <div key={tick} className={`border-t ${tick === 0 ? 'border-stone-300 dark:border-stone-600' : 'border-dashed border-stone-200 dark:border-stone-800'}`} />)}
          </div>
          <div className="relative flex h-56 items-end gap-[2px] pb-6" dir="ltr" role="img" aria-label={`مخطط ${metric === 'revenue' ? 'الإيرادات' : 'الطلبات'} اليومية`}>
            {data.map((d, i) => {
              const height = (d[metric] / ceiling) * 100;
              const isActive = active === i;
              return (
                <div
                  key={d.date}
                  className="relative flex h-full flex-1 items-end"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  tabIndex={0}
                  aria-label={`${dayLabel(d.date, { day: 'numeric', month: 'long' })}: ${format(d[metric])}`}
                >
                  <div
                    className={`w-full rounded-t-[4px] transition-colors ${d[metric] ? (isActive ? 'bg-brand-700 dark:bg-brand-300' : active !== null ? 'bg-brand-300 dark:bg-brand-700' : 'bg-brand-500 dark:bg-brand-400') : 'bg-transparent'}`}
                    style={{ height: d[metric] ? `max(${height}%, 3px)` : 0 }}
                  />
                  {(i % 5 === 0 || i === data.length - 1) && (
                    <span dir="ltr" className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums text-stone-400">{`${Number(d.date.slice(8))}/${Number(d.date.slice(5, 7))}`}</span>
                  )}
                </div>
              );
            })}
          </div>
          {point && (
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-right shadow-lg dark:border-stone-700 dark:bg-stone-800"
              style={{ left: `${Math.min(Math.max(((active + 0.5) / data.length) * 100, 14), 86)}%` }}
            >
              <p className="whitespace-nowrap text-[11px] text-stone-500 dark:text-stone-400">{dayLabel(point.date, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <p className="whitespace-nowrap text-sm font-bold tabular-nums text-stone-900 dark:text-stone-50">{format(point[metric])}</p>
              <p className="whitespace-nowrap text-[11px] text-stone-500 dark:text-stone-400">{metric === 'revenue' ? `${formatNumber(point.orders)} طلب` : formatCurrency(point.revenue)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBreakdown({ byStatus = {}, onSelect }) {
  const entries = Object.entries(ORDER_STATUSES).map(([key, info]) => ({ key, label: info.label, count: byStatus[key] || 0 }));
  const total = entries.reduce((sum, e) => sum + e.count, 0);
  const max = Math.max(...entries.map((e) => e.count), 1);

  if (!total) return <EmptyState icon={ShoppingBag} title="لا توجد طلبات بعد" />;

  return (
    <ul className="space-y-1">
      {entries.map((entry) => (
        <li key={entry.key}>
          <button type="button" onClick={() => onSelect(entry.key)} className="group w-full rounded-lg px-2 py-2 text-right transition hover:bg-stone-50 dark:hover:bg-stone-800/60">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700 dark:text-stone-200">{entry.label}</span>
              <span className="flex items-center gap-2 tabular-nums">
                <b className="text-stone-900 dark:text-stone-100">{formatNumber(entry.count)}</b>
                <span className="w-10 rounded-md bg-stone-100 py-0.5 text-center text-[10px] text-stone-500 dark:bg-stone-800">{Math.round((entry.count / total) * 100)}٪</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <div className="h-full rounded-full bg-brand-500 transition-all group-hover:bg-brand-700 dark:bg-brand-400 dark:group-hover:bg-brand-300" style={{ width: `${(entry.count / max) * 100}%` }} />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-32" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-80 xl:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export default function OverviewAdmin({ summary, user, onNavigate, onRefresh }) {
  const [metric, setMetric] = useState('revenue');
  const [refreshing, setRefreshing] = useState(false);

  if (!summary) return <OverviewSkeleton />;

  const current = summary.period?.current || { revenue: 0, orders: 0 };
  const previous = summary.period?.previous || { revenue: 0, orders: 0 };
  const avgOrder = current.orders ? current.revenue / current.orders : 0;
  const topMax = Math.max(...(summary.topProducts || []).map((p) => p.quantity), 1);

  const refresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400">{new Date().toLocaleDateString(DATE_LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-stone-900 dark:text-stone-50">{greeting()}، {user.name.split(' ')[0]} 👋</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> تحديث
          </Button>
          <Button onClick={() => onNavigate('products', { new: '1' })}><PackagePlus size={16} /> منتج جديد</Button>
        </div>
      </div>

      {summary.newOrders > 0 && (
        <button
          type="button"
          onClick={() => onNavigate('orders', { status: 'new' })}
          className="flex w-full items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-l from-amber-50 to-white p-4 text-right transition hover:shadow-md dark:border-amber-900/60 dark:from-amber-950/40 dark:to-stone-900"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"><BellRing size={18} /></span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-stone-900 dark:text-stone-50">لديك {formatNumber(summary.newOrders)} طلب جديد بانتظار التأكيد</span>
            <span className="block text-xs text-stone-500 dark:text-stone-400">راجعها وأكّدها مع العملاء عبر واتساب</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">مراجعة <ArrowLeft size={14} /></span>
        </button>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="الإيرادات (30 يومًا)" value={formatCurrency(current.revenue)} icon={Banknote} delta={percentChange(current.revenue, previous.revenue)} hint="مقارنة بالفترة السابقة" />
        <KpiCard label="الطلبات (30 يومًا)" value={formatNumber(current.orders)} icon={ShoppingBag} delta={percentChange(current.orders, previous.orders)} hint={`متوسط الطلب ${formatCurrency(avgOrder)}`} onClick={() => onNavigate('orders')} />
        <KpiCard label="قيد التصنيع" value={formatNumber(summary.inProduction)} icon={Factory} hint={`من أصل ${formatNumber(summary.totalOrders)} طلب`} onClick={() => onNavigate('orders', { status: 'in_production' })} />
        <KpiCard label="عملاء جدد (30 يومًا)" value={formatNumber(summary.newUsers)} icon={UserPlus} hint={`إجمالي المشتركين ${formatNumber(summary.users)}`} onClick={() => onNavigate('users')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title={metric === 'revenue' ? 'الإيرادات اليومية' : 'الطلبات اليومية'}
          description="بدون الطلبات الملغاة"
          actions={(
            <FilterTabs
              value={metric}
              onChange={setMetric}
              options={[{ value: 'revenue', label: 'الإيرادات' }, { value: 'orders', label: 'الطلبات' }]}
            />
          )}
        >
          {summary.daily?.length ? <DailyChart data={summary.daily} metric={metric} /> : <EmptyState title="لا توجد بيانات بعد" />}
        </Card>

        <Card title="حالات الطلبات" description="اضغط على حالة لعرض طلباتها">
          <StatusBreakdown byStatus={summary.byStatus} onSelect={(status) => onNavigate('orders', { status })} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="أحدث الطلبات"
          actions={<Button variant="ghost" size="sm" onClick={() => onNavigate('orders')}>عرض الكل <ArrowLeft size={14} /></Button>}
          bodyClassName="-mx-5 -mb-5"
        >
          {summary.recentOrders?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-right text-sm">
                <thead>
                  <tr className="border-y border-stone-100 bg-stone-50/70 text-[11px] font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-950/30">
                    <th className="px-5 py-2.5">الطلب</th>
                    <th className="px-3 py-2.5">العميل</th>
                    <th className="px-3 py-2.5">التاريخ</th>
                    <th className="px-3 py-2.5">الحالة</th>
                    <th className="px-5 py-2.5 text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentOrders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => onNavigate('orders', { q: order.orderNumber })}
                      className="cursor-pointer border-b border-stone-100 transition last:border-0 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/40"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-stone-900 dark:text-stone-100" dir="ltr">{order.orderNumber}</td>
                      <td className="px-3 py-3">
                        <span className="block font-medium text-stone-800 dark:text-stone-200">{order.customer}</span>
                        <span className="text-[11px] text-stone-400">{formatNumber(order.items)} قطعة</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-stone-500">{formatDate(order.createdAt)}</td>
                      <td className="px-3 py-3"><Badge map={ORDER_STATUSES} status={order.status} /></td>
                      <td className="px-5 py-3 text-left font-bold tabular-nums text-stone-900 dark:text-stone-100">{formatCurrency(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={ShoppingBag} title="لا توجد طلبات بعد" description="ستظهر هنا أحدث الطلبات فور وصولها." />
          )}
        </Card>

        <Card title="الأكثر مبيعًا" description="حسب عدد القطع المطلوبة">
          {summary.topProducts?.length ? (
            <ul className="space-y-3">
              {summary.topProducts.map((product, index) => (
                <li key={product._id || index} className="flex items-center gap-3">
                  <img src={imageUrl(product.image, 'https://placehold.co/80x80/3f2d1f/fff?text=W')} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-semibold text-stone-800 dark:text-stone-200">{product.name}</span>
                      <span className="shrink-0 tabular-nums text-stone-500">{formatNumber(product.quantity)} قطعة</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                      <div className="h-full rounded-full bg-brand-500 dark:bg-brand-400" style={{ width: `${(product.quantity / topMax) * 100}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Star} title="لا توجد مبيعات بعد" />
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'المنتجات', value: summary.products, icon: PackagePlus, tab: 'products' },
          { label: 'غير متوفر حاليًا', value: summary.outOfStock, icon: PackageX, tab: 'products', extra: { stock: 'out' }, warn: summary.outOfStock > 0 },
          { label: 'التقييمات', value: summary.ratings, icon: Star, tab: 'products' },
          { label: 'تعليقات آخر 7 أيام', value: summary.recentComments, icon: MessageSquareQuote, tab: 'comments' },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigate(item.tab, item.extra)}
            className="flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 text-right transition hover:border-stone-300 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.warn ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}>
              <item.icon size={18} />
            </span>
            <span>
              <span className="block text-lg font-black tabular-nums text-stone-900 dark:text-stone-50">{formatNumber(item.value)}</span>
              <span className="block text-xs text-stone-500">{item.label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'إضافة منتج', description: 'أضف منتجًا جديدًا للمتجر', icon: PackagePlus, onClick: () => onNavigate('products', { new: '1' }) },
          { label: 'إضافة مشروع للمعرض', description: 'اعرض أعمالك المنفّذة', icon: Images, onClick: () => onNavigate('projects') },
          { label: 'إعدادات الموقع', description: 'المحتوى والتواصل والأسعار', icon: Settings, onClick: () => onNavigate('settings') },
        ].map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="group flex items-center gap-3 rounded-2xl border border-dashed border-stone-300 p-4 text-right transition hover:border-brand-400 hover:bg-brand-50/40 dark:border-stone-700 dark:hover:border-brand-600 dark:hover:bg-brand-900/10"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white dark:bg-brand-900/40 dark:text-brand-200"><action.icon size={18} /></span>
            <span>
              <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">{action.label}</span>
              <span className="block text-xs text-stone-500">{action.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
