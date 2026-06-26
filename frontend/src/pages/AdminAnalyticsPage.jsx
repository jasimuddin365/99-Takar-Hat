// Admin analytics — full breakdown: revenue/cost splits, delivery stats,
// category performance table, top vendors leaderboard, low stock list.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Truck,
  Gift,
  Banknote,
  Store,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { taka } from '../lib/format';
import Spinner from '../components/Spinner';

export default function AdminAnalyticsPage() {
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

  const totals = useMemo(() => {
    if (!data) return null;
    return {
      cats: data.categoryPerformance || [],
      vendors: data.topVendors || [],
      low: data.lowStock || [],
    };
  }, [data]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading analytics…" />
      </div>
    );
  }

  const k = data.kpis || {};
  const ds = data.deliveryStats || {};
  const obs = data.ordersByStatus || {};
  const maxUnits = Math.max(...totals.cats.map((c) => c.unitsSold), 1);

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6 space-y-6">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-[12px] text-bazaar-ink3 hover:text-bazaar-gold"
      >
        <ArrowLeft size={12} /> Dashboard
      </Link>
      <header>
        <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">Analytics</h1>
        <p className="text-[12.5px] text-bazaar-ink3">
          Snapshot across {k.orders || 0} orders and {k.users || 0} users.
        </p>
      </header>

      {/* Revenue breakdown */}
      <section className="grid lg:grid-cols-4 gap-3">
        <RevenueTile
          icon={<Banknote size={16} />}
          label="Gross subtotal"
          value={k.grossSubtotal || 0}
          tone="ink"
        />
        <RevenueTile
          icon={<Gift size={16} />}
          label="Discounts given"
          value={k.discountsGiven || 0}
          tone="green"
        />
        <RevenueTile
          icon={<Truck size={16} />}
          label="Delivery collected"
          value={k.deliveryCollected || 0}
          tone="blue"
        />
        <RevenueTile
          icon={<TrendingUp size={16} />}
          label="Net revenue"
          value={k.revenue || 0}
          tone="gold"
          highlight
        />
      </section>

      {/* Order status + delivery */}
      <section className="grid lg:grid-cols-2 gap-5">
        <div className="card p-4">
          <h3 className="font-serif text-[15px] font-bold mb-3">Orders by status</h3>
          <div className="space-y-2">
            {['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => {
              const n = obs[s] || 0;
              const total = (k.orders || 0) || 1;
              const pct = (n / total) * 100;
              const tone =
                s === 'PROCESSING'
                  ? 'bg-bazaar-blue'
                  : s === 'SHIPPED'
                  ? 'bg-bazaar-blue'
                  : s === 'DELIVERED'
                  ? 'bg-bazaar-green'
                  : 'bg-bazaar-red';
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="font-semibold">{s}</span>
                    <span className="text-bazaar-ink3">{n} orders · {pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-bazaar-bg2 overflow-hidden">
                    <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-serif text-[15px] font-bold mb-3 flex items-center gap-1.5">
            <Truck size={14} /> Delivery performance
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Small label="Free deliveries" value={ds.freeOrders || 0} />
            <Small label="Paid (৳20)" value={ds.paidDelivery || 0} />
            <Small label="Delivery revenue" value={`৳${(ds.totalDeliveryCollected || 0).toLocaleString()}`} />
            <Small label="Total discount" value={`৳${(ds.totalDiscountGiven || 0).toLocaleString()}`} />
          </div>
          <p className="text-[10.5px] text-bazaar-ink3 mt-3 italic">
            Free delivery kicks in for 3+ items; 6+ items unlocks one freebie.
          </p>
        </div>
      </section>

      {/* Category performance */}
      <section className="card p-4">
        <h3 className="font-serif text-[15px] font-bold mb-3">Category performance</h3>
        {totals.cats.length === 0 ? (
          <p className="text-[12px] text-bazaar-ink3 py-6 text-center">
            No category data yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="text-[10.5px] uppercase tracking-wide text-bazaar-ink3 border-b border-bazaar-border">
                <tr>
                  <th className="text-left py-2 pr-3">Category</th>
                  <th className="text-right py-2 px-3">Products</th>
                  <th className="text-right py-2 px-3">Units sold</th>
                  <th className="text-right py-2 px-3">Revenue</th>
                  <th className="text-left py-2 pl-3 w-[30%]">Share</th>
                </tr>
              </thead>
              <tbody>
                {totals.cats.map((c) => (
                  <tr key={c.id} className="border-b border-bazaar-border last:border-0">
                    <td className="py-2 pr-3 font-semibold">
                      <span className="mr-1">{c.icon}</span>
                      {c.name}
                    </td>
                    <td className="py-2 px-3 text-right">{c.productCount}</td>
                    <td className="py-2 px-3 text-right">{c.unitsSold}</td>
                    <td className="py-2 px-3 text-right font-semibold">
                      ৳{(c.revenue || 0).toLocaleString()}
                    </td>
                    <td className="py-2 pl-3">
                      <div className="h-1.5 rounded-full bg-bazaar-bg2 overflow-hidden">
                        <div
                          className="h-full bg-bazaar-gold"
                          style={{ width: `${(c.unitsSold / maxUnits) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top vendors */}
        <section className="card p-4">
          <header className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-[15px] font-bold flex items-center gap-1.5">
              <Store size={14} /> Top vendors
            </h3>
            <Link to="/admin/vendors" className="text-[11.5px] text-bazaar-gold hover:underline">
              Manage →
            </Link>
          </header>
          {totals.vendors.length === 0 ? (
            <p className="text-[12px] text-bazaar-ink3 py-6 text-center">No vendors yet.</p>
          ) : (
            <ol className="space-y-2">
              {totals.vendors.map((v, i) => (
                <li key={v.id} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-bazaar-gold-l/40 text-bazaar-gold flex items-center justify-center font-mono text-[12px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-[18px]">{v.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{v.name}</div>
                    <div className="text-[10.5px] text-bazaar-ink3">
                      {v.location || '—'} · ★ {v.rating?.toFixed?.(1) || '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[13px]">{v.totalSales}</div>
                    <div className="text-[10.5px] text-bazaar-ink3">sales</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Low stock */}
        <section className="card p-4">
          <header className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-[15px] font-bold flex items-center gap-1.5 text-bazaar-orange">
              <AlertTriangle size={14} /> Low stock
            </h3>
            <Link to="/admin/products" className="text-[11.5px] text-bazaar-gold hover:underline">
              Manage →
            </Link>
          </header>
          {totals.low.length === 0 ? (
            <p className="text-[12px] text-bazaar-ink3 py-6 text-center">
              All products have 10+ in stock.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {totals.low.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded border border-bazaar-border"
                >
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold truncate">{p.name}</div>
                    <div className="text-[10.5px] text-bazaar-ink3">
                      {p.stallName} · {p.sales || 0} sold
                    </div>
                  </div>
                  <span className="chip chip-orange">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function RevenueTile({ icon, label, value, tone, highlight }) {
  const toneMap = {
    ink: 'text-bazaar-ink bg-bazaar-bg2',
    gold: 'text-bazaar-gold bg-bazaar-gold-l/40',
    green: 'text-bazaar-green bg-bazaar-green/10',
    blue: 'text-bazaar-blue bg-bazaar-blue/10',
  };
  return (
    <div className={`card p-4 ${highlight ? 'ring-2 ring-bazaar-gold' : ''}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${toneMap[tone]}`}>
        {icon}
      </div>
      <div className="font-serif text-[22px] font-bold text-bazaar-ink leading-none">
        ৳{(value || 0).toLocaleString()}
      </div>
      <div className="text-[10.5px] uppercase tracking-wide text-bazaar-ink3 mt-1">
        {label}
      </div>
    </div>
  );
}

function Small({ label, value }) {
  return (
    <div className="p-2 rounded bg-bazaar-bg2">
      <div className="text-[10.5px] uppercase tracking-wide text-bazaar-ink3">
        {label}
      </div>
      <div className="font-semibold text-[15px] text-bazaar-ink mt-0.5">{value}</div>
    </div>
  );
}