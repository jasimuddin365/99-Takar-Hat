// Product detail — image, price, add-to-cart, wishlist, vendor card, reviews.
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Star,
  Plus,
  Minus,
  Heart,
  Truck,
  Gift,
  ShoppingBag,
  Store,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAuthModal } from '../context/AuthModalContext';
import { taka, formatDate, pluralize } from '../lib/format';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ApiError from '../components/ApiError';
import SafeImage from '../components/SafeImage';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user, isAuthed } = useAuth();
  const { add, refresh: refreshCart } = useCart();
  const { show } = useAuthModal();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [reviewDraft, setReviewDraft] = useState({ stars: 5, text: '' });
  const [reviewBusy, setReviewBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    api
      .get(`/products/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => {
        setLoadError({
          message: err.response?.data?.message || err.message || 'Product not found',
          status: err.response?.status || 0,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addToCart() {
    if (!isAuthed) {
      show({
        from: `/product/${id}`,
        title: 'Sign in to add to your cart',
        runAfter: addToCart,
      });
      return;
    }
    setBusy(true);
    try {
      await add(id, qty);
      toast.success(`Added ${qty} to cart`);
    } catch (err) {
      toast.error(err.message || 'Could not add to cart');
    } finally {
      setBusy(false);
    }
  }

  async function toggleWishlist() {
    if (!isAuthed) {
      show({
        from: `/product/${id}`,
        title: 'Save items to your wishlist',
        runAfter: toggleWishlist,
      });
      return;
    }
    setWishBusy(true);
    try {
      const { data: res } = await api.post(`/wishlist/${id}`);
      toast.success(res.added ? 'Added to wishlist' : 'Removed from wishlist');
      refreshCart();
    } catch (err) {
      toast.error(err.message || 'Wishlist update failed');
    } finally {
      setWishBusy(false);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!reviewDraft.text.trim()) return;
    setReviewBusy(true);
    try {
      await api.post(`/products/${id}/reviews`, {
        stars: Number(reviewDraft.stars),
        text: reviewDraft.text.trim(),
      });
      toast.success('Review submitted');
      setReviewDraft({ stars: 5, text: '' });
      load();
    } catch (err) {
      toast.error(err.message || 'Could not submit review');
    } finally {
      setReviewBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto px-5 py-10 flex justify-center">
        <Spinner label="Loading product…" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-[1100px] mx-auto px-5 py-10">
        <ApiError error={loadError} onRetry={load} hint="The product may be inactive or the link is wrong." />
        <Link to="/browse" className="btn btn-secondary btn-sm mt-4 inline-flex">
          Back to browse
        </Link>
      </div>
    );
  }

  if (!data?.product) {
    return (
      <div className="max-w-[1100px] mx-auto px-5 py-10">
        <EmptyState
          icon="🔎"
          title="Product not found"
          hint="It may have been removed or the link is wrong."
          action={
            <Link to="/browse" className="btn btn-primary btn-sm">
              Back to browse
            </Link>
          }
        />
      </div>
    );
  }

  const { product, vendor, reviews } = data;
  const unit = Math.round((product.price || 99) * (1 - (product.discount || 0) / 100));
  const stock = product.stock ?? 0;
  const lowStock = stock > 0 && stock <= 5;
  const outOfStock = stock <= 0;

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6">
      <Link to="/browse" className="text-[12.5px] text-bazaar-ink3 hover:text-bazaar-ink inline-flex items-center gap-1 mb-4">
        <ArrowLeft size={12} /> Back to browse
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image */}
        <div className="card overflow-hidden">
          <div className="aspect-square bg-bazaar-bg relative">
            <SafeImage
              src={product.imageUrl}
              alt={product.name}
              fallback={product.category?.icon || product.name?.[0]?.toUpperCase() || '🛍️'}
              className="w-full h-full"
            />
            {product.badge && (
              <span className="absolute top-3 left-3 chip chip-gold">{product.badge}</span>
            )}
            {product.discount > 0 && (
              <span className="absolute top-3 right-3 chip chip-red">−{product.discount}%</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <div className="text-[11.5px] uppercase tracking-[0.5px] text-bazaar-ink3 mb-1">
              {product.category?.icon} {product.category?.name}
            </div>
            <h1 className="font-serif text-[26px] md:text-[30px] font-bold text-bazaar-ink leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-[12.5px] text-bazaar-ink3">
              <span className="flex items-center gap-1 text-bazaar-gold">
                <Star size={13} className="fill-bazaar-gold" />
                <strong className="text-bazaar-ink">
                  {product.rating?.toFixed?.(1) || '—'}
                </strong>
                <span className="text-bazaar-ink3">
                  ({pluralize(reviews?.length || 0, 'review')})
                </span>
              </span>
              <span>·</span>
              <span>{pluralize(product.sales || 0, 'sale')}</span>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div className="font-serif text-[36px] font-bold text-bazaar-gold leading-none">
              {taka(unit)}
            </div>
            {product.discount > 0 && (
              <div className="text-[14px] text-bazaar-ink3 line-through mb-1">
                {taka(product.price)}
              </div>
            )}
            <span className="chip chip-gold mb-1">flat ৳99 line</span>
          </div>

          <p className="text-[13.5px] text-bazaar-ink2 leading-relaxed">
            {product.description}
          </p>

          <div className="card p-3 flex items-center gap-4 text-[12px] text-bazaar-ink2">
            <span className="flex items-center gap-1">
              <Truck size={13} className="text-bazaar-green" /> ৳20 on 1–2 items
            </span>
            <span className="flex items-center gap-1">
              <Truck size={13} className="text-bazaar-green" /> Free on 3+
            </span>
            <span className="flex items-center gap-1">
              <Gift size={13} className="text-bazaar-gold" /> 1 free on 6+
            </span>
          </div>

          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-bazaar-ink2">Quantity</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 rounded border border-bazaar-border flex items-center justify-center hover:border-bazaar-gold"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label="Decrease"
                >
                  <Minus size={13} />
                </button>
                <span className="w-10 text-center text-[14px] font-semibold">{qty}</span>
                <button
                  type="button"
                  className="w-8 h-8 rounded border border-bazaar-border flex items-center justify-center hover:border-bazaar-gold"
                  onClick={() => setQty(Math.min(99, qty + 1))}
                  aria-label="Increase"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {outOfStock ? (
              <div className="chip chip-red">Out of stock</div>
            ) : lowStock ? (
              <div className="chip chip-orange">Only {stock} left</div>
            ) : (
              <div className="text-[11.5px] text-bazaar-ink3">{stock} in stock</div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={addToCart}
                disabled={busy || outOfStock}
                className="btn btn-primary flex-1 min-w-[180px] justify-center disabled:opacity-50"
              >
                <ShoppingBag size={14} /> {busy ? 'Adding…' : 'Add to cart'}
              </button>
              <button
                onClick={toggleWishlist}
                disabled={wishBusy}
                className="btn btn-secondary justify-center"
                aria-label="Toggle wishlist"
              >
                <Heart size={14} /> {wishBusy ? '…' : 'Wishlist'}
              </button>
            </div>
          </div>

          {/* Vendor card */}
          {vendor && (
            <Link
              to={`/stall/${vendor.slug}`}
              className="card p-4 flex items-center gap-3 hover:border-bazaar-gold"
            >
              <div className="w-12 h-12 rounded-full bg-bazaar-bg2 flex items-center justify-center text-2xl">
                {vendor.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-bazaar-ink truncate">
                  {vendor.name}
                </div>
                <div className="text-[11.5px] text-bazaar-ink3 truncate flex items-center gap-1">
                  <Store size={11} /> {vendor.location} · ★ {vendor.rating?.toFixed?.(1) || '—'}
                </div>
              </div>
              <span className="text-[11.5px] text-bazaar-gold">Visit stall →</span>
            </Link>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-10">
        <h2 className="font-serif text-[20px] font-bold text-bazaar-ink mb-3">
          Reviews
          <span className="text-bazaar-ink3 text-[14px] font-sans font-normal ml-2">
            ({reviews?.length || 0})
          </span>
        </h2>

        {user && (
          <form onSubmit={submitReview} className="card p-4 mb-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-semibold text-bazaar-ink2">Your rating:</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewDraft((d) => ({ ...d, stars: n }))}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={18}
                      className={
                        n <= reviewDraft.stars
                          ? 'fill-bazaar-gold text-bazaar-gold'
                          : 'text-bazaar-border2'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              className="form-textarea"
              placeholder="Share what you liked (or didn't)…"
              value={reviewDraft.text}
              onChange={(e) =>
                setReviewDraft((d) => ({ ...d, text: e.target.value }))
              }
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={reviewBusy || !reviewDraft.text.trim()}
                className="btn btn-primary btn-sm disabled:opacity-50"
              >
                {reviewBusy ? 'Posting…' : 'Post review'}
              </button>
            </div>
          </form>
        )}

        {!reviews || reviews.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No reviews yet"
            hint={
              user
                ? 'Be the first to share your experience.'
                : 'Sign in to leave a review once you have ordered.'
            }
          />
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-bazaar-gold text-bazaar-ink flex items-center justify-center text-[12px] font-bold">
                    {r.user?.avatar || r.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-bazaar-ink">
                      {r.user?.name || 'Customer'}
                    </div>
                    <div className="text-[11px] text-bazaar-ink3">{formatDate(r.createdAt)}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < r.stars ? 'fill-bazaar-gold text-bazaar-gold' : 'text-bazaar-border2'
                        }
                      />
                    ))}
                  </div>
                </div>
                {r.text && (
                  <p className="text-[13px] text-bazaar-ink2 leading-relaxed">{r.text}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}