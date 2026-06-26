// Admin product moderation. List across all stalls, filter by vendor/active,
// search, soft-delete.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Trash2,
  Package,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { taka } from '../lib/format';
import Spinner from '../components/Spinner';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [vendor, setVendor] = useState('');
  const [active, setActive] = useState('');
  const [busy, setBusy] = useState('');

  // Independent load so the vendor dropdown doesn't refetch products
  useEffect(() => {
    api
      .get('/admin/vendors')
      .then((r) => setVendors(r.data.vendors || []))
      .catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    api
      .get('/admin/products', { params: { q, vendor, active } })
      .then((r) => setProducts(r.data.products || []))
      .catch((err) => toast.error(err.message || 'Could not load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, vendor, active]);

  const counts = useMemo(() => {
    const c = { all: products.length, active: 0, inactive: 0 };
    for (const p of products) {
      if (p.isActive) c.active += 1;
      else c.inactive += 1;
    }
    return c;
  }, [products]);

  const onDelete = async (p) => {
    if (
      !confirm(
        `Remove "${p.name}" by ${p.stall?.name || p.stallName || 'this vendor'}? This soft-deletes it.`
      )
    )
      return;
    setBusy(p.id);
    try {
      await api.delete(`/admin/products/${p.id}`);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      toast.success('Product removed');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
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
        <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">Products</h1>
        <p className="text-[12.5px] text-bazaar-ink3">
          {products.length} {products.length === 1 ? 'product' : 'products'} across the platform.
        </p>
      </header>

      <div className="card p-3 space-y-2">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bazaar-ink3"
            />
            <input
              className="form-input pl-8 py-1.5 text-[12.5px]"
              placeholder="Search products…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className="form-select py-1.5 text-[12.5px] max-w-[200px]"
          >
            <option value="">All vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.emoji} {v.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setActive('')}
            className={`chip ${active === '' ? 'chip-gold' : 'chip-gray'} cursor-pointer`}
          >
            All · {counts.all}
          </button>
          <button
            onClick={() => setActive('true')}
            className={`chip ${active === 'true' ? 'chip-gold' : 'chip-gray'} cursor-pointer`}
          >
            Active · {counts.active}
          </button>
          <button
            onClick={() => setActive('false')}
            className={`chip ${active === 'false' ? 'chip-gold' : 'chip-gray'} cursor-pointer`}
          >
            Inactive · {counts.inactive}
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading products…" />
      ) : products.length === 0 ? (
        <div className="card p-10 text-center text-[12.5px] text-bazaar-ink3">
          <Package size={28} className="mx-auto mb-2 text-bazaar-border" />
          No products match.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead className="bg-bazaar-bg2 text-[10.5px] uppercase tracking-wide text-bazaar-ink3">
              <tr>
                <th className="text-left py-2.5 px-3">Product</th>
                <th className="text-left py-2.5 px-3">Vendor</th>
                <th className="text-right py-2.5 px-3">Price</th>
                <th className="text-right py-2.5 px-3">Stock</th>
                <th className="text-right py-2.5 px-3">Sold</th>
                <th className="text-center py-2.5 px-3">Status</th>
                <th className="text-right py-2.5 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-bazaar-border">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt=""
                          className="w-9 h-9 rounded object-cover bg-bazaar-bg2"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded bg-bazaar-bg2 flex items-center justify-center">
                          <Package size={14} className="text-bazaar-ink3" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold truncate max-w-[200px]">{p.name}</div>
                        <div className="text-[10.5px] text-bazaar-ink3 truncate">
                          {p.category?.name || p.categoryName || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span>{p.stall?.emoji || '🛒'}</span>
                      <span className="truncate max-w-[140px]">
                        {p.stall?.name || p.stallName || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">{taka(p.price)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={
                        (p.stock ?? 0) < 10
                          ? 'text-bazaar-orange font-semibold'
                          : 'font-semibold'
                      }
                    >
                      {p.stock ?? 0}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">{p.sales || 0}</td>
                  <td className="py-2.5 px-3 text-center">
                    {p.isActive ? (
                      <span className="chip chip-green">Active</span>
                    ) : (
                      <span className="chip chip-gray">Off</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Link
                        to={`/product/${p.id}`}
                        className="btn btn-secondary btn-sm"
                        target="_blank"
                      >
                        <ExternalLink size={12} />
                      </Link>
                      <button
                        onClick={() => onDelete(p)}
                        disabled={busy === p.id}
                        className="btn btn-sm bg-bazaar-red text-white hover:opacity-90"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}