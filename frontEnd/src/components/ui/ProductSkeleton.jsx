export default function ProductSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl bg-white shadow-soft dark:bg-stone-900">
      <div className="h-64 bg-stone-200 dark:bg-stone-700" />
      <div className="space-y-4 p-5">
        <div className="h-5 w-2/3 rounded bg-stone-200 dark:bg-stone-700" />
        <div className="h-4 w-full rounded bg-stone-200 dark:bg-stone-700" />
        <div className="h-4 w-1/2 rounded bg-stone-200 dark:bg-stone-700" />
      </div>
    </div>
  );
}
