// Browse — filterable grid of all products.
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ApiError from '../components/ApiError';
import useApi from '../hooks/useApi';

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get('q') || '');

  const cat = params.get('cat') || '';
  const vendor = params.get('vendor') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'new';

  // Filters load once.
  const filtersFetcher = useMemo(
    () => async () => {
      const [c, v] = await Promise.all([api.get('/categories'), api.get('/vendors')]);
      return {
        categories: c.data.categories || [],
        vendors: v.data.vendors || [],
      };
    },
    []
  );
  const {
    data: filters,
    error: filtersError,
    refetch: refetchFilters,
  } = useApi(filtersFetcher, []);
  const categories = filters?.categories ?? [];
  const vendors = filters?.vendors ?? [];

  // Products load on every filter change.
  const productsFetcher = useMemo(
    () => async () => {
      const search = new URLSearchParams();
      if (cat) search.set('cat', cat);
      if (vendor) search.set('vendor', vendor);
      if (q) search.set('q', q);
      if (sort === 'top') search.set('top', 'true');
      const res = await api.get(`/products?${search.toString()}`);
      let list = res.data.products || [];
      // Client-side discount-aware sort (price was a typo — fix uses both sides).
      if (sort === 'price') {
        const eff = (p) => p.price * (1 - (p.discount || 0) / 100);
        list = [...list].sort((a, b) => eff(a) - eff(b));
      }
      return { products: list, total: res.data.total ?? list.length };
    },
    [cat, vendor, q, sort]
  );
  const {
    data: productsData,
    loading,
    error: productsError,
    refetch: refetchProducts,
  } = useApi(productsFetcher, [cat, vendor, q, sort]);
  const products = productsData?.products ?? [];
  const total = productsData?.total ?? 0;

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  function clearAll() {
    setParams(new URLSearchParams());
    setSearchInput('');
  }

  const hasFilter = !!(cat || vendor || q);

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6">
      <header className="mb-4">
        <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">Browse</h1>
        <p className="text-[12.5px] text-bazaar-ink3">
          All ৳99 products across every stall and category.
        </p>
      </header>

      <div className="grid lg:grid-cols-[260px,1fr] gap-5">
        {/* Filters */}
        <aside className="space-y-4">
          <div className="card p-4">
            <label className="form-label">Search</label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateParam('q', searchInput.trim());
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bazaar-ink3" />
                <input
                  className="form-input pl-8"
                  placeholder="Product name…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </form>
          </div>

          <div className="card p-4">
            <h3 className="form-label">Sort</h3>
            <select
              className="form-select"
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value === 'new' ? '' : e.target.value)}
            >
              <option value="new">Newest</option>
              <option value="top">Top selling</option>
            </select>
          </div>

          <div className="card p-4">
            <h3 className="form-label">Category</h3>
            <ul className="space-y-1 max-h-[260px] overflow-auto pr-1">
              <li>
                <FilterBtn active={!cat} onClick={() => updateParam('cat', '')}>
                  All categories
                </FilterBtn>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <FilterBtn active={cat === c.slug} onClick={() => updateParam('cat', c.slug)}>
                    <span className="mr-1">{c.icon}</span> {c.name}
                    <span className="ml-auto text-[10.5px] text-bazaar-ink3">
                      {c.productCount ?? 0}
                    </span>
                  </FilterBtn>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-4">
            <h3 className="form-label">Stall</h3>
            <ul className="space-y-1 max-h-[200px] overflow-auto pr-1">
              <li>
                <FilterBtn active={!vendor} onClick={() => updateParam('vendor', '')}>
                  All stalls
                </FilterBtn>
              </li>
              {vendors.map((v) => (
                <li key={v.id}>
                  <FilterBtn active={vendor === v.slug} onClick={() => updateParam('vendor', v.slug)}>
                    <span className="mr-1">{v.emoji}</span> {v.name}
                  </FilterBtn>
                </li>
              ))}
            </ul>
          </div>

          {hasFilter && (
            <button onClick={clearAll} className="btn btn-secondary btn-sm w-full justify-center">
              <X size={13} /> Clear filters
            </button>
          )}
        </aside>

        {/* Results */}
        <section>
          {filtersError && (
            <ApiError error={filtersError} onRetry={refetchFilters} hint="Filters failed to load." />
          )}
          {productsError && (
            <ApiError error={productsError} onRetry={refetchProducts} hint="Try clearing filters or check the backend." />
          )}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12.5px] text-bazaar-ink3">
              {loading ? 'Loading…' : `${total} product${total === 1 ? '' : 's'}`}
            </p>
            {hasFilter && (
              <div className="flex flex-wrap gap-1.5 justify-end">
                {cat && (
                  <Pill onClear={() => updateParam('cat', '')}>
                    {categories.find((c) => c.slug === cat)?.icon}{' '}
                    {categories.find((c) => c.slug === cat)?.name || cat}
                  </Pill>
                )}
                {vendor && (
                  <Pill onClear={() => updateParam('vendor', '')}>
                    {vendors.find((v) => v.slug === vendor)?.emoji}{' '}
                    {vendors.find((v) => v.slug === vendor)?.name || vendor}
                  </Pill>
                )}
                {q && <Pill onClear={() => updateParam('q', '')}>“{q}”</Pill>}
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-10 flex justify-center">
              <Spinner label="Loading products…" />
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Nothing matched"
              hint="Try a different category or search term."
              action={
                <button onClick={clearAll} className="btn btn-secondary btn-sm">
                  Clear filters
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left text-[12.5px] flex items-center px-2.5 py-1.5 rounded transition-colors ${
        active
          ? 'bg-bazaar-gold-l text-bazaar-ink font-semibold'
          : 'text-bazaar-ink2 hover:bg-bazaar-bg'
      }`}
    >
      {children}
    </button>
  );
}

function Pill({ children, onClear }) {
  return (
    <span className="chip chip-gold flex items-center gap-1">
      {children}
      <button type="button" onClick={onClear} className="hover:text-bazaar-ink" aria-label="Remove filter">
        <X size={10} />
      </button>
    </span>
  );
}