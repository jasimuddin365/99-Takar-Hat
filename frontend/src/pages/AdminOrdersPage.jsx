// Admin orders. Filter by status, search by customer. Status changes via
// PATCH /api/admin/orders/:id which returns {id, status, updatedAt} only —
// so we merge into existing order objects to preserve UI data.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Truck,
  Phone,
  MapPin,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { taka } from '../lib/format';
import Spinner from '../components/Spinner';

const STATUSES = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/admin/orders', { params: { status, q } })
      .then((r) => setOrders(r.data.orders || []))
      .catch((err) => toast.error(err.message || 'Could not load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  const counts = useMemo(() => {
    const c = { all: orders.length };
    for (const s of STATUSES) c[s] = 0;
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const setStatusOn = async (o, newStatus) => {
    if (newStatus === o.status) return;
    setBusy(o.id);
    try {
      await api.patch(`/admin/orders/${o.id}`, { status: newStatus });
      // Merge — PATCH returns {id, status, updatedAt} only, so don't replace
      setOrders((prev) =>
        prev.map((x) => (x.id === o.id ? { ...x, status: newStatus } : x))
      );
      toast.success(`Order marked ${newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Status update failed');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6 space-y-5">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-[12px] text-bazaar-ink3 hover:text-bazaar-gold"
      >
        <ArrowLeft size={12} /> Dashboard
      </Link>

      <header>
        <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">Orders</h1>
        <p className="text-[12.5px] text-bazaar-ink3">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} match.
        </p>
      </header>

      <div className="card p-3 space-y-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bazaar-ink3"
          />
          <input
            className="form-input pl-8 py-1.5 text-[12.5px]"
            placeholder="Search by customer name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setStatus('')}
            className={`chip ${status === '' ? 'chip-gold' : 'chip-gray'} cursor-pointer`}
          >
            All · {counts.all}
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`chip ${status === s ? 'chip-gold' : 'chip-gray'} cursor-pointer`}
            >
              {s} · {counts[s] || 0}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading orders…" />
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center text-[12.5px] text-bazaar-ink3">
          No orders match.
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const isOpen = expanded === o.id;
            return (
              <div key={o.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="w-full grid grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-bazaar-bg2/50 transition-colors text-left"
                >
                  <div className="col-span-3">
                    <div className="font-semibold text-[13px]">{o.customer?.name || '—'}</div>
                    <div className="text-[10.5px] text-bazaar-ink3 truncate">
                      {o.customer?.email || ''}
                    </div>
                  </div>
                  <div className="col-span-2 text-[12px] text-bazaar-ink3">
                    {o.placedAt ? new Date(o.placedAt).toLocaleString() : '—'}
                  </div>
                  <div className="col-span-3">
                    <div className="text-[12px] truncate">
                      {o.itemPreview?.length
                        ? o.itemPreview
                            .map((it) => `${it.qty}× ${it.name}`)
                            .join(', ')
                        : 'No items'}
                    </div>
                    <div className="text-[10.5px] text-bazaar-ink3">
                      {o.itemCount || o.itemTotal || 0} item
                      {(o.itemCount || o.itemTotal || 0) === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-mono font-semibold text-[13px]">
                    {taka(o.total)}
                  </div>
                  <div className="col-span-1 text-right">
                    <StatusChip status={o.status} />
                  </div>
                  <div className="col-span-1 text-right text-bazaar-ink3">
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-bazaar-border bg-bazaar-bg2/30 p-4 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Detail icon={<MapPin size={12} />} label="Address">
                        {o.address || '—'}
                      </Detail>
                      <Detail icon={<Phone size={12} />} label="Phone">
                        {o.customer?.phone || o.phone || '—'}
                      </Detail>
                      <Detail icon={<CreditCard size={12} />} label="Payment">
                        {o.paymentMethod || '—'}
                      </Detail>
                      <Detail icon={<Truck size={12} />} label="Vendor count">
                        {o.vendorCount || (o.itemPreview?.length ?? '—')}
                      </Detail>
                    </div>

                    {o.itemPreview?.length > 0 && (
                      <div className="card p-3">
                        <div className="text-[10.5px] uppercase tracking-wide text-bazaar-ink3 mb-1.5">
                          Items
                        </div>
                        <ul className="space-y-1">
                          {o.itemPreview.map((it, i) => (
                            <li
                              key={i}
                              className="flex items-center justify-between text-[12px]"
                            >
                              <span>
                                <span className="font-semibold">{it.qty}×</span> {it.name}
                              </span>
                              {it.price != null && (
                                <span className="font-mono text-bazaar-ink3">
                                  ৳{it.price}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-bazaar-ink3">Set status:</span>
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatusOn(o, s)}
                          disabled={busy === o.id || o.status === s}
                          className={`chip cursor-pointer ${
                            o.status === s ? 'chip-gold' : 'chip-gray'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }) {
  const cls =
    status === 'DELIVERED'
      ? 'chip-green'
      : status === 'CANCELLED'
      ? 'chip-red'
      : status === 'SHIPPED'
      ? 'chip-blue'
      : 'chip-blue';
  return <span className={`chip ${cls}`}>{status}</span>;
}

function Detail({ icon, label, children }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-bazaar-ink3 mt-0.5">{icon}</span>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-bazaar-ink3">
          {label}
        </div>
        <div className="text-[12px] text-bazaar-ink">{children}</div>
      </div>
    </div>
  );
}