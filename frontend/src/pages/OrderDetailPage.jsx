// Order detail — full breakdown of a single order.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Phone, CreditCard, Truck, Gift, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { taka, formatDate } from '../lib/format';
import Spinner from '../components/Spinner';
import SafeImage from '../components/SafeImage';

const STATUS_CHIP = {
  PENDING: 'chip chip-orange',
  PLACED: 'chip chip-orange',
  PROCESSING: 'chip chip-blue',
  SHIPPED: 'chip chip-blue',
  DELIVERED: 'chip chip-green',
  CANCELLED: 'chip chip-red',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get(`/orders/${id}`)
      .then((r) => alive && setOrder(r.data.order || r.data))
      .catch((err) => alive && toast.error(err.message || 'Could not load order'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading order…" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-[600px] mx-auto px-5 py-10 text-center">
        <p className="text-[14px] text-bazaar-ink2 mb-4">Order not found.</p>
        <Link to="/orders" className="btn btn-secondary btn-sm">
          Back to orders
        </Link>
      </div>
    );
  }

  const items = order.items || [];
  const pricing = order.pricing || order;

  return (
    <div className="max-w-[960px] mx-auto px-5 py-6 space-y-5">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1 text-[12px] text-bazaar-ink3 hover:text-bazaar-gold"
      >
        <ArrowLeft size={12} /> All orders
      </Link>

      <header className="card p-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-[22px] font-bold text-bazaar-ink">
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <span className={STATUS_CHIP[order.status] || 'chip chip-gray'}>
              {order.status}
            </span>
          </div>
          <p className="text-[12px] text-bazaar-ink3">
            Placed on {formatDate(order.createdAt || order.placedAt)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-bazaar-ink3 uppercase tracking-wide">Total</div>
          <div className="font-serif text-[28px] font-bold text-bazaar-gold leading-none">
            {taka(pricing.total || 0)}
          </div>
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-serif text-[15px] font-bold mb-2 flex items-center gap-1.5">
            <MapPin size={13} /> Delivery address
          </h3>
          <p className="text-[12.5px] text-bazaar-ink2 whitespace-pre-line">
            {order.address}
          </p>
        </div>
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2 text-[12.5px]">
            <Phone size={13} className="text-bazaar-gold" />
            <span className="text-bazaar-ink2">{order.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-[12.5px]">
            <CreditCard size={13} className="text-bazaar-gold" />
            <span className="text-bazaar-ink2">{order.paymentMethod}</span>
          </div>
          {order.notes && (
            <div className="text-[11.5px] text-bazaar-ink3 italic border-t border-bazaar-border pt-2 mt-2">
              Note: {order.notes}
            </div>
          )}
        </div>
      </section>

      <section className="card p-4">
        <h3 className="font-serif text-[15px] font-bold mb-3">Items</h3>
        <ul className="divide-y divide-bazaar-border">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-2.5">
              <SafeImage
                src={it.product?.imageUrl || it.imageUrl}
                alt=""
                fallback="🛍️"
                className="w-12 h-12 rounded border border-bazaar-border"
              />
              <div className="flex-1 min-w-0">
                <Link
                  to={it.product ? `/products/${it.product.id}` : '/browse'}
                  className="text-[13px] font-semibold text-bazaar-ink hover:text-bazaar-gold truncate block"
                >
                  {it.product?.name || it.name}
                </Link>
                <div className="text-[11.5px] text-bazaar-ink3">
                  {taka(it.price || it.product?.price || 99)} × {it.quantity}
                </div>
              </div>
              <div className="text-[13px] font-semibold">
                {taka((it.price || it.product?.price || 99) * it.quantity)}
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-bazaar-border mt-3 pt-3 space-y-1.5 text-[12.5px]">
          <Row label="Subtotal" value={taka(pricing.subtotal)} />
          {pricing.discount > 0 && (
            <Row
              label={
                <span className="flex items-center gap-1 text-bazaar-green">
                  <Gift size={11} /> Free item
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
          <div className="flex items-center justify-between pt-2 border-t border-bazaar-border">
            <span className="font-semibold">Total</span>
            <span className="font-serif text-[20px] font-bold text-bazaar-gold">
              {taka(pricing.total)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-bazaar-ink2">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}