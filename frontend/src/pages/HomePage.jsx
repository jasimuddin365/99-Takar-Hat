// Home — hero, 15-category grid, top selling strip, fresh arrivals.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Gift, Sparkles, ArrowRight, ShoppingBag, Flame } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ApiError from '../components/ApiError';
import useApi from '../hooks/useApi';

export default function HomePage() {
  const fetcher = useMemo(
    () => async () => {
      const [cats, top, all] = await Promise.all([
        api.get('/categories'),
        api.get('/products?top=true'),
        api.get('/products'),
      ]);
      return {
        categories: cats.data.categories || [],
        topProducts: (top.data.products || []).slice(0, 8),
        recent: (all.data.products || []).slice(0, 8),
      };
    },
    []
  );
  const { data, loading, error, refetch } = useApi(fetcher, []);

  const categories = data?.categories ?? [];
  const topProducts = data?.topProducts ?? [];
  const recent = data?.recent ?? [];

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6 space-y-8">
      {/* Hero */}
      <section className="card overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <span className="chip chip-gold self-start mb-3">
              <Sparkles size={11} /> Every item, every stall
            </span>
            <h1 className="font-serif text-[34px] md:text-[42px] font-bold text-bazaar-ink leading-[1.1] mb-3">
              The bazaar where <br />
              <span className="text-bazaar-gold">everything is ৳99</span>
            </h1>
            <p className="text-[14px] text-bazaar-ink2 leading-relaxed mb-5 max-w-md">
              Browse 15 categories from 5 trusted vendors. Free delivery on 3+
              items, and order 6+ to get one item on the house.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/browse" className="btn btn-primary">
                <ShoppingBag size={15} /> Start shopping
              </Link>
              <Link to="/stalls" className="btn btn-secondary">
                Visit stalls <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center bg-bazaar-bg2 p-8">
            <div className="grid grid-cols-3 gap-3 max-w-[360px]">
              {['🥭', '🧴', '📱', '🕯️', '🧃', '🪴', '🧸', '🪑', '🖼️'].map((e, i) => (
                <div
                  key={i}
                  className="aspect-square bg-white rounded-lg border border-bazaar-border flex items-center justify-center text-3xl shadow-soft"
                >
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing rules strip */}
      <section className="grid sm:grid-cols-3 gap-3">
        <RuleCard
          icon={<Truck size={16} className="text-bazaar-green" />}
          title="৳20 delivery"
          text="On 1–2 items, anywhere in Bangladesh."
        />
        <RuleCard
          icon={<Truck size={16} className="text-bazaar-green" />}
          title="Free delivery"
          text="On 3+ items. No coupon needed."
        />
        <RuleCard
          icon={<Gift size={16} className="text-bazaar-gold" />}
          title="1 item free"
          text="On 6+ items — cheapest one is on us."
        />
      </section>

      {error && (
        <ApiError
          error={error}
          onRetry={refetch}
          hint="Start the backend with `cd backend && node src/server.js` if it isn't running."
        />
      )}

      {/* Categories */}
      <section>
        <SectionHeader title="Browse by category" subtitle="15 ways to find your ৳99 gem" />
        {loading && categories.length === 0 ? (
          <div className="py-6">
            <Spinner label="Loading categories…" />
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/browse?cat=${c.slug}`}
                className="card p-3 text-center hover:border-bazaar-gold hover:shadow-card transition-all"
              >
                <div className="text-3xl mb-1">{c.icon}</div>
                <div className="text-[12px] font-semibold text-bazaar-ink leading-tight line-clamp-2 min-h-[32px]">
                  {c.name}
                </div>
                <div className="text-[10.5px] text-bazaar-ink3 mt-0.5">
                  {c.productCount ?? 0} items
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Top selling */}
      <section>
        <SectionHeader
          title="Top selling this week"
          subtitle="What everyone is grabbing at ৳99"
          icon={<Flame size={15} className="text-bazaar-red" />}
          action={
            <Link to="/browse" className="text-[12px] text-bazaar-gold hover:underline">
              See all →
            </Link>
          }
        />
        {loading && topProducts.length === 0 ? (
          <div className="py-6">
            <Spinner label="Loading…" />
          </div>
        ) : topProducts.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="No sales yet"
            hint="Place a few orders to see the leaderboard."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {topProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Fresh arrivals */}
      {recent.length > 0 && (
        <section>
          <SectionHeader
            title="Fresh arrivals"
            subtitle="Newest additions to the bazaar"
            action={
              <Link to="/browse" className="text-[12px] text-bazaar-gold hover:underline">
                See all →
              </Link>
            }
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {recent.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle, icon, action }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="font-serif text-[20px] font-bold text-bazaar-ink flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="text-[12.5px] text-bazaar-ink3 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function RuleCard({ icon, title, text }) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-bazaar-bg2 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[13.5px] font-semibold text-bazaar-ink">{title}</div>
        <div className="text-[12px] text-bazaar-ink3 leading-snug">{text}</div>
      </div>
    </div>
  );
}
