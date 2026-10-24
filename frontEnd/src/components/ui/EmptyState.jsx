export default function EmptyState({ text }) {
  return (
    <div className="rounded-3xl border border-dashed border-stone-300 p-8 text-center text-stone-600 dark:border-stone-700 dark:text-stone-300">
      {text}
    </div>
  );
}
