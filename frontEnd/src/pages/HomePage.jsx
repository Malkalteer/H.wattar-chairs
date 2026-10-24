import { useEffect, useState } from 'react';
import { Armchair, BadgeCheck, BellDot, Briefcase, Check, Grid2x2, Home, LampDesk, MessageCircle, Package, PackageOpen, Sofa, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import HeroSection from '../components/ui/HeroSection';
import ProductCard from '../components/ui/ProductCard';
import ProductSkeleton from '../components/ui/ProductSkeleton';
import SectionHeading from '../components/ui/SectionHeading';
import SiteComments from '../components/ui/SiteComments';
import MapEmbed from '../components/ui/MapEmbed';
import FaqSection from '../components/ui/FaqSection';
import Seo from '../components/Seo';
import { displayWhatsapp, getWhatsappNumber, imageUrl, telHref, whatsappLink } from '../utils/format';
import { defaultSiteContent } from '../data/siteContent';

export default function HomePage({ siteSettings }) {
  const [products, setProducts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const categoryIcons = {
    all: <Grid2x2 size={15} />,
    كراسي: <Armchair size={15} />,
    مجالس: <Sofa size={15} />,
    مفروشات: <PackageOpen size={15} />,
    اكسسوارات: <LampDesk size={15} />,
    أخرى: <Package size={15} />,
  };

  useEffect(() => {
    api.get('/projects').then(({ data }) => setProjects(data.projects || [])).catch(() => {});
    api.get('/categories')
      .then(({ data }) => setCategories(data.categories || []))
      .catch((error) => console.error('تعذر تحميل الأصناف:', error));
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await api.get('/products');
        setProducts(data.products || []);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const featuredProducts = products.filter((product) => product.featured).length ? products.filter((product) => product.featured) : products.slice(0, 4);
  const galleryProducts = products.slice(0, 4);
  const mainCategories = categories.filter((category) => !category.parent);
  const categoryOptions = mainCategories.map((category) => category.name);
  const subcategoryOptions = categories.filter((category) => category.parent?.name === selectedCategory);
  const activeCategoryProducts = products.filter((product) => (
    (selectedCategory === 'all' || product.category === selectedCategory)
    && (!selectedSubcategory || product.subcategory === selectedSubcategory)
  ));
  const serviceCards = selectedCategory === 'all'
    ? (mainCategories.length ? mainCategories.map(({ name: category }) => ({
        title: category,
        description: `مجموعة ${category} المميزة والجاهزة للتخصيص.`,
        count: products.filter((product) => product.category === category).length,
        icon: categoryIcons[category] || <Package size={22} />,
      })) : (siteSettings.services || defaultSiteContent.services))
    : [{
        title: selectedCategory,
        description: `منتجات ${selectedCategory} المتاحة حالياً في المتجر.`,
        count: activeCategoryProducts.length,
        icon: categoryIcons[selectedCategory] || <Package size={22} />,
      }];

  return (
    <>
      <Seo description={siteSettings.aboutText} />
      <HeroSection siteSettings={siteSettings} />

      <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading title="من نحن" subtitle="منصة متخصصة في التصميم والحرفية" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-stone-200 bg-gradient-to-br from-white via-[#fffdf9] to-[#f7efe6] p-6 shadow-[0_18px_40px_rgba(61,42,22,0.08)] dark:border-stone-700 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950">
            <p className="text-base leading-8 text-stone-700 sm:text-lg dark:text-stone-300">{siteSettings.aboutText}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {['جودة خامات عالية', 'تصميم مخصص', 'مقاسات حسب الطلب', 'توصيل موثوق'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[22px] border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 text-brand-800 shadow-sm dark:border-brand-900/40 dark:from-brand-900/20 dark:to-stone-900 dark:text-brand-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm dark:bg-stone-800 dark:text-brand-200">
                  <BadgeCheck size={18} />
                </div>
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeading title="خدماتنا" subtitle="ما نصنعه لك" />

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => { setSelectedCategory('all'); setSelectedSubcategory(''); }}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${selectedCategory === 'all' ? 'bg-brand-700 text-white' : 'bg-white text-stone-700 dark:bg-stone-900 dark:text-stone-200'}`}
          >
            <Grid2x2 size={15} />
            جميع الأقسام
          </button>
          {categoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => { setSelectedCategory(category); setSelectedSubcategory(''); }}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${selectedCategory === category ? 'bg-brand-700 text-white' : 'bg-white text-stone-700 dark:bg-stone-900 dark:text-stone-200'}`}
            >
              {categoryIcons[category] || <Package size={15} />}
              {category}
            </button>
          ))}
        </div>

        {!!subcategoryOptions.length && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedSubcategory('')}
              className={`rounded-full px-4 py-2 text-xs font-medium ${!selectedSubcategory ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100' : 'bg-white text-stone-600 dark:bg-stone-900 dark:text-stone-300'}`}
            >
              جميع {selectedCategory}
            </button>
            {subcategoryOptions.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => setSelectedSubcategory(item.name)}
                className={`rounded-full px-4 py-2 text-xs font-medium ${selectedSubcategory === item.name ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100' : 'bg-white text-stone-600 dark:bg-stone-900 dark:text-stone-300'}`}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          {serviceCards.map((service, idx) => {
            const palettes = [
              'from-[#fff7ed] via-[#fff] to-[#f6e7d3]',
              'from-[#f7f3ff] via-[#fff] to-[#e8ddff]',
              'from-[#edf8f2] via-[#fff] to-[#dff4ea]',
            ];

            return (
              <button
                key={service.title || idx}
                type="button"
                onClick={() => setSelectedCategory(service.title === 'all' ? 'all' : service.title)}
                className={`group rounded-[28px] border border-stone-200 bg-gradient-to-br ${palettes[idx % palettes.length]} p-5 text-right shadow-[0_16px_35px_rgba(58,43,27,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(58,43,27,0.12)] dark:border-stone-700 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 sm:p-6`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm ring-1 ring-brand-100 dark:bg-stone-800 dark:text-brand-200 dark:ring-brand-900/30 sm:h-14 sm:w-14">
                  {service.icon || (idx === 0 ? <Briefcase size={22} /> : idx === 1 ? <Home size={22} /> : <Package size={22} />)}
                </div>
                <h3 className="mb-2 text-xl font-black text-stone-900 dark:text-white sm:text-[1.4rem]">{service.title}</h3>
                <p className="mb-4 text-sm leading-7 text-stone-600 dark:text-stone-300 sm:text-[15px]">{service.description}</p>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100 dark:bg-stone-800/80 dark:text-brand-200 dark:ring-brand-900/30">
                  {service.count || 0} منتج
                </span>
              </button>
            );
          })}
        </div>

        {selectedCategory !== 'all' && activeCategoryProducts.length > 0 && (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {activeCategoryProducts.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <SectionHeading title="منتجاتنا" subtitle="منتجات مميزة في المتجر" />
          <Link to="/products" className="rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-white">تصفح المجموعة</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
          ) : (
            featuredProducts.map((product) => <ProductCard key={product._id} product={product} />)
          )}
        </div>
      </section>

      <section className="bg-[linear-gradient(135deg,#1f1917,#2a211d,#1a1715)] py-16 text-white dark:bg-[linear-gradient(135deg,#09090b,#171717,#09090b)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="لماذا نحن؟" subtitle="اختر الجودة والالتزام" invert />
          <div className="grid gap-6 md:grid-cols-4">
            {[['تجربة مخصصة', 'نصمم لك منتجات تناسب أجواء منزلك.'], ['مواد عالية الجودة', 'نستخدم خشب وقماش وأقمشة متينة.'], ['خدمة سريعة', 'رد سريع وتواصل مباشر عبر واتساب.'], ['أسعار مناسبة', 'نقدم قيمة عالية مع جودة حقيقية.']].map(([title, desc]) => (
              <div key={title} className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_18px_35px_rgba(0,0,0,0.12)] backdrop-blur-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4d1a2] text-stone-900 shadow-lg shadow-[#d9a76b]/30">
                  <Check size={20} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
                <p className="text-sm leading-7 text-stone-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <SectionHeading title="معرض أعمالنا" subtitle="مشاريع منفذة" />
          <Link to="/gallery" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">عرض الكل</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projects.length > 0
            ? projects.slice(0, 8).map((project) => (
                <Link key={project._id} to="/gallery" className="group relative overflow-hidden rounded-3xl shadow-soft transition hover:-translate-y-1">
                  <img src={imageUrl(project.images?.[0])} alt={project.title} className="h-64 w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm font-bold text-white">{project.title}</div>
                </Link>
              ))
            : (galleryProducts.length ? galleryProducts : (siteSettings.gallery || defaultSiteContent.gallery)).map((item, idx) => {
                const image = typeof item === 'string' ? item : imageUrl(item.images?.[0]);
                const productId = typeof item === 'string' ? null : item._id;
                const productName = typeof item === 'string' ? `معرض ${idx + 1}` : item.name;

                return (
                  <Link key={productId || `${productName}-${idx}`} to={productId ? `/products/${productId}` : '/products'} className="overflow-hidden rounded-3xl shadow-soft transition hover:-translate-y-1">
                    <img src={image} alt={productName} className="h-64 w-full object-cover transition duration-500 hover:scale-105" loading="lazy" />
                  </Link>
                );
              })}
        </div>
      </section>

      <SiteComments fallback={siteSettings.testimonials || defaultSiteContent.testimonials} />

      <FaqSection faqs={siteSettings.faqs?.length ? siteSettings.faqs : defaultSiteContent.faqs} />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 p-8 text-center text-white shadow-soft sm:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <Sparkles size={28} />
          </div>
          <h2 className="mb-3 text-2xl font-black sm:text-3xl">مساعدنا الذكي بخدمتك</h2>
          <p className="mx-auto mb-6 max-w-xl text-sm leading-7 text-brand-100 sm:text-base">اسأل عن المنتجات والأسعار وأوقات العمل وسيجيبك المساعد فورًا في محادثة مباشرة.</p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('wattar:open-chat'))}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-brand-800 shadow-lg transition hover:scale-105"
          >
            <MessageCircle size={18} /> ابدأ المحادثة
          </button>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading title="تواصل معنا" subtitle="لطلب المنتج أو الاستفسار" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-soft dark:bg-stone-900">
            <ul className="space-y-4 text-stone-700 dark:text-stone-200">
              <li><strong>الهاتف:</strong> {siteSettings.contact.phone}</li>
              <li><strong>واتساب:</strong> <span dir="ltr">{displayWhatsapp(siteSettings.contact)}</span></li>
              <li><strong>العنوان:</strong> {siteSettings.contact.address}</li>
              <li><strong>ساعات العمل:</strong> {siteSettings.contact.workingHours}</li>
              {siteSettings.contact.email && <li><strong>البريد:</strong> {siteSettings.contact.email}</li>}
            </ul>
            <div className="mt-6 flex gap-3">
              <a href={whatsappLink(getWhatsappNumber(siteSettings.contact), 'السلام عليكم، أريد الاستفسار عن منتجاتكم.')} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full bg-green-600 px-4 py-3 text-white">
                <MessageCircle className="ms-2" size={18} /> واتساب
              </a>
              <a href={telHref(siteSettings.contact.phone)} className="inline-flex items-center rounded-full bg-brand-700 px-4 py-3 text-white">
                <BellDot className="ms-2" size={18} /> اتصال مباشر
              </a>
            </div>
          </div>
          <MapEmbed contact={siteSettings.contact} />
        </div>
      </section>
    </>
  );
}
