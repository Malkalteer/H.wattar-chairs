export default function SectionHeading({ title, subtitle, invert = false }) {
  return (
    <div className="mb-8 text-center">
      <p className={`text-[13px] font-medium sm:text-sm ${invert ? 'text-brand-200' : 'text-brand-700 dark:text-brand-200'}`}>
        {subtitle}
      </p>
      <h2 className={`mt-2 text-[1.8rem] font-black leading-tight sm:text-3xl ${invert ? 'text-white' : 'text-stone-900 dark:text-white'}`}>
        {title}
      </h2>
    </div>
  );
}
