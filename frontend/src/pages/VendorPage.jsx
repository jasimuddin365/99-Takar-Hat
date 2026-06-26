// Vendor dashboard — KPI tiles, stall identity card, and a peek at the
// most recent orders. All numbers come from GET /api/orders/vendor/inbox.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Star,
  CalendarDays,
  Plus,
  ListChecks,
  Edit3,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/format';
import Spinner from '../components/Spinner';
import RoleChip from '../components/RoleChip';

const STATUS_CHIP = {
  PROCESSING: 'chip chip-blue',
  SHIPPED: 'chip chip-blue',
  DELIVERED: 'chip chip-green',
  CANCELLED: 'chip chip-red',
};

export default function VendorPage() {
  const { user } = useAuth();
  const [stall, setStall] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
      .catch((err) => alive && toast.error(err.message || 'Could not load vendor data'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading your stall…" />
      </div>
    );
  }

  // If user has never created a product, no stall exists yet.
  const totalSales = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
  const revenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">
              {stall ? stall.name : 'Welcome, vendor!'}
            </h1>
            <RoleChip role={user?.role} />
          </div>
          <p className="text-[12.5px] text-bazaar-ink3">
            {stall
              ? `Selling since ${formatDate(stall.since) || '—'} · ${stall.location || 'Bangladesh'}`
              : 'Add your first product to spin up your stall.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/vendor/stall" className="btn btn-secondary btn-sm">
            <Edit3 size={13} /> Edit stall
          </Link>
          <Link to="/vendor/products/new" className="btn btn-primary btn-sm">
            <Plus size={13} /> Add product
          </Link>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          icon={<Package size={16} />}
          label="Total orders"
          value={orders.length}
          tone="gold"
        />
        <Kpi
          icon={<ShoppingBag size={16} />}
          label="Items sold"
          value={totalSales}
          tone="green"
        />
        <Kpi
          icon={<TrendingUp size={16} />}
          label="Revenue"
          value={`৳${revenue.toLocaleString()}`}
          tone="blue"
        />
        <Kpi
          icon={<Star size={16} />}
          label="Stall rating"
          value={stall?.rating?.toFixed?.(1) || '—'}
          tone="orange"
        />
      </section>

      <div className="grid lg:grid-cols-[1fr,320px] gap-5">
        {/* Recent orders */}
        <section className="card p-4">
          <header className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-[17px] font-bold flex items-center gap-2">
              <ListChecks size={15} /> Recent orders
            </h2>
            <Link to="/vendor/orders" className="text-[11.5px] text-bazaar-gold hover:underline">
              View all →
            </Link>
          </header>
          {orders.length === 0 ? (
            <p className="text-[12.5px] text-bazaar-ink3 py-6 text-center">
              No orders yet. They'll appear here as customers buy from your stall.
            </p>
          ) : (
            <ul className="divide-y divide-bazaar-border">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10.5px] text-bazaar-ink3">
                        #{o.id.slice(-8).toUpperCase()}
                      </span>
                      <span className={STATUS_CHIP[o.status] || 'chip chip-gray'}>
                        {o.status}
                      </span>
                    </div>
                    <div className="text-[12px] text-bazaar-ink2">
                      {o.customer?.name || 'Customer'} · {o.items?.length || 0} item(s)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[13px]">
                      ৳{(o.total || 0).toLocaleString()}
                    </div>
                    <div className="text-[10.5px] text-bazaar-ink3">
                      {formatDate(o.placedAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Stall identity / quick links */}
        <aside className="space-y-3">
          <div className="card p-4">
            <h3 className="font-serif text-[15px] font-bold mb-2 flex items-center gap-2">
              <CalendarDays size={13} /> Your stall
            </h3>
            {stall ? (
              <div className="space-y-1 text-[12.5px]">
                <Row label="Slug" value={`/${stall.slug}`} mono />
                <Row label="Location" value={stall.location || '—'} />
                <Row label="Total sales" value={stall.totalSales ?? 0} />
                <Row label="Rating" value={stall.rating?.toFixed?.(1) || '—'} />
              </div>
            ) : (
              <p className="text-[12px] text-bazaar-ink3">
                Once you add a product, your stall will be auto-created.
              </p>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-serif text-[15px] font-bold mb-2">Quick links</h3>
            <ul className="space-y-1.5 text-[12.5px]">
              <li>
                <Link
                  to="/vendor/products"
                  className="flex items-center justify-between p-2 rounded hover:bg-bazaar-bg2"
                >
                  <span className="flex items-center gap-1.5">
                    <Package size={12} /> My products
                  </span>
                  <ArrowRight size={12} />
                </Link>
              </li>
              <li>
                <Link
                  to="/vendor/orders"
                  className="flex items-center justify-between p-2 rounded hover:bg-bazaar-bg2"
                >
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag size={12} /> Orders inbox
                  </span>
                  <ArrowRight size={12} />
                </Link>
              </li>
              <li>
                <Link
                  to="/vendor/stall"
                  className="flex items-center justify-between p-2 rounded hover:bg-bazaar-bg2"
                >
                  <span className="flex items-center gap-1.5">
                    <Edit3 size={12} /> Stall settings
                  </span>
                  <ArrowRight size={12} />
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, tone = 'gold' }) {
  const toneMap = {
    gold: 'text-bazaar-gold bg-bazaar-gold-l/40',
    green: 'text-bazaar-green bg-bazaar-green/10',
    blue: 'text-bazaar-blue bg-bazaar-blue/10',
    orange: 'text-bazaar-orange bg-bazaar-orange/10',
  };
  return (
    <div className="card p-4">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${toneMap[tone]}`}>
        {icon}
      </div>
      <div className="font-serif text-[22px] font-bold text-bazaar-ink leading-none">
        {value}
      </div>
      <div className="text-[11px] text-bazaar-ink3 mt-1 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-bazaar-ink3">{label}</span>
      <span className={`font-semibold ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </span>
    </div>
  );
}