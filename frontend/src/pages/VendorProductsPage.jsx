// Vendor products — list, filter by active/inactive, quick delete.
// Source: derive vendor's stall from /api/orders/vendor/inbox, then list
// products via the public /api/products?vendor=<slug> filter.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit3, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { taka } from '../lib/format';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import SafeImage from '../components/SafeImage';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function VendorProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [stall, setStall] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get('/orders/vendor/inbox')
      .then((r) => alive && setStall(r.data.stall || null))
      .catch((err) => {
        if (!alive) return;
        toast.error(err.message || 'Could not load stall');
        setStall(null);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!stall) {
      setProducts([]);
      return;
    }
    let alive = true;
    setLoading(true);
    api
      .get(`/products?vendor=${encodeURIComponent(stall.slug)}`)
      .then((r) => alive && setProducts(r.data.products || []))
      .catch((err) => {
        if (!alive) return;
        toast.error(err.message || 'Could not load products');
        setProducts([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [stall]);

  const visible = useMemo(() => {
    let out = products;
    if (filter === 'active') out = out.filter((p) => p.isActive);
    else if (filter === 'inactive') out = out.filter((p) => !p.isActive);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [products, filter, query]);

  async function toggleActive(p) {
    setBusyId(p.id);
    try {
      await api.put(`/products/${p.id}`, { isActive: !p.isActive });
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, isActive: !p.isActive } : x))
      );
      toast.success(p.isActive ? 'Hidden from shop' : 'Back on the shelf');
    } catch (err) {
      toast.error(err.message || 'Could not update');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p) {
    if (!confirm(`Delete "${p.name}"? It will be hidden from customers.`)) return;
    setBusyId(p.id);
    try {
      await api.delete(`/products/${p.id}`);
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: false } : x)));
      toast.success('Product removed');
    } catch (err) {
      toast.error(err.message || 'Could not delete');
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !stall) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading products…" />
      </div>
    );
  }

  if (!stall) {
    return (
      <div className="max-w-[640px] mx-auto px-5 py-10 text-center">
        <h1 className="font-serif text-[22px] font-bold mb-2">No products yet</h1>
        <p className="text-[13px] text-bazaar-ink3 mb-4">
          Add your first product to spin up your stall.
        </p>
        <Link to="/vendor/products/new" className="btn btn-primary btn-sm">
          <Plus size={13} /> Add product
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-5 py-6">
      <header className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">My products</h1>
          <p className="text-[12.5px] text-bazaar-ink3">
            {products.length} listed · {products.filter((p) => p.isActive).length} active
          </p>
        </div>
        <Link to="/vendor/products/new" className="btn btn-primary btn-sm">
          <Plus size={13} /> Add product
        </Link>
      </header>

      <div className="card p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bazaar-ink3"
          />
          <input
            className="form-input pl-8"
            placeholder="Search your products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition ${
                filter === f.value
                  ? 'bg-bazaar-gold text-white'
                  : 'bg-bazaar-bg2 text-bazaar-ink2 hover:bg-bazaar-gold-l'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading…" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No products match"
          hint={
            products.length === 0
              ? 'Add your first product to start selling.'
              : 'Try clearing the filters.'
          }
          action={
            products.length === 0 ? (
              <Link to="/vendor/products/new" className="btn btn-primary btn-sm">
                Add product
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              busy={busyId === p.id}
              onToggle={() => toggleActive(p)}
              onRemove={() => remove(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({ product, busy, onToggle, onRemove }) {
  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-bazaar-bg2">
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          fallback="🛍️"
          className={`w-full h-full ${product.isActive ? '' : 'opacity-50 grayscale'}`}
        />
        {!product.isActive && (
          <span className="absolute top-2 left-2 chip chip-red">Hidden</span>
        )}
        {product.stock <= 0 && product.isActive && (
          <span className="absolute top-2 left-2 chip chip-orange">Out of stock</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <div className="text-[12.5px] font-semibold text-bazaar-ink truncate">
          {product.name}
        </div>
        <div className="text-[10.5px] text-bazaar-ink3 mt-0.5 truncate">
          {product.category?.name || '—'} · {product.sales || 0} sold
        </div>
        <div className="font-serif text-[16px] font-bold text-bazaar-gold mt-1.5">
          {taka(product.price || 99)}
        </div>
        <div className="mt-2 flex gap-1.5">
          <Link
            to={`/vendor/products/${product.id}`}
            className="btn btn-secondary btn-sm flex-1 justify-center"
          >
            <Edit3 size={11} /> Edit
          </Link>
          <Link
            to={`/product/${product.id}`}
            className="btn btn-sm px-2"
            title="View public"
          >
            <Eye size={11} />
          </Link>
          <button
            onClick={onToggle}
            disabled={busy}
            title={product.isActive ? 'Hide' : 'Show'}
            className="btn btn-sm px-2 disabled:opacity-50"
          >
            {product.isActive ? <EyeOff size={11} /> : <Eye size={11} />}
          </button>
          <button
            onClick={onRemove}
            disabled={busy}
            title="Delete"
            className="btn btn-sm px-2 text-bazaar-red hover:bg-bazaar-red hover:text-white disabled:opacity-50"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}