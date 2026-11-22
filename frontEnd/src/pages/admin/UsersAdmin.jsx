import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldOff, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatDate } from '../../utils/format';
import { Avatar, Button, Card, EmptyState, FilterTabs, PageHeader, Pill, SearchInput, Skeleton, errorMessage, useConfirm } from './adminUi';

export default function UsersAdmin({ currentUser }) {
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data.users || []);
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر تحميل المشتركين.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => ({
    all: users.length,
    active: users.filter((u) => !u.isBlocked && u.role !== 'admin').length,
    blocked: users.filter((u) => u.isBlocked).length,
    admin: users.filter((u) => u.role === 'admin').length,
  }), [users]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === 'active' && (u.isBlocked || u.role === 'admin')) return false;
      if (filter === 'blocked' && !u.isBlocked) return false;
      if (filter === 'admin' && u.role !== 'admin') return false;
      return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });
  }, [users, query, filter]);

  const toggleBlock = async (subscriber) => {
    if (!subscriber.isBlocked) {
      const ok = await confirm({ title: `حظر "${subscriber.name}"؟`, message: 'سيُسجَّل خروجه من كل الأجهزة فورًا ولن يتمكن من الدخول حتى تلغي الحظر.', confirmText: 'حظر', tone: 'warning' });
      if (!ok) return;
    }
    try {
      await api.put(`/auth/users/${subscriber._id}`, { isBlocked: !subscriber.isBlocked });
      toast.success(subscriber.isBlocked ? 'تم إلغاء الحظر.' : 'تم حظر المشترك.');
      load();
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر تحديث المشترك.'));
    }
  };

  const remove = async (subscriber) => {
    const ok = await confirm({ title: `حذف "${subscriber.name}"؟`, message: 'ستُحذف تقييماته وتعليقاته أيضًا ولا يمكن التراجع.', confirmText: 'حذف نهائي' });
    if (!ok) return;
    try {
      await api.delete(`/auth/users/${subscriber._id}`);
      toast.success('تم حذف المشترك.');
      load();
    } catch (error) {
      toast.error(errorMessage(error, 'تعذر حذف المشترك.'));
    }
  };

  return (
    <div>
      <PageHeader title="المشتركون" description={`${users.length} حساب مسجّل`} />
      <Card bodyClassName="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs
            value={filter}
            onChange={setFilter}
            options={[
              { value: '', label: 'الكل', count: counts.all },
              { value: 'active', label: 'نشط', count: counts.active },
              { value: 'blocked', label: 'محظور', count: counts.blocked },
              { value: 'admin', label: 'مدراء', count: counts.admin },
            ]}
          />
          <SearchInput value={query} onChange={setQuery} placeholder="الاسم أو البريد..." className="lg:w-72" />
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-14" />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState icon={Users} title="لا يوجد مشتركون مطابقون" />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead>
                <tr className="border-y border-stone-100 bg-stone-50/70 text-[11px] font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-950/30">
                  <th className="px-5 py-2.5">المشترك</th>
                  <th className="px-3 py-2.5">تاريخ التسجيل</th>
                  <th className="px-3 py-2.5">آخر دخول</th>
                  <th className="px-3 py-2.5">الحالة</th>
                  <th className="px-5 py-2.5 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const isSelf = item._id === currentUser._id;
                  const isAdminUser = item.role === 'admin';
                  return (
                    <tr key={item._id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60 dark:border-stone-800 dark:hover:bg-stone-800/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={item.name} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-stone-900 dark:text-stone-100">{item.name}{isSelf && <span className="ms-1.5 text-[11px] font-normal text-stone-400">(أنت)</span>}</p>
                            <p className="truncate text-[11px] text-stone-500" dir="ltr">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-stone-600 dark:text-stone-300">{formatDate(item.createdAt)}</td>
                      <td className="px-3 py-3 text-xs text-stone-600 dark:text-stone-300">{formatDate(item.lastLoginAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {isAdminUser ? <Pill tone="brand"><ShieldCheck size={11} /> مدير</Pill> : item.isBlocked ? <Pill tone="red">محظور</Pill> : <Pill tone="green">نشط</Pill>}
                          {item.emailVerified === false && <Pill tone="amber">بريد غير مؤكد</Pill>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {isAdminUser || isSelf ? (
                          <span className="block text-left text-xs text-stone-400">—</span>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => toggleBlock(item)}>
                              <ShieldOff size={13} /> {item.isBlocked ? 'إلغاء الحظر' : 'حظر'}
                            </Button>
                            <Button variant="danger-ghost" size="icon" aria-label="حذف" title="حذف" onClick={() => remove(item)}><Trash2 size={15} /></Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
