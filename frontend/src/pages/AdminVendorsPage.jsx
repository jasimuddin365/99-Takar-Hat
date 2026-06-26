// Admin vendor directory. List stalls, filter, edit name/desc/location/emoji,
// suspend/restore. Editable fields per PATCH /api/admin/vendors/:id.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Store, Star, Save, X, Power, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Spinner from '../components/Spinner';

const COMMON_EMOJI = ['🛒', '🥦', '📚', '🍱', '👕', '💊', '🎁', '🛍️', '🍞', '☕', '🍜', '🎨', '🏪', '🌶️', '🍎'];

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [active, setActive] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/admin/vendors', { params: { q, active } })
      .then((r) => setVendors(r.data.vendors || []))
      .catch((err) => toast.error(err.message || 'Could not load vendors'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, active]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.patch(`/admin/vendors/${editing.id}`, {
        name: editing.name,
        description: editing.description,
        location: editing.location,
        emoji: editing.emoji,
      });
      setVendors((prev) =>
        prev.map((v) => (v.id === editing.id ? { ...v, ...r.data } : v))
      );
      toast.success('Stall updated');
      setEditing(null);
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onToggle = async (v) => {
    setBusy(v.id);
    try {
      await api.patch(`/admin/vendors/${v.id}`, { isActive: !v.isActive });
      setVendors((prev) =>
        prev.map((x) => (x.id === v.id ? { ...x, isActive: !x.isActive } : x))
      );
      toast.success(v.isActive ? `${v.name} suspended` : `${v.name} restored`);
    } catch (err) {
      toast.error(err.message || 'Update failed');
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
        <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">Vendors</h1>
        <p className="text-[12.5px] text-bazaar-ink3">
          {vendors.length} stalls · manage identity and status.
        </p>
      </header>

      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <input
          className="form-input py-1.5 text-[12.5px] flex-1 min-w-[200px]"
          placeholder="Search stalls…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-1.5">
          <button
            onClick={() => setActive('')}
            className={`chip ${active === '' ? 'chip-gold' : 'chip-gray'} cursor-pointer`}
          >
            All
          </button>
          <button
            onClick={() => setActive('true')}
            className={`chip ${active === 'true' ? 'chip-gold' : 'chip-gray'} cursor-pointer`}
          >
            Active
          </button>
          <button
            onClick={() => setActive('false')}
            className={`chip ${active === 'false' ? 'chip-gold' : 'chip-gray'} cursor-pointer`}
          >
            Suspended
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading vendors…" />
      ) : vendors.length === 0 ? (
        <div className="card p-10 text-center text-[12.5px] text-bazaar-ink3">
          <Store size={28} className="mx-auto mb-2 text-bazaar-border" />
          No vendors match.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vendors.map((v) => (
            <div key={v.id} className="card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-bazaar-bg2 flex items-center justify-center text-[26px]">
                  {v.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-[15px] font-bold truncate">{v.name}</div>
                  <div className="text-[10.5px] text-bazaar-ink3 truncate">
                    {v.location || 'No location'}
                  </div>
                </div>
                {v.isActive ? (
                  <span className="chip chip-green">Active</span>
                ) : (
                  <span className="chip chip-red">Off</span>
                )}
              </div>

              <p className="text-[11.5px] text-bazaar-ink3 line-clamp-2 min-h-[2.4em]">
                {v.description || 'No description yet.'}
              </p>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                <Stat label="Products" value={v.productCount || 0} />
                <Stat label="Sales" value={v.totalSales || 0} />
                <Stat
                  label="Rating"
                  value={
                    <span className="flex items-center justify-center gap-0.5">
                      <Star size={10} className="text-bazaar-gold" />
                      {v.rating?.toFixed?.(1) || '—'}
                    </span>
                  }
                />
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => setEditing({ ...v })}
                  className="btn btn-secondary btn-sm flex-1"
                >
                  <Edit3 size={12} /> Edit
                </button>
                <button
                  onClick={() => onToggle(v)}
                  disabled={busy === v.id}
                  className={`btn btn-sm ${v.isActive ? 'btn-secondary' : 'btn-primary'}`}
                >
                  <Power size={12} /> {v.isActive ? 'Suspend' : 'Restore'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
            <header className="flex items-center justify-between">
              <h3 className="font-serif text-[18px] font-bold">Edit stall</h3>
              <button onClick={() => setEditing(null)} className="text-bazaar-ink3 hover:text-bazaar-ink">
                <X size={18} />
              </button>
            </header>

            <form onSubmit={onSave} className="space-y-3">
              <div>
                <label className="form-label">Emoji</label>
                <div className="flex gap-1 flex-wrap mb-1.5">
                  {COMMON_EMOJI.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEditing({ ...editing, emoji: e })}
                      className={`w-8 h-8 rounded border text-[18px] flex items-center justify-center ${
                        editing.emoji === e
                          ? 'border-bazaar-gold bg-bazaar-gold-l/30'
                          : 'border-bazaar-border'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <input
                  className="form-input text-center text-[18px]"
                  value={editing.emoji}
                  onChange={(e) => setEditing({ ...editing, emoji: e.target.value })}
                  maxLength={4}
                />
              </div>

              <div>
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Location</label>
                <input
                  className="form-input"
                  value={editing.location || ''}
                  onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                  placeholder="e.g. Old Dhaka"
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                  <Save size={12} /> {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-bazaar-bg2 rounded p-1.5">
      <div className="text-[13px] font-bold text-bazaar-ink">{value}</div>
      <div className="text-[9.5px] uppercase tracking-wide text-bazaar-ink3">
        {label}
      </div>
    </div>
  );
}