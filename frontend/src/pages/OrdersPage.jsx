// Orders list — customer's order history with status chips.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { taka, formatDate } from '../lib/format';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const STATUS_CHIP = {
  PENDING: 'chip chip-orange',
  PLACED: 'chip chip-orange',
  PROCESSING: 'chip chip-blue',
  SHIPPED: 'chip chip-blue',
  DELIVERED: 'chip chip-green',
  CANCELLED: 'chip chip-red',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get('/orders')
      .then((r) => alive && setOrders(r.data.orders || []))
      .catch((err) => alive && toast.error(err.message || 'Could not load orders'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading orders…" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto px-5 py-10">
        <EmptyState
          icon="📦"
          title="No orders yet"
          hint="Your future orders will show up here."
          action={
            <Link to="/browse" className="btn btn-primary btn-sm">
              Find something nice
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-5 py-6">
      <header className="mb-5">
        <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">My orders</h1>
        <p className="text-[12.5px] text-bazaar-ink3">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} so far
        </p>
      </header>

      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="card p-4">
            <Link
              to={`/orders/${o.id}`}
              className="flex items-center gap-4 group"
            >
              <div className="w-11 h-11 rounded-full bg-bazaar-bg2 flex items-center justify-center text-bazaar-gold">
                <Package size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] text-bazaar-ink3">
                    #{o.id.slice(-8).toUpperCase()}
                  </span>
                  <span className={STATUS_CHIP[o.status] || 'chip chip-gray'}>
                    {o.status}
                  </span>
                </div>
                <div className="text-[12.5px] text-bazaar-ink2">
                  {o.itemCount || (o.items?.length || 0)} items · {formatDate(o.createdAt || o.placedAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-serif text-[18px] font-bold text-bazaar-ink">
                  {taka(o.total || o.pricing?.total || 0)}
                </div>
                <div className="text-[11px] text-bazaar-ink3">{o.paymentMethod}</div>
              </div>
              <ChevronRight size={16} className="text-bazaar-ink3 group-hover:text-bazaar-gold transition" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}