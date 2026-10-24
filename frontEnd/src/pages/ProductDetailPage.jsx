import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Minus, Plus, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import Seo from '../components/Seo';
import Price from '../components/ui/Price';
import ColorLabel from '../components/ui/ColorLabel';
import { useShowPrices } from '../context/SiteContext';
import { CURRENCY } from '../config/locale';
import { formatCurrency, hasOptions, imageUrl, getWhatsappNumber, whatsappLink } from '../utils/format';

export default function ProductDetailPage({ siteSettings }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleFavorite, favorites } = useFavorites();
  const showPrices = useShowPrices();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('');
  const [fabric, setFabric] = useState('');

  const galleryImages = product?.images?.length ? product.images.map((img) => imageUrl(img)) : [imageUrl('')];
  const currentIndex = galleryImages.indexOf(selectedImage) >= 0 ? galleryImages.indexOf(selectedImage) : 0;

  const showNextImage = () => {
    const nextIndex = (currentIndex + 1) % galleryImages.length;
    setSelectedImage(galleryImages[nextIndex]);
  };

  const showPrevImage = () => {
    const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    setSelectedImage(galleryImages[prevIndex]);
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        setSelectedImage(imageUrl(data.product?.images?.[0]));
        setReviews(data.reviews || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'تعذر تحميل المنتج.');
      }
    };

    setQuantity(1);
    setColor('');
    setColorHex('');
    setFabric('');
    loadProduct();
  }, [id]);

  if (!product) return <LoadingState />;

  const colors = product.options?.colors || [];
  const fabrics = product.options?.fabrics || [];
  const isFavorite = favorites.some((item) => item._id === product._id || item === product._id);

  const openWhatsApp = () => {
    const productLink = `${window.location.origin}/products/${product._id}`;
    const categoryLabel = [product.category, product.subcategory].filter(Boolean).join(' / ') || 'منتج';
    const text = `السلام عليكم، أود الاستفسار عن المنتج التالي:\nاسم المنتج: ${product.name}${showPrices ? `\nالسعر: ${formatCurrency(product.price)}` : ''}\nالفئة: ${categoryLabel}\nالرابط: ${productLink}\nأرغب في معرفة التوفر والتوصيل.`;
    window.open(whatsappLink(getWhatsappNumber(siteSettings.contact), text), '_blank');
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('سجّل الدخول للمتابعة.');
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    if (!product.inStock) {
      toast.error('هذا المنتج غير متوفر حاليًا.');
      return;
    }
    if (colors.length && !color) {
      toast.error('اختر اللون أولًا.');
      return;
    }
    if (fabrics.length && !fabric) {
      toast.error('اختر القماش أولًا.');
      return;
    }
    const result = await addToCart(product._id, quantity, { color, colorHex, fabric });
    if (result.ok) {
      toast.success(`تمت إضافة ${quantity} إلى السلة.`);
      setQuantity(1);
    } else {
      toast.error(result.message);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      toast.error('سجّل الدخول للمتابعة.');
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    try {
      const { data } = await api.post(`/reviews/product/${product._id}`, { rating, comment });
      toast.success(data.message || 'تمت إضافة تقييمك.');
      const { data: refreshed } = await api.get(`/products/${id}`);
      setReviews(refreshed.reviews || []);
      setProduct(refreshed.product);
      setComment('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إرسال التقييم.');
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      toast.error('سجّل الدخول للمتابعة.');
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    await toggleFavorite(product._id);
    toast.success(isFavorite ? 'تمت إزالة المنتج من المفضلة.' : 'تمت إضافة المنتج إلى المفضلة.');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Seo title={product.name} description={product.description} image={galleryImages[0]} type="product" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: galleryImages,
            category: [product.category, product.subcategory].filter(Boolean).join(' / '),
            ...(showPrices
              ? {
                  offers: {
                    '@type': 'Offer',
                    priceCurrency: CURRENCY.code,
                    price: product.price,
                    availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                  },
                }
              : {}),
            ...(product.ratingCount ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.ratingAverage, reviewCount: product.ratingCount } } : {}),
          }).replace(/</g, '\\u003c'),
        }}
      />
      <button type="button" onClick={() => navigate('/products')} className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-2 text-sm font-medium text-brand-700 shadow-sm backdrop-blur dark:border-brand-900/40 dark:bg-stone-900/80 dark:text-brand-200">
        العودة إلى المنتجات
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="luxury-panel rounded-[32px] p-4 sm:p-5">
          <div className="relative overflow-hidden rounded-[26px] bg-stone-100">
            <img src={selectedImage} alt={product.name} className="h-[420px] w-full object-cover sm:h-[520px]" />
            {galleryImages.length > 1 && (
              <>
                <button type="button" onClick={showPrevImage} className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/75 text-stone-800 shadow-lg backdrop-blur-sm">
                  <ChevronLeft size={18} />
                </button>
                <button type="button" onClick={showNextImage} className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/75 text-stone-800 shadow-lg backdrop-blur-sm">
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`overflow-hidden rounded-[18px] border-2 transition ${selectedImage === image ? 'border-brand-700 ring-2 ring-[#f0dac1] dark:ring-brand-900/40' : 'border-transparent opacity-75 hover:opacity-100'}`}
                >
                  <img src={image} alt={`${product.name}-${index + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,242,236,0.92))] p-6 shadow-[0_22px_55px_rgba(58,39,23,0.08)] dark:border-stone-700 dark:bg-[linear-gradient(135deg,rgba(28,25,23,0.98),rgba(24,21,19,0.96))]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="inline-flex rounded-full bg-[#f7e7d4] px-2.5 py-1 text-[10px] font-medium text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">{[product.category, product.subcategory].filter(Boolean).join(' / ')}</span>
            </div>
            <button type="button" onClick={handleFavoriteToggle} className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
              <Heart size={18} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
            </button>
          </div>

          <h1 className="mb-4 text-3xl font-black text-stone-900 dark:text-stone-50 sm:text-4xl">{product.name}</h1>

          <div className="mb-4 flex items-center gap-2 text-amber-500">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={16} fill={index < Math.round(product.ratingAverage || 0) ? 'currentColor' : 'none'} />
            ))}
            <span className="text-sm text-stone-600 dark:text-stone-300">({product.ratingCount || 0} تقييم)</span>
          </div>

          <p className="mb-6"><Price value={product.price} className="text-xl font-black text-brand-700 dark:text-brand-200" /></p>
          <p className="mb-8 text-base leading-8 text-stone-700 dark:text-stone-300">{product.description}</p>

          {hasOptions(product) && (
            <div className="mb-6 space-y-5">
              {colors.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1 text-sm font-medium text-stone-700 dark:text-stone-300">
                    اللون:
                    <span className="font-bold text-brand-700 dark:text-brand-200">
                      {color ? <ColorLabel name={color} hex={colorHex} /> : 'اختر لونًا'}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c) => {
                      const isSelected = color === c.name && colorHex === (c.hex || '');
                      return (
                      <button
                        key={`${c.name}-${c.hex || ''}`}
                        type="button"
                        onClick={() => {
                          setColor(c.name);
                          setColorHex(c.hex || '');
                        }}
                        aria-pressed={isSelected}
                        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm transition ${isSelected ? 'border-brand-700 bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-100' : 'border-stone-200 bg-white text-stone-700 hover:border-brand-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'}`}
                      >
                        {c.hex && <span className="h-6 w-6 rounded-full border border-stone-300 shadow-sm" style={{ backgroundColor: c.hex }} />}
                        {c.name}
                      </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {fabrics.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">القماش: <span className="font-bold text-brand-700 dark:text-brand-200">{fabric || 'اختر قماشًا'}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {fabrics.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFabric(f)}
                        aria-pressed={fabric === f}
                        className={`rounded-full border-2 px-4 py-1.5 text-sm transition ${fabric === f ? 'border-brand-700 bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-100' : 'border-stone-200 bg-white text-stone-700 hover:border-brand-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-2 py-1 dark:border-stone-700 dark:bg-stone-900">
              <button type="button" aria-label="تقليل الكمية" disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 transition hover:bg-stone-200 disabled:opacity-40 dark:bg-stone-800 dark:hover:bg-stone-700">
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-lg font-bold">{quantity}</span>
              <button type="button" aria-label="زيادة الكمية" disabled={quantity >= 99} onClick={() => setQuantity((q) => Math.min(99, q + 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 transition hover:bg-stone-200 disabled:opacity-40 dark:bg-stone-800 dark:hover:bg-stone-700">
                <Plus size={16} />
              </button>
            </div>
            <button type="button" onClick={handleAddToCart} className="premium-button-primary rounded-full px-6 py-3 text-base font-medium text-white">أضف إلى السلة</button>
            <button type="button" onClick={openWhatsApp} className="premium-button-secondary rounded-full px-6 py-3 text-base font-medium text-green-700 dark:text-green-300">استفسار عبر واتساب</button>
          </div>

          <div className="rounded-[26px] border border-stone-200 bg-white/60 p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900/60">
            <h3 className="mb-4 text-lg font-black text-stone-900 dark:text-stone-100">المواصفات</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-stone-100 p-3 dark:bg-stone-800">
                <span className="block text-[11px] text-stone-500 dark:text-stone-400">الأبعاد</span>
                <span className="mt-1 block font-medium text-stone-800 dark:text-stone-200">{product.specs?.dimensions || 'غير محدد'}</span>
              </div>
              <div className="rounded-2xl bg-stone-100 p-3 dark:bg-stone-800">
                <span className="block text-[11px] text-stone-500 dark:text-stone-400">المواد</span>
                <span className="mt-1 block font-medium text-stone-800 dark:text-stone-200">{product.specs?.materials || 'غير محدد'}</span>
              </div>
              <div className="rounded-2xl bg-stone-100 p-3 dark:bg-stone-800">
                <span className="block text-[11px] text-stone-500 dark:text-stone-400">الألوان</span>
                <span className="mt-1 block font-medium text-stone-800 dark:text-stone-200">{product.specs?.colors || 'غير محدد'}</span>
              </div>
              <div className="rounded-2xl bg-stone-100 p-3 dark:bg-stone-800">
                <span className="block text-[11px] text-stone-500 dark:text-stone-400">الحالة</span>
                <span className="mt-1 block font-medium text-stone-800 dark:text-stone-200">{product.inStock ? 'متوفر' : 'غير متوفر'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 rounded-[32px] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(249,245,240,0.92))] p-6 shadow-[0_22px_50px_rgba(50,35,25,0.08)] dark:border-stone-700 dark:bg-[linear-gradient(135deg,rgba(28,25,23,0.98),rgba(18,16,15,0.97))]">
        <h3 className="mb-6 text-2xl font-black text-stone-900 dark:text-stone-100">التقييمات</h3>

        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">التقييم</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-right outline-none ring-0 transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900">
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} نجوم</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">التعليق</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="اكتب تعليقك..." className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-right outline-none transition focus:border-brand-500 dark:border-stone-700 dark:bg-stone-900" rows={3} />
          </div>
        </div>

        <button type="button" onClick={handleReviewSubmit} className="premium-button-primary rounded-full px-6 py-3 text-base font-medium text-white">إرسال التقييم</button>

        <div className="mt-8 space-y-4">
          {reviews.length === 0 ? (
            <EmptyState text="لا توجد تقييمات بعد." />
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="rounded-[22px] border border-stone-200 bg-white/70 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/60">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-stone-900 dark:text-stone-100">{review.user?.name || 'مستخدم'}</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={14} fill={idx < review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                <p className="text-stone-600 dark:text-stone-300">{review.comment || 'لا يوجد تعليق.'}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
