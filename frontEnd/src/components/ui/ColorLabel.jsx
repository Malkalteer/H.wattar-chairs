const isValidHex = (value) => /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(String(value || ''));

export default function ColorLabel({ name, hex }) {
  const showSwatch = isValidHex(hex);

  return (
    <span className="inline-flex items-center gap-1.5">
      {showSwatch && (
        <span
          aria-label={`عينة اللون ${hex}`}
          className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-stone-300"
          style={{ backgroundColor: hex }}
        />
      )}
      <span>{name}</span>
      {showSwatch && <span className="font-mono text-[10px] text-stone-500" dir="ltr">{hex}</span>}
    </span>
  );
}
