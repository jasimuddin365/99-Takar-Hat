// Admin dashboard — KPI tiles + recent orders + top categories + low stock
// alerts. All data from a single GET /api/admin/analytics call.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Banknote,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { taka, formatDate } from '../lib/format';
import Spinner from '../components/Spinner';
import RoleChip from '../components/RoleChip';

const STATUS_CHIP = {
  PROCESSING: 'chip chip-blue',
  SHIPPED: 'chip chip-blue',
  DELIVERED: 'chip chip-green',
  CANCELLED: 'chip chip-red',
};

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get('/admin/analytics')
      .then((r) => alive && setData(r.data))
      .catch((err) => alive && toast.error(err.message || 'Could not load analytics'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading dashboard…" />
      </div>
    );
  }

  const k = data.kpis || {};
  const cats = (data.categoryPerformance || [])
    .slice()
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);
  const lowStock = data.lowStock || [];

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6 space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">
              Admin dashboard
            </h1>
            <RoleChip role="ADMIN" />
          </div>
          <p className="text-[12.5px] text-bazaar-ink3">
            Platform-wide pulse — last refreshed just now.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/analytics" className="btn btn-secondary btn-sm">
            Full analytics →
          </Link>
          <Link to="/admin/categories" className="btn btn-primary btn-sm">
            Manage categories
          </Link>
        </div>
      </header>

      {/* KPI grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Banknote size={16} />} label="Revenue" value={`৳${(k.revenue || 0).toLocaleString()}`} tone="gold" />
        <Kpi icon={<ShoppingBag size={16} />} label="Orders" value={k.orders || 0} tone="blue" />
        <Kpi icon={<Users size={16} />} label="Users" value={k.users || 0} sub={`${k.activeUsers || 0} active`} tone="green" />
        <Kpi icon={<Store size={16} />} label="Stalls" value={k.activeStalls || 0} sub={`${k.stalls || 0} total`} tone="orange" />
        <Kpi icon={<Package size={16} />} label="Products" value={k.activeProducts || 0} sub={`${k.products || 0} total`} tone="blue" />
        <Kpi icon={<Layers size={16} />} label="Categories" value={k.categories || 0} tone="gold" />
        <Kpi icon={<TrendingUp size={16} />} label="Customers" value={k.customers || 0} tone="green" />
        <Kpi icon={<Users size={16} />} label="Vendors / Admins" value={`${k.vendors || 0} / ${k.admins || 0}`} tone="orange" />
      </section>

      <div className="grid lg:grid-cols-[1.4fr,1fr] gap-5">
        {/* Recent orders */}
        <section className="card p-4">
          <header className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-[17px] font-bold flex items-center gap-2">
              <ShoppingBag size={15} /> Recent orders
            </h2>
            <Link to="/admin/orders" className="text-[11.5px] text-bazaar-gold hover:underline">
              View all →
            </Link>
          </header>
          {data.recentOrders?.length ? (
            <ul className="divide-y divide-bazaar-border">
              {data.recentOrders.map((o) => (
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
                    <div className="text-[12px] text-bazaar-ink2 truncate">
                      {o.customer || 'Customer'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[13px]">{taka(o.total)}</div>
                    <div className="text-[10.5px] text-bazaar-ink3">{formatDate(o.placedAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-bazaar-ink3 py-6 text-center">
              No orders placed yet.
            </p>
          )}
        </section>

        {/* Top categories */}
        <section className="card p-4">
          <h2 className="font-serif text-[17px] font-bold mb-3 flex items-center gap-2">
            <Layers size={15} /> Top categories
          </h2>
          {cats.length ? (
            <ul className="space-y-2">
              {cats.map((c) => {
                const maxUnits = Math.max(...cats.map((x) => x.unitsSold), 1);
                const pct = (c.unitsSold / maxUnits) * 100;
                return (
                  <li key={c.id}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span>{c.icon}</span>
                        {c.name}
                      </span>
                      <span className="text-bazaar-ink3">
                        {c.unitsSold} units · {taka(c.revenue)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bazaar-bg2 overflow-hidden">
                      <div
                        className="h-full bg-bazaar-gold"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[12px] text-bazaar-ink3 py-6 text-center">
              No category sales yet.
            </p>
          )}
        </section>
      </div>

      {/* Low stock */}
      {lowStock.length > 0 && (
        <section className="card p-4 border-l-4 border-bazaar-orange">
          <header className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-[17px] font-bold flex items-center gap-2 text-bazaar-orange">
              <AlertTriangle size={15} /> Low stock alerts
            </h2>
            <Link to="/admin/products" className="text-[11.5px] text-bazaar-gold hover:underline">
              Manage products →
            </Link>
          </header>
          <ul className="grid sm:grid-cols-2 gap-2">
            {lowStock.slice(0, 8).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 p-2 rounded border border-bazaar-border"
              >
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold truncate">{p.name}</div>
                  <div className="text-[10.5px] text-bazaar-ink3">
                    {p.stallName}
                  </div>
                </div>
                <span className="chip chip-orange whitespace-nowrap">
                  {p.stock} left
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quick links */}
      <section className="grid sm:grid-cols-3 gap-3">
        <QuickLink to="/admin/users" title="Users" desc={`${k.users || 0} total · ${k.activeUsers || 0} active`} icon={<Users size={16} />} />
        <QuickLink to="/admin/vendors" title="Vendors" desc={`${k.stalls || 0} stalls`} icon={<Store size={16} />} />
        <QuickLink to="/admin/products" title="Products" desc={`${k.products || 0} products`} icon={<Package size={16} />} />
      </section>
    </div>
  );
}

function Kpi({ icon, label, value, sub, tone = 'gold' }) {
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
      <div className="text-[10.5px] uppercase tracking-wide text-bazaar-ink3 mt-1">
        {label}
      </div>
      {sub && <div className="text-[10.5px] text-bazaar-ink3 mt-0.5">{sub}</div>}
    </div>
  );
}

function QuickLink({ to, title, desc, icon }) {
  return (
    <Link
      to={to}
      className="card p-3 hover:border-bazaar-gold transition flex items-center gap-3"
    >
      <div className="w-9 h-9 rounded-full bg-bazaar-gold-l/40 text-bazaar-gold flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{title}</div>
        <div className="text-[10.5px] text-bazaar-ink3">{desc}</div>
      </div>
      <ChevronRight size={14} className="text-bazaar-ink3" />
    </Link>
  );
}