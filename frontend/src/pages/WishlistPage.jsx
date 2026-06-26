// Wishlist — saved products grid with quick-add to cart.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { add } = useCart();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get('/wishlist')
      .then((r) => alive && setItems(r.data.items || []))
      .catch((err) => alive && toast.error(err.message || 'Could not load wishlist'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function remove(productId) {
    try {
      await api.post(`/wishlist/${productId}`);
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error(err.message || 'Could not remove');
    }
  }

  async function addToCart(product) {
    try {
      await add(product.id, 1);
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(err.message || 'Could not add to cart');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading wishlist…" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto px-5 py-10">
        <EmptyState
          icon="💝"
          title="No favorites yet"
          hint="Tap the heart on any product to save it for later."
          action={
            <Link to="/browse" className="btn btn-primary btn-sm">
              Start browsing
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6">
      <header className="flex items-end justify-between mb-5">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">My wishlist</h1>
          <p className="text-[12.5px] text-bazaar-ink3">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>
        <Link to="/browse" className="btn btn-secondary btn-sm">
          Browse more
        </Link>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((i) => (
          <div key={i.id} className="relative">
            <ProductCard product={i.product} />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                onClick={() => addToCart(i.product)}
                title="Move to cart"
                className="w-7 h-7 rounded-full bg-white border border-bazaar-border shadow-sm flex items-center justify-center text-bazaar-ink2 hover:bg-bazaar-gold hover:text-white hover:border-bazaar-gold transition"
              >
                <ShoppingCart size={13} />
              </button>
              <button
                onClick={() => remove(i.product.id)}
                title="Remove from wishlist"
                className="w-7 h-7 rounded-full bg-white border border-bazaar-border shadow-sm flex items-center justify-center text-bazaar-ink2 hover:bg-bazaar-red hover:text-white hover:border-bazaar-red transition"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}