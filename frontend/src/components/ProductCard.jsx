// ProductCard — single product tile for browse/home/stall/wishlist grids.
// Uses <SafeImage> for photo resilience and a category emoji as the fallback.
import { Link, useLocation } from 'react-router-dom';
import { Star, ShoppingBag, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import SafeImage from './SafeImage';
import { taka as formatTaka } from '../lib/format';

export default function ProductCard({ product }) {
  const { isAuthed } = useAuth();
  const { show } = useAuthModal();
  const location = useLocation();
  const from = location.pathname + location.search;

  const finalPrice =
    product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;

  // Pick a fallback emoji: prefer the category's icon, then product name's
  // first character, then a generic shopping bag.
  const fallback =
    product.category?.icon ||
    (product.name ? product.name.charAt(0).toUpperCase() : '🛍️');

  // Toggle wishlist. Self-referential so we can replay it after sign-in.
  async function toggleWishlist() {
    if (!isAuthed) {
      show({
        from,
        title: 'Save items to your wishlist',
        runAfter: toggleWishlist,
      });
      return;
    }
    try {
      const { data } = await api.post(`/wishlist/${product.id}`);
      toast.success(data.added ? 'Saved to wishlist' : 'Removed from wishlist');
    } catch (err) {
      toast.error(err.message || 'Could not update wishlist');
    }
  }

  return (
    <Link
      to={`/product/${product.id}`}
      className="card group overflow-hidden hover:border-bazaar-gold hover:shadow-card transition-all"
    >
      <div className="relative aspect-square bg-bazaar-bg2">
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          fallback={fallback}
          className="w-full h-full"
          imgClassName="group-hover:scale-[1.03] transition-transform duration-300"
        />
        {product.badge && (
          <span
            className={`absolute top-2 left-2 chip text-[10px] ${
              product.badge === 'hot'
                ? 'chip-red'
                : product.badge === 'sale'
                ? 'chip-blue'
                : 'chip-gold'
            }`}
          >
            {product.badge}
          </span>
        )}
        {product.discount > 0 && (
          <span className="absolute top-2 right-2 chip chip-red text-[10px]">
            -{product.discount}%
          </span>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center gap-1 text-[10.5px] text-bazaar-ink3 mb-1">
          <Star size={10} className="fill-bazaar-gold text-bazaar-gold" />
          <span className="font-semibold text-bazaar-ink">
            {product.rating?.toFixed?.(1) || '—'}
          </span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <ShoppingBag size={10} /> {product.sales ?? 0}
          </span>
          {product.stall?.name && (
            <>
              <span>·</span>
              <span className="truncate max-w-[80px]">{product.stall.name}</span>
            </>
          )}
        </div>
        <h3 className="text-[12.5px] font-semibold text-bazaar-ink line-clamp-2 leading-snug min-h-[34px]">
          {product.name}
        </h3>
        <div className="flex items-end justify-between mt-2">
          <div>
            <span className="font-serif text-[16px] font-bold text-bazaar-gold">
              ৳{formatTaka(finalPrice)}
            </span>
            {product.discount > 0 && (
              <span className="ml-1.5 text-[11px] text-bazaar-ink3 line-through">
                ৳{formatTaka(product.price)}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label={isAuthed ? 'Save to wishlist' : 'Sign in to save'}
            title={isAuthed ? 'Save to wishlist' : 'Sign in to save'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist();
            }}
            className="text-bazaar-ink3 hover:text-bazaar-red transition-colors"
          >
            <Heart size={14} />
          </button>
        </div>
      </div>
    </Link>
  );
}