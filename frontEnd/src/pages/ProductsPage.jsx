import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../api/axios';
import ProductCard from '../components/ui/ProductCard';
import ProductSkeleton from '../components/ui/ProductSkeleton';
import EmptyState from '../components/ui/EmptyState';
import SectionHeading from '../components/ui/SectionHeading';
import Seo from '../components/Seo';
import { useShowPrices } from '../context/SiteContext';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const showPrices = useShowPrices();
  const [sort, setSort] = useState('featured');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const mainCategories = categories.filter((item) => !item.parent);
  const subcategories = categories.filter((item) => item.parent?.name === category);

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(data.categories || []))
      .catch((error) => console.error('تعذر تحميل الأصناف:', error));
  }, []);

  useEffect(() => {
    if (!showPrices && sort.startsWith('price')) setSort('featured');
  }, [showPrices, sort]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/products', {
          params: {
            category: category === 'all' ? undefined : category,
            subcategory: subcategory || undefined,
            search,
            sort: sort === 'featured' ? undefined : sort,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            inStock: inStockOnly ? 'true' : undefined,
          },
        });
        setProducts(data.products || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [category, subcategory, search, sort, minPrice, maxPrice, inStockOnly]);

  const orderedProducts = useMemo(() => {
    const list = [...products];
    // عند اختيار ترتيب محدد نحترم ترتيب الخادم
    if (sort !== 'featured') return list;

    return list.sort((a, b) => {
      if (Number(b.featured) !== Number(a.featured)) {
        return Number(b.featured) - Number(a.featured);
      }

      const categoryOrder = mainCategories.map((item) => item.name);
      const categoryA = categoryOrder.indexOf(a.category);
      const categoryB = categoryOrder.indexOf(b.category);

      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [mainCategories, products, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Seo title="منتجاتنا" description="تصفح كراسي ومجالس ومفروشات Wattar Chair بأسعار وتصاميم متنوعة." />
      <SectionHeading title="منتجاتنا" subtitle="تصفح مجموعتنا المميزة" />

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:w-auto">
          <div className="flex flex-wrap gap-2">
            {[{ name: 'all', label: 'الكل' }, ...mainCategories.map((item) => ({ name: item.name, label: item.name }))].map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => { setCategory(item.name); setSubcategory(''); }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition sm:px-5 ${category === item.name ? 'bg-brand-700 text-white shadow-lg shadow-brand-700/20' : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-200 dark:ring-stone-700 dark:hover:bg-stone-800'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {!!subcategories.length && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSubcategory('')}
                className={`rounded-full px-4 py-2 text-xs font-medium ${!subcategory ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100' : 'bg-white text-stone-600 dark:bg-stone-900 dark:text-stone-300'}`}
              >
                كل {category}
              </button>
              {subcategories.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setSubcategory(item.name)}
                  className={`rounded-full px-4 py-2 text-xs font-medium ${subcategory === item.name ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100' : 'bg-white text-stone-600 dark:bg-stone-900 dark:text-stone-300'}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-full max-w-md">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن المنتج..."
              className="w-full rounded-full border border-stone-200 bg-white py-2.5 pe-10 ps-4 text-right text-sm outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900"
            />
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
          ترتيب:
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border border-stone-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-stone-700 dark:bg-stone-900">
            <option value="featured">المميزة أولًا</option>
            <option value="-createdAt">الأحدث</option>
            {showPrices && <option value="price-asc">السعر: الأقل</option>}
            {showPrices && <option value="price-desc">السعر: الأعلى</option>}
            <option value="rating">الأعلى تقييمًا</option>
          </select>
        </label>
        {showPrices && (
        <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
          السعر:
          <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="من" className="w-24 rounded-full border border-stone-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-stone-700" />
          <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="إلى" className="w-24 rounded-full border border-stone-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-stone-700" />
        </label>
        )}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="h-4 w-4 accent-brand-700" />
          المتوفر فقط
        </label>
        {(minPrice || maxPrice || inStockOnly || sort !== 'featured') && (
          <button type="button" onClick={() => { setSort('featured'); setMinPrice(''); setMaxPrice(''); setInStockOnly(false); }} className="text-sm text-brand-700 underline dark:text-brand-200">إعادة ضبط</button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState text="لا توجد منتجات مطابقة للبحث الحالي." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {orderedProducts.map((product) => (
            <div key={product._id} className="rounded-[28px] bg-gradient-to-br from-white via-stone-50 to-stone-100 p-2 shadow-[0_20px_45px_rgba(28,25,23,0.06)] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
