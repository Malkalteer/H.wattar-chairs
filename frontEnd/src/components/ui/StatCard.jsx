export default function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-stone-500">{label}</span>
        <span className="text-brand-700 dark:text-brand-200">{icon}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}
