import ProductCard from '../components/ui/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import LoginPrompt from '../components/ui/LoginPrompt';
import SectionHeading from '../components/ui/SectionHeading';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { favorites } = useFavorites();

  if (!user) return <LoginPrompt text="سجّل الدخول لعرض المفضلة." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading title="المفضلة" subtitle="المنتجات المحفوظة" />
      {favorites.length === 0 ? (
        <EmptyState text="لا توجد عناصر في المفضلة حاليًا." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      )}
    </div>
  );
}
