import { Heart, MessageCircle, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useShowPrices, useSite } from '../../context/SiteContext';
import Price from './Price';
import { formatCurrency, getWhatsappNumber, hasOptions, imageUrl, whatsappLink } from '../../utils/format';

export default function ProductCard({ product }) {
  const { siteSettings } = useSite();
  const showPrices = useShowPrices();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleFavorite, favorites } = useFavorites();
  const isFavorite = favorites.some((item) => item._id === product._id || item === product._id);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('سجّل الدخول للمتابعة.');
      navigate('/login', { state: { from: '/products' } });
      return;
    }
    if (!product.inStock) {
      toast.error('هذا المنتج غير متوفر حاليًا.');
      return;
    }
    // المنتجات ذات الخيارات (لون/قماش) تحتاج اختيارًا من صفحة المنتج
    if (hasOptions(product)) {
      toast('اختر اللون أو القماش أولًا.');
      navigate(`/products/${product._id}`);
      return;
    }
    const result = await addToCart(product._id, 1);
    if (result.ok) toast.success('تمت إضافة المنتج إلى السلة.');
    else toast.error(result.message);
  };

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('سجّل الدخول للمتابعة.');
      navigate('/login', { state: { from: '/products' } });
      return;
    }
    await toggleFavorite(product._id);
    toast.success(isFavorite ? 'تمت إزالة المنتج من المفضلة.' : 'تمت إضافة المنتج إلى المفضلة.');
  };

  const openWhatsApp = (e) => {
    e.stopPropagation();
    const productLink = `${window.location.origin}/products/${product._id}`;
    const categoryLabel = [product.category, product.subcategory].filter(Boolean).join(' / ') || 'منتج';
    const text = `السلام عليكم، أود الاستفسار عن المنتج التالي:\nاسم المنتج: ${product.name}${showPrices ? `\nالسعر: ${formatCurrency(product.price)}` : ''}\nالفئة: ${categoryLabel}\nالرابط: ${productLink}`;
    window.open(whatsappLink(getWhatsappNumber(siteSettings.contact), text), '_blank');
  };

  return (
    <article
      onClick={() => navigate(`/products/${product._id}`)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-transparent bg-white/80 backdrop-blur-sm shadow-[0_26px_60px_rgba(67,43,22,0.14)] transition-transform duration-300 hover:-translate-y-2 hover:scale-[1.01] hover:shadow-[0_34px_80px_rgba(67,43,22,0.18)] dark:border-stone-800 dark:bg-stone-900/60"
    >
      <div className="relative overflow-hidden">
        <img
          src={imageUrl(product.images?.[0])}
          alt={product.name}
          className="h-60 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-72"
          loading="lazy"
        />

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />

        {product.inStock === false && (
          <span className="absolute bottom-3 right-3 rounded-full bg-stone-900/80 px-2.5 py-1 text-[10px] font-medium text-white">غير متوفر</span>
        )}

        {product.featured && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-medium text-white shadow-md">
            <Sparkles size={12} /> مميز
          </span>
        )}

        <button
          type="button"
          onClick={handleFavoriteToggle}
          className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/80 text-stone-700 shadow-lg backdrop-blur-sm transition hover:bg-white"
        >
          <Heart size={18} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-lg font-black text-stone-900 sm:text-xl dark:text-stone-100">{product.name}</h3>
          <span className="rounded-full bg-gradient-to-r from-[#f7e6d2] to-[#efe3d1] px-2.5 py-1 text-[10px] font-medium text-brand-800 dark:from-brand-900/60 dark:to-stone-800 dark:text-brand-200 sm:text-[11px]">{[product.category, product.subcategory].filter(Boolean).join(' / ')}</span>
        </div>

        <p className="mb-4 line-clamp-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{product.description}</p>

        <div className="mb-5 flex items-center justify-between gap-2">
          <div>
            {showPrices && <div className="text-[11px] text-stone-500 dark:text-stone-400">السعر</div>}
            <Price value={product.price} className="text-xl font-black text-brand-700 sm:text-2xl dark:text-brand-200" />
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 shadow-sm dark:bg-amber-900/20 dark:text-amber-300 sm:text-sm">
            <Star size={14} fill="currentColor" /> {Number(product.ratingAverage || 0).toFixed(1)}
          </span>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={handleAddToCart} className="premium-button-primary flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white">
            <ShoppingBag size={16} /> {hasOptions(product) ? 'اختر الخيارات' : 'أضف إلى السلة'}
          </button>
          <button type="button" onClick={openWhatsApp} className="whatsapp-button flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium">
            <MessageCircle size={16} /> واتساب
          </button>
        </div>
      </div>
    </article>
  );
}
