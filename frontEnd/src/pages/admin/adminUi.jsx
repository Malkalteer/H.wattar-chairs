export const panelClass = 'rounded-[32px] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(249,245,240,0.92))] p-6 shadow-[0_22px_55px_rgba(58,39,23,0.08)] dark:border-stone-700 dark:bg-[linear-gradient(135deg,rgba(31,27,24,0.98),rgba(21,18,17,0.96))]';
export const inputClass = 'w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900';

export function Badge({ map, status }) {
  const info = map[status] || { label: status, color: 'bg-stone-100 text-stone-700' };
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${info.color}`}>{info.label}</span>;
}
