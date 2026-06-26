// Cart — full-page version of the cart drawer with a pricing summary panel.
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, Truck, Gift, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { taka, pluralize } from '../lib/format';
import EmptyState from '../components/EmptyState';
import SafeImage from '../components/SafeImage';

export default function CartPage() {
  const { items, pricing, loading, setQty, remove, clear } = useCart();
  const navigate = useNavigate();

  if (!loading && items.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto px-5 py-10">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          hint="Pick a few ৳99 goodies to get started."
          action={
            <Link to="/browse" className="btn btn-primary btn-sm">
              <ShoppingBag size={13} /> Browse products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6">
      <header className="mb-5">
        <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">Your cart</h1>
        <p className="text-[12.5px] text-bazaar-ink3">
          {pluralize(pricing.itemCount, 'item')} — review quantities, then head to checkout.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr,340px] gap-5">
        <section className="space-y-3">
          {items.map((ci) => (
            <div
              key={ci.id}
              className="card p-3 flex gap-3 items-center"
            >
              <Link
                to={`/product/${ci.product.id}`}
                className="w-[88px] h-[88px] rounded-lg overflow-hidden border border-bazaar-border bg-bazaar-bg shrink-0 block"
              >
                <SafeImage
                  src={ci.product.imageUrl}
                  alt={ci.product.name}
                  fallback="🛍️"
                  className="w-full h-full"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${ci.product.id}`}
                  className="font-semibold text-[14px] text-bazaar-ink hover:text-bazaar-gold line-clamp-2"
                >
                  {ci.product.name}
                </Link>
                <div className="text-[11.5px] text-bazaar-ink3 mt-0.5">
                  {ci.product.stall?.emoji} {ci.product.stall?.name}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="w-7 h-7 rounded border border-bazaar-border flex items-center justify-center hover:border-bazaar-gold"
                      onClick={() =>
                        setQty(ci.productId, Math.max(0, ci.quantity - 1))
                      }
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-[13px] font-semibold">
                      {ci.quantity}
                    </span>
                    <button
                      type="button"
                      className="w-7 h-7 rounded border border-bazaar-border flex items-center justify-center hover:border-bazaar-gold"
                      onClick={() =>
                        setQty(ci.productId, Math.min(99, ci.quantity + 1))
                      }
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(ci.productId)}
                    className="text-bazaar-red hover:underline text-[11.5px] flex items-center gap-1"
                  >
                    <Trash2 size={11} /> remove
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div className="font-serif text-[18px] font-bold text-bazaar-gold leading-none">
                  {taka((ci.product.price || 99) * ci.quantity)}
                </div>
                {ci.quantity > 1 && (
                  <div className="text-[11px] text-bazaar-ink3 mt-0.5">
                    {taka(ci.product.price || 99)} each
                  </div>
                )}
              </div>
            </div>
          ))}

          <button onClick={clear} className="btn btn-secondary btn-sm mt-2">
            <Trash2 size={12} /> Clear cart
          </button>
        </section>

        <aside className="card p-4 h-fit sticky top-[80px] space-y-3">
          <h3 className="font-serif text-[17px] font-bold text-bazaar-ink">Order summary</h3>

          <SummaryRow label="Subtotal" value={taka(pricing.subtotal)} />

          {pricing.discount > 0 && (
            <SummaryRow
              label={
                <span className="flex items-center gap-1 text-bazaar-green">
                  <Gift size={12} /> Free item ({pricing.freeItemName})
                </span>
              }
              value={<span className="text-bazaar-green">−{taka(pricing.discount)}</span>}
            />
          )}

          <SummaryRow
            label={
              <span className="flex items-center gap-1">
                <Truck size={12} /> Delivery
              </span>
            }
            value={
              pricing.delivery === 0 ? (
                <span className="chip chip-green">FREE</span>
              ) : (
                taka(pricing.delivery)
              )
            }
          />

          <div className="border-t border-bazaar-border pt-3 flex items-end justify-between">
            <span className="text-[12.5px] font-semibold text-bazaar-ink2">Total</span>
            <span className="font-serif text-[24px] font-bold text-bazaar-gold leading-none">
              {taka(pricing.total)}
            </span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            disabled={pricing.itemCount === 0}
            className="btn btn-primary w-full justify-center mt-2 disabled:opacity-50"
          >
            Checkout <ArrowRight size={14} />
          </button>

          <PricingHint count={pricing.itemCount} />
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-bazaar-ink2">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function PricingHint({ count }) {
  if (count >= 6) {
    return (
      <p className="text-[11px] text-bazaar-green text-center mt-1">
        🎉 You've unlocked the free-item perk!
      </p>
    );
  }
  if (count >= 3) {
    return (
      <p className="text-[11px] text-bazaar-green text-center mt-1">
        🚚 Free delivery unlocked. Add {6 - count} more for a free item.
      </p>
    );
  }
  if (count > 0) {
    return (
      <p className="text-[11px] text-bazaar-ink3 text-center mt-1">
        Add {3 - count} more item{3 - count === 1 ? '' : 's'} for free delivery.
      </p>
    );
  }
  return null;
}