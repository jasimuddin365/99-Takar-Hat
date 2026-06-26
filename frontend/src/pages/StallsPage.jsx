// Stalls — public directory of vendor stalls with product counts.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, Star, ShoppingBag, ArrowRight, Search } from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ApiError from '../components/ApiError';
import useApi from '../hooks/useApi';

export default function StallsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const fetcher = useMemo(
    () => async () => {
      const q = activeQuery ? `?q=${encodeURIComponent(activeQuery)}` : '';
      const res = await api.get(`/vendors${q}`);
      return res.data.vendors || [];
    },
    [activeQuery]
  );
  const { data: stalls = [], loading, error, refetch } = useApi(fetcher, [activeQuery]);

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6">
      <header className="mb-5">
        <h1 className="font-serif text-[26px] font-bold text-bazaar-ink flex items-center gap-2">
          <Store size={22} /> Vendor stalls
        </h1>
        <p className="text-[12.5px] text-bazaar-ink3">
          Five stalls, ৳99 across the board. Pick your favourite and dive in.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setActiveQuery(searchInput.trim());
        }}
        className="card p-3 mb-5 flex items-center gap-2"
      >
        <Search size={15} className="text-bazaar-ink3 ml-2" />
        <input
          className="flex-1 bg-transparent text-[13.5px] outline-none"
          placeholder="Search stalls by name or location…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Search
        </button>
      </form>

      {loading ? (
        <div className="py-10 flex justify-center">
          <Spinner label="Loading stalls…" />
        </div>
      ) : error ? (
        <ApiError error={error} onRetry={refetch} />
      ) : stalls.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No stalls found"
          hint={activeQuery ? 'Try a different search term.' : 'Check back soon.'}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stalls.map((v) => (
            <Link
              key={v.id}
              to={`/stall/${v.slug}`}
              className="card p-5 hover:border-bazaar-gold hover:shadow-card transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-14 h-14 rounded-full bg-bazaar-bg2 flex items-center justify-center text-3xl shrink-0">
                  {v.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-[17px] font-bold text-bazaar-ink truncate">
                    {v.name}
                  </h3>
                  <p className="text-[11.5px] text-bazaar-ink3 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {v.location}
                  </p>
                </div>
              </div>
              {v.description && (
                <p className="text-[12.5px] text-bazaar-ink2 leading-relaxed line-clamp-2 mb-3 min-h-[36px]">
                  {v.description}
                </p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-bazaar-border">
                <div className="flex items-center gap-3 text-[11.5px] text-bazaar-ink3">
                  <span className="flex items-center gap-1 text-bazaar-gold">
                    <Star size={11} className="fill-bazaar-gold" />
                    <span className="text-bazaar-ink font-semibold">
                      {v.rating?.toFixed?.(1) || '—'}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingBag size={11} /> {v.productCount ?? 0} items
                  </span>
                  <span>Since {v.since || '—'}</span>
                </div>
                <span className="text-[11.5px] text-bazaar-gold flex items-center gap-1">
                  Visit <ArrowRight size={11} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}