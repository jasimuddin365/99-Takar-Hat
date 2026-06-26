// Slide-in cart drawer — uses CartContext for state and pricing.
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, Truck, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useCart } from '../context/CartContext';
import { taka } from '../lib/format';
import SafeImage from './SafeImage';

export default function CartDrawer() {
  const { items, pricing, drawerOpen, closeDrawer, setQty, remove, clear } = useCart();
  const { isAuthed } = useAuth();
  const { show } = useAuthModal();
  const navigate = useNavigate();

  function goCheckout() {
    if (!isAuthed) {
      closeDrawer();
      show({
        from: '/checkout',
        title: 'Sign in to checkout',
        runAfter: () => navigate('/checkout'),
      });
      return;
    }
    closeDrawer();
    navigate('/checkout');
  }

  if (!drawerOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      <button
        className="flex-1 bg-black/40"
        onClick={closeDrawer}
        aria-label="Close cart"
      />
      <aside className="w-full max-w-[420px] bg-white h-full flex flex-col shadow-card animate-[slideIn_.18s_ease-out]">
        <header className="px-4 py-3 border-b border-bazaar-border flex items-center justify-between">
          <h3 className="font-serif text-[17px] font-bold">Your Cart</h3>
          <button
            onClick={closeDrawer}
            className="p-1.5 rounded hover:bg-bazaar-bg"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="text-center text-bazaar-ink3 py-10">
              <p className="text-[14px] mb-3">Your cart is empty.</p>
              <Link to="/browse" onClick={closeDrawer} className="btn btn-primary btn-sm">
                Browse products
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((ci) => (
                <li key={ci.id} className="flex gap-3 border border-bazaar-border rounded-lg p-2.5">
                  <SafeImage
                    src={ci.product.imageUrl}
                    alt={ci.product.name}
                    fallback="🛍️"
                    className="w-[58px] h-[58px] rounded border border-bazaar-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px] truncate">{ci.product.name}</div>
                    <div className="text-[11px] text-bazaar-ink3">
                      {ci.product.stall?.name || ''}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="w-6 h-6 rounded border border-bazaar-border flex items-center justify-center hover:border-bazaar-gold"
                          onClick={() =>
                            setQty(ci.productId, Math.max(0, ci.quantity - 1))
                          }
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-7 text-center text-[12.5px] font-semibold">
                          {ci.quantity}
                        </span>
                        <button
                          className="w-6 h-6 rounded border border-bazaar-border flex items-center justify-center hover:border-bazaar-gold"
                          onClick={() =>
                            setQty(ci.productId, Math.min(99, ci.quantity + 1))
                          }
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      <button
                        className="text-bazaar-red hover:underline text-[11px] flex items-center gap-1"
                        onClick={() => remove(ci.productId)}
                      >
                        <Trash2 size={11} /> remove
                      </button>
                    </div>
                  </div>
                  <div className="font-serif font-bold text-bazaar-gold text-[14px] whitespace-nowrap">
                    {taka((ci.product.price || 99) * ci.quantity)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-bazaar-border px-4 py-3 space-y-2">
            <div className="flex justify-between text-[12.5px]">
              <span className="text-bazaar-ink2">Subtotal</span>
              <span>{taka(pricing.subtotal)}</span>
            </div>
            {pricing.discount > 0 && (
              <div className="flex justify-between text-[12.5px] text-bazaar-green">
                <span className="flex items-center gap-1">
                  <Gift size={12} /> Free item ({pricing.freeItemName})
                </span>
                <span>−{taka(pricing.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[12.5px]">
              <span className="text-bazaar-ink2 flex items-center gap-1">
                <Truck size={12} /> Delivery
              </span>
              <span>
                {pricing.delivery === 0 ? (
                  <span className="chip chip-green">FREE</span>
                ) : (
                  taka(pricing.delivery)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-bazaar-border">
              <span className="font-semibold text-[13px]">Total</span>
              <span className="font-serif text-[18px] font-bold text-bazaar-gold">
                {taka(pricing.total)}
              </span>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={clear} className="btn btn-secondary btn-sm flex-1">
                Clear
              </button>
              <button onClick={goCheckout} className="btn btn-primary btn-sm flex-[2]">
                Checkout
              </button>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}