// Stall detail — vendor header + their top products + a browse filter.
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, ShoppingBag } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ApiError from '../components/ApiError';
import useApi from '../hooks/useApi';

export default function StallDetailPage() {
  const { slug } = useParams();
  const fetcher = useMemo(
    () => async () => {
      const res = await api.get(`/vendors/${slug}`);
      return res.data || null;
    },
    [slug]
  );
  const { data, loading, error, refetch } = useApi(fetcher, [slug]);

  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto px-5 py-10 flex justify-center">
        <Spinner label="Loading stall…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1240px] mx-auto px-5 py-10">
        <ApiError error={error} onRetry={refetch} hint="This stall may be inactive or the slug is wrong." />
        <Link to="/stalls" className="btn btn-secondary btn-sm mt-4 inline-flex">
          Back to stalls
        </Link>
      </div>
    );
  }

  if (!data?.vendor) {
    return (
      <div className="max-w-[1240px] mx-auto px-5 py-10">
        <EmptyState
          icon="🏪"
          title="Stall not found"
          hint="The stall may have been deactivated."
          action={
            <Link to="/stalls" className="btn btn-primary btn-sm">
              Back to stalls
            </Link>
          }
        />
      </div>
    );
  }

  const { vendor, topProducts } = data;

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6">
      <Link to="/stalls" className="text-[12.5px] text-bazaar-ink3 hover:text-bazaar-ink inline-flex items-center gap-1 mb-4">
        <ArrowLeft size={12} /> All stalls
      </Link>

      <section className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-bazaar-bg2 flex items-center justify-center text-5xl shrink-0">
            {vendor.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">
              {vendor.name}
            </h1>
            <p className="text-[12.5px] text-bazaar-ink3 flex items-center gap-1 mt-1">
              <MapPin size={12} /> {vendor.location} · Since {vendor.since || '—'}
            </p>
            {vendor.description && (
              <p className="text-[13.5px] text-bazaar-ink2 leading-relaxed mt-3">
                {vendor.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="chip chip-gold flex items-center gap-1">
                <Star size={11} className="fill-bazaar-gold" />
                {vendor.rating?.toFixed?.(1) || '—'} rating
              </span>
              <span className="chip chip-blue flex items-center gap-1">
                <ShoppingBag size={11} />
                {vendor.productCount ?? 0} products
              </span>
              <span className="chip chip-gray">{vendor.totalSales || 0} total sales</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="font-serif text-[20px] font-bold text-bazaar-ink">
              Top selling from {vendor.name}
            </h2>
            <p className="text-[12.5px] text-bazaar-ink3">A taste of what's hot at this stall.</p>
          </div>
          <Link
            to={`/browse?vendor=${vendor.slug}`}
            className="btn btn-secondary btn-sm"
          >
            View all
          </Link>
        </div>

        {topProducts?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {topProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🛒"
            title="No products yet"
            hint="This stall hasn't listed anything — check back soon."
          />
        )}
      </section>
    </div>
  );
}