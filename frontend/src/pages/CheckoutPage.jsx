// Checkout — single-screen place-order form. Posts to /api/orders and
// redirects to the new order detail page on success.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Truck, Gift, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { taka } from '../lib/format';
import SafeImage from '../components/SafeImage';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Cash on Delivery', hint: 'Pay when it arrives' },
  { value: 'BKASH', label: 'bKash', hint: 'Mobile wallet' },
  { value: 'NAGAD', label: 'Nagad', hint: 'Mobile wallet' },
];

export default function CheckoutPage() {
  const { items, pricing, loading, refresh } = useCart();
  const { user, refresh: refreshUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const {
    register: rf,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      address: user?.address || '',
      phone: user?.phone || '',
      paymentMethod: 'COD',
      notes: '',
    },
  });

  useEffect(() => {
    refresh();
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loading && items.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto px-5 py-10">
        <EmptyState
          icon="🛒"
          title="Nothing to check out"
          hint="Add some items to your cart first."
          action={
            <Link to="/browse" className="btn btn-primary btn-sm">
              Browse products
            </Link>
          }
        />
      </div>
    );
  }

  async function onSubmit(values) {
    setBusy(true);
    try {
      const { data } = await api.post('/orders', {
        address: values.address.trim(),
        phone: values.phone.trim(),
        notes: values.notes?.trim() || undefined,
        paymentMethod: values.paymentMethod,
      });
      toast.success('Order placed!');
      await refresh();
      navigate(`/orders/${data.order.id}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not place order');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6">
      <header className="mb-5">
        <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">Checkout</h1>
        <p className="text-[12.5px] text-bazaar-ink3">
          One last step before we box up your ৳99 goodies.
        </p>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid lg:grid-cols-[1fr,340px] gap-5"
      >
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="font-serif text-[17px] font-bold mb-3 flex items-center gap-2">
              <MapPin size={15} /> Delivery details
            </h2>
            <div className="space-y-3">
              <div>
                <label className="form-label">Delivery address</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="House, road, area, city"
                  {...rf('address', {
                    required: 'Address is required',
                    minLength: { value: 5, message: 'Please give a bit more detail' },
                  })}
                />
                {errors.address && (
                  <p className="text-[11.5px] text-bazaar-red mt-1">{errors.address.message}</p>
                )}
              </div>
              <div>
                <label className="form-label">Phone number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="01XXXXXXXXX"
                  {...rf('phone', {
                    required: 'Phone is required',
                    minLength: { value: 6, message: 'Enter a valid phone number' },
                  })}
                />
                {errors.phone && (
                  <p className="text-[11.5px] text-bazaar-red mt-1">{errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="form-label">Notes (optional)</label>
                <input
                  className="form-input"
                  placeholder="e.g. please call before delivery"
                  {...rf('notes')}
                />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-serif text-[17px] font-bold mb-3">Payment method</h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className="flex items-center gap-3 p-3 border border-bazaar-border rounded-lg cursor-pointer hover:border-bazaar-gold has-[:checked]:border-bazaar-gold has-[:checked]:bg-bazaar-gold-l/40"
                >
                  <input
                    type="radio"
                    value={m.value}
                    defaultChecked={m.value === 'COD'}
                    {...rf('paymentMethod', { required: true })}
                    className="accent-bazaar-gold"
                  />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-bazaar-ink">{m.label}</div>
                    <div className="text-[11.5px] text-bazaar-ink3">{m.hint}</div>
                  </div>
                  <CheckCircle2 size={16} className="text-bazaar-gold opacity-0 has-[:checked]:opacity-100" />
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="card p-4 h-fit sticky top-[80px] space-y-3">
          <h3 className="font-serif text-[17px] font-bold">Order summary</h3>

          <ul className="space-y-1.5 max-h-[200px] overflow-auto pr-1">
            {items.map((ci) => (
              <li
                key={ci.id}
                className="flex items-center gap-2 text-[12px]"
              >
                <SafeImage
                  src={ci.product.imageUrl}
                  alt=""
                  fallback="🛍️"
                  className="w-8 h-8 rounded border border-bazaar-border"
                />
                <div className="flex-1 min-w-0 truncate">
                  {ci.product.name}
                </div>
                <span className="text-bazaar-ink3">×{ci.quantity}</span>
                <span className="font-semibold">{taka((ci.product.price || 99) * ci.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-bazaar-border pt-3 space-y-1.5">
            <Row label="Subtotal" value={taka(pricing.subtotal)} />
            {pricing.discount > 0 && (
              <Row
                label={
                  <span className="flex items-center gap-1 text-bazaar-green">
                    <Gift size={11} /> Free ({pricing.freeItemName})
                  </span>
                }
                value={<span className="text-bazaar-green">−{taka(pricing.discount)}</span>}
              />
            )}
            <Row
              label={
                <span className="flex items-center gap-1">
                  <Truck size={11} /> Delivery
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
          </div>

          <div className="border-t border-bazaar-border pt-3 flex items-end justify-between">
            <span className="text-[12.5px] font-semibold">Total</span>
            <span className="font-serif text-[24px] font-bold text-bazaar-gold leading-none">
              {taka(pricing.total)}
            </span>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary w-full justify-center disabled:opacity-50"
          >
            {busy ? <Spinner size={14} /> : <>Place order <ArrowRight size={14} /></>}
          </button>
          <p className="text-[10.5px] text-bazaar-ink3 text-center">
            By placing the order you accept the marketplace terms.
          </p>
        </aside>
      </form>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-bazaar-ink2">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}