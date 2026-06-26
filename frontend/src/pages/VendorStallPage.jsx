// Vendor stall — read-only identity card. The backend auto-creates the
// stall on first product POST, and exposes no PATCH for stall fields,
// so this page is a "what your stall looks like to customers" preview.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Store, ExternalLink, MapPin, Star, CalendarDays, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { formatDate } from '../lib/format';
import Spinner from '../components/Spinner';
import ApiError from '../components/ApiError';
import useApi from '../hooks/useApi';

export default function VendorStallPage() {
  const fetcher = useMemo(
    () => async () => {
      const r = await api.get('/orders/vendor/inbox');
      return r.data.stall || null;
    },
    []
  );
  const { data: stall = null, loading, error, refetch } = useApi(fetcher, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading stall…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[820px] mx-auto px-5 py-10">
        <ApiError error={error} onRetry={refetch} hint="Could not load your stall." />
      </div>
    );
  }

  if (!stall) {
    return (
      <div className="max-w-[640px] mx-auto px-5 py-10 text-center">
        <Store size={32} className="mx-auto text-bazaar-gold mb-3" />
        <h1 className="font-serif text-[22px] font-bold mb-2">No stall yet</h1>
        <p className="text-[13px] text-bazaar-ink3 mb-4">
          Your stall is created automatically the moment you add your first product.
        </p>
        <Link to="/vendor/products/new" className="btn btn-primary btn-sm">
          Add your first product
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[820px] mx-auto px-5 py-6 space-y-5">
      <header>
        <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">My stall</h1>
        <p className="text-[12.5px] text-bazaar-ink3">
          This is what shoppers see when they visit your storefront.
        </p>
      </header>

      <section className="card p-6 text-center bg-gradient-to-br from-bazaar-gold-l/30 to-white">
        <div className="text-[64px] leading-none mb-2">{stall.emoji || '🪧'}</div>
        <h2 className="font-serif text-[24px] font-bold text-bazaar-ink">{stall.name}</h2>
        <p className="text-[12.5px] text-bazaar-ink3 mt-1">
          <MapPin size={11} className="inline -mt-0.5" /> {stall.location || 'Bangladesh'}
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="chip chip-gold">
            <Star size={10} /> {stall.rating?.toFixed?.(1) || '—'}
          </span>
          <span className="chip chip-green">
            <ShoppingBag size={10} /> {stall.totalSales ?? 0} sales
          </span>
          <span className="chip">
            <CalendarDays size={10} /> since {formatDate(stall.since) || '—'}
          </span>
        </div>
        <Link
          to={`/stall/${stall.slug}`}
          className="btn btn-secondary btn-sm mt-4 inline-flex"
        >
          <ExternalLink size={12} /> View public page
        </Link>
      </section>

      <section className="card p-4">
        <h3 className="font-serif text-[15px] font-bold mb-3">Stall details</h3>
        <dl className="grid sm:grid-cols-2 gap-3 text-[12.5px]">
          <Detail label="Name" value={stall.name} />
          <Detail label="Slug" value={stall.slug} mono />
          <Detail label="Location" value={stall.location || '—'} />
          <Detail label="Owner" value={stall.ownerName || '—'} />
        </dl>
        <p className="mt-4 text-[11.5px] text-bazaar-ink3 italic">
          Stall fields are managed in the database for now. To change them, ask
          an admin or update the seed data and re-run the seeder.
        </p>
      </section>

      <div className="flex gap-2">
        <Link to="/vendor/products" className="btn btn-primary btn-sm">
          Manage products
        </Link>
        <Link to="/vendor/orders" className="btn btn-secondary btn-sm">
          Orders inbox
        </Link>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }) {
  return (
    <div>
      <dt className="text-[10.5px] uppercase tracking-wide text-bazaar-ink3">
        {label}
      </dt>
      <dd
        className={`mt-0.5 font-semibold text-bazaar-ink ${mono ? 'font-mono text-[11px]' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}