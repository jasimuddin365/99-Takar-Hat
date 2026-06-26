// Vendor — orders inbox with status filter, expand row, and inline
// status update (PATCH /api/orders/:id/status).
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  Truck,
  PackageCheck,
  XCircle,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { taka, formatDate } from '../lib/format';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import SafeImage from '../components/SafeImage';

const STATUS_CHIP = {
  PROCESSING: 'chip chip-blue',
  SHIPPED: 'chip chip-blue',
  DELIVERED: 'chip chip-green',
  CANCELLED: 'chip chip-red',
};

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const NEXT_STATUS = {
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

export default function VendorOrdersPage() {
  const [stall, setStall] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get('/orders/vendor/inbox')
      .then((r) => {
        if (!alive) return;
        setStall(r.data.stall || null);
        setOrders(r.data.orders || []);
      })
      .catch((err) => alive && toast.error(err.message || 'Could not load orders'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(() => {
    const out = { all: orders.length };
    for (const o of orders) out[o.status] = (out[o.status] || 0) + 1;
    return out;
  }, [orders]);

  const visible = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  async function updateStatus(order, status) {
    setBusyId(order.id);
    try {
      const { data } = await api.patch(`/orders/${order.id}/status`, { status });
      const updated = data.order;
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      toast.success(`Marked ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err.message || 'Could not update status');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading orders…" />
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-6">
      <header className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">
            Orders inbox
          </h1>
          <p className="text-[12.5px] text-bazaar-ink3">
            {stall
              ? `Orders containing products from ${stall.name}`
              : 'No stall yet — add a product to start receiving orders.'}
          </p>
        </div>
        <Link to="/vendor" className="btn btn-secondary btn-sm">
          ← Dashboard
        </Link>
      </header>

      <div className="card p-2 mb-4 flex items-center gap-1 overflow-x-auto">
        <Filter size={13} className="text-bazaar-ink3 ml-2 mr-1 shrink-0" />
        {FILTERS.map((f) => {
          const count = counts[f.value] || 0;
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-[11.5px] font-semibold whitespace-nowrap transition ${
                active
                  ? 'bg-bazaar-gold text-white'
                  : 'text-bazaar-ink2 hover:bg-bazaar-bg2'
              }`}
            >
              {f.label}{' '}
              <span className={`ml-1 ${active ? 'opacity-90' : 'text-bazaar-ink3'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No orders"
          hint={
            filter === 'all'
              ? 'No customer has ordered from your stall yet.'
              : `No ${filter.toLowerCase()} orders.`
          }
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              expanded={expanded === o.id}
              busy={busyId === o.id}
              onToggle={() =>
                setExpanded((cur) => (cur === o.id ? null : o.id))
              }
              onUpdate={(status) => updateStatus(o, status)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderRow({ order, expanded, busy, onToggle, onUpdate }) {
  const next = NEXT_STATUS[order.status];
  return (
    <li className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-bazaar-bg2/60 transition"
      >
        <div className="w-10 h-10 rounded-full bg-bazaar-bg2 flex items-center justify-center text-bazaar-gold shrink-0">
          <ShoppingBag size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-[10.5px] text-bazaar-ink3">
              #{order.id.slice(-8).toUpperCase()}
            </span>
            <span className={STATUS_CHIP[order.status] || 'chip chip-gray'}>
              {order.status}
            </span>
          </div>
          <div className="text-[12px] text-bazaar-ink2 truncate">
            {order.customer?.name || 'Customer'} · {order.items?.length || 0} item(s) · {order.paymentMethod}
          </div>
        </div>
        <div className="text-right mr-2">
          <div className="font-semibold text-[13.5px]">
            ৳{(order.total || 0).toLocaleString()}
          </div>
          <div className="text-[10.5px] text-bazaar-ink3">
            {formatDate(order.placedAt)}
          </div>
        </div>
        {expanded ? (
          <ChevronDown size={15} className="text-bazaar-ink3" />
        ) : (
          <ChevronRight size={15} className="text-bazaar-ink3" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-bazaar-border p-4 bg-bazaar-bg/40 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="card p-3">
              <div className="text-[10.5px] uppercase tracking-wide text-bazaar-ink3 mb-1">
                Customer
              </div>
              <div className="text-[13px] font-semibold">{order.customer?.name}</div>
              <div className="text-[11.5px] text-bazaar-ink3">{order.phone}</div>
            </div>
            <div className="card p-3">
              <div className="text-[10.5px] uppercase tracking-wide text-bazaar-ink3 mb-1">
                Delivery address
              </div>
              <div className="text-[12px] text-bazaar-ink2 whitespace-pre-line">
                {order.address}
              </div>
            </div>
          </div>

          <ul className="divide-y divide-bazaar-border border-y border-bazaar-border">
            {order.items?.map((it) => (
              <li key={it.id} className="flex items-center gap-2.5 py-2">
                <SafeImage
                  src={it.imageUrl}
                  alt=""
                  fallback="🛍️"
                  className="w-9 h-9 rounded border border-bazaar-border"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold truncate">
                    {it.name}
                  </div>
                  <div className="text-[10.5px] text-bazaar-ink3">
                    {taka(it.unitPrice)} × {it.quantity}
                  </div>
                </div>
                <div className="text-[12.5px] font-semibold">
                  {taka(it.lineTotal)}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-[11.5px] text-bazaar-ink3">
              Payment: <span className="font-semibold text-bazaar-ink2">{order.paymentMethod}</span>
              {order.notes && (
                <span className="ml-3 italic">"{order.notes}"</span>
              )}
            </div>
            <div className="flex gap-1.5">
              {next && (
                <button
                  onClick={() => onUpdate(next)}
                  disabled={busy}
                  className="btn btn-primary btn-sm disabled:opacity-50"
                >
                  <Truck size={11} /> Mark {next.toLowerCase()}
                </button>
              )}
              {order.status === 'PROCESSING' && (
                <button
                  onClick={() => onUpdate('CANCELLED')}
                  disabled={busy}
                  className="btn btn-sm text-bazaar-red hover:bg-bazaar-red hover:text-white disabled:opacity-50"
                >
                  <XCircle size={11} /> Cancel
                </button>
              )}
              {order.status === 'SHIPPED' && (
                <button
                  onClick={() => onUpdate('DELIVERED')}
                  disabled={busy}
                  className="btn btn-sm text-bazaar-green hover:bg-bazaar-green hover:text-white disabled:opacity-50"
                >
                  <PackageCheck size={11} /> Mark delivered
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}