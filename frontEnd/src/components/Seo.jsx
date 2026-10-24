// React 19 ينقل وسوم title و meta تلقائيًا إلى <head>
export default function Seo({ title, description, image, type = 'website' }) {
  const fullTitle = title ? `${title} | Wattar Chair` : 'Wattar Chair | كراسي ومجالس ومفروشات';
  const desc = (description || 'مصنع Wattar Chair لتصنيع الكراسي والمجالس والمفروشات الفاخرة بجودة عالية وتصاميم مخصصة.').slice(0, 160);

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="ar_AR" />
      {image && <meta property="og:image" content={image} />}
    </>
  );
}
