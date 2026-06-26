// Admin category management. Create, edit, toggle active, delete with
// graceful handling of "products reference this category" 400 errors.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  X,
  Edit3,
  Tags,
  Power,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Spinner from '../components/Spinner';

const ICON_SUGGESTIONS = [
  '🍱', '🥦', '👕', '📚', '💊', '🛒', '🎁', '🧴', '🧸', '🔌',
  '🍞', '☕', '🍜', '🌶️', '🍎',
];

const EMPTY_FORM = { name: '', icon: '🛒', position: 0, isActive: true };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [busy, setBusy] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/admin/categories')
      .then((r) => setCategories(r.data.categories || []))
      .catch((err) => toast.error(err.message || 'Could not load categories'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSavingCreate(true);
    try {
      const slug = slugify(createForm.name);
      if (!slug) {
        toast.error('Name must contain at least one letter or number');
        setSavingCreate(false);
        return;
      }
      const r = await api.post('/admin/categories', {
        slug,
        name: createForm.name.trim(),
        icon: createForm.icon,
        position: Number(createForm.position) || 0,
        isActive: !!createForm.isActive,
      });
      setCategories((prev) => [...prev, r.data.category].sort(sortCats));
      toast.success(`Category "${r.data.category.name}" created`);
      setCreateForm(EMPTY_FORM);
      setCreating(false);
    } catch (err) {
      // 409 = slug already exists; surface a friendlier message
      const msg =
        err.response?.status === 409
          ? 'A category with that slug already exists — try a different name'
          : err.message || 'Create failed';
      toast.error(msg);
    } finally {
      setSavingCreate(false);
    }
  };

  const onEditSave = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const r = await api.patch(`/admin/categories/${editing.id}`, {
        name: editing.name,
        icon: editing.icon,
        position: Number(editing.position) || 0,
        isActive: !!editing.isActive,
      });
      const updated = r.data.category || r.data;
      setCategories((prev) =>
        prev
          .map((c) => (c.id === editing.id ? { ...c, ...updated } : c))
          .sort(sortCats)
      );
      toast.success('Category updated');
      setEditing(null);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSavingEdit(false);
    }
  };

  const onDelete = async (c) => {
    if (
      !confirm(
        `Delete "${c.name}"?${
          (c.productCount || 0) > 0
            ? `\n\nThis category has ${c.productCount} product(s). The server will block deletion — archive or move them first.`
            : ''
        }`
      )
    )
      return;
    setBusy(c.id);
    try {
      await api.delete(`/admin/categories/${c.id}`);
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
      toast.success(`Category "${c.name}" removed`);
    } catch (err) {
      // Server returns 400 with message when products reference this category
      toast.error(err.message || 'Delete failed (category may have products)');
    } finally {
      setBusy('');
    }
  };

  const onToggleActive = async (c) => {
    setBusy(c.id);
    try {
      const r = await api.patch(`/admin/categories/${c.id}`, {
        isActive: !c.isActive,
      });
      setCategories((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, ...r.data } : x))
      );
      toast.success(c.isActive ? 'Category hidden' : 'Category visible');
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

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">Categories</h1>
          <p className="text-[12.5px] text-bazaar-ink3">
            {categories.length} categories · order controls homepage display.
          </p>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="btn btn-primary btn-sm"
        >
          {creating ? <X size={12} /> : <Plus size={12} />}
          {creating ? 'Cancel' : 'New category'}
        </button>
      </header>

      {creating && (
        <form onSubmit={onCreate} className="card p-4 space-y-3">
          <div className="grid sm:grid-cols-[1fr_120px_80px_120px_auto] gap-2 items-end">
            <div>
              <label className="form-label">Name</label>
              <input
                className="form-input"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="e.g. Pet Supplies"
                required
              />
            </div>
            <div>
              <label className="form-label">Icon</label>
              <input
                className="form-input text-center text-[18px]"
                value={createForm.icon}
                onChange={(e) =>
                  setCreateForm({ ...createForm, icon: e.target.value })
                }
                maxLength={4}
              />
            </div>
            <div>
              <label className="form-label">Position</label>
              <input
                type="number"
                className="form-input text-center"
                value={createForm.position}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    position: e.target.value,
                  })
                }
              />
            </div>
            <label className="flex items-center gap-1.5 text-[12px] pb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createForm.isActive}
                onChange={(e) =>
                  setCreateForm({ ...createForm, isActive: e.target.checked })
                }
              />
              Active
            </label>
            <button
              type="submit"
              disabled={savingCreate}
              className="btn btn-primary btn-sm"
            >
              <Save size={12} /> {savingCreate ? 'Saving…' : 'Create'}
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {ICON_SUGGESTIONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setCreateForm({ ...createForm, icon: ic })}
                className={`w-7 h-7 rounded text-[16px] flex items-center justify-center border ${
                  createForm.icon === ic
                    ? 'border-bazaar-gold bg-bazaar-gold-l/30'
                    : 'border-bazaar-border'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </form>
      )}

      {loading ? (
        <Spinner label="Loading categories…" />
      ) : categories.length === 0 ? (
        <div className="card p-10 text-center text-[12.5px] text-bazaar-ink3">
          <Tags size={28} className="mx-auto mb-2 text-bazaar-border" />
          No categories yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="card p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-bazaar-bg2 flex items-center justify-center text-[24px]">
                  {c.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-[15px] font-bold truncate">
                    {c.name}
                  </div>
                  <div className="text-[10.5px] text-bazaar-ink3 truncate">
                    /{c.slug} · pos {c.position}
                  </div>
                </div>
                {c.isActive ? (
                  <span className="chip chip-green">Live</span>
                ) : (
                  <span className="chip chip-gray">Hidden</span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11.5px] py-1.5 border-t border-bazaar-border">
                <span className="text-bazaar-ink3">Products</span>
                <span className="font-semibold">{c.productCount || 0}</span>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => setEditing({ ...c })}
                  className="btn btn-secondary btn-sm flex-1"
                >
                  <Edit3 size={12} /> Edit
                </button>
                <button
                  onClick={() => onToggleActive(c)}
                  disabled={busy === c.id}
                  className="btn btn-secondary btn-sm"
                  title={c.isActive ? 'Hide' : 'Show'}
                >
                  <Power size={12} />
                </button>
                <button
                  onClick={() => onDelete(c)}
                  disabled={busy === c.id}
                  className="btn btn-sm bg-bazaar-red text-white hover:opacity-90"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
            <header className="flex items-center justify-between">
              <h3 className="font-serif text-[18px] font-bold">Edit category</h3>
              <button
                onClick={() => setEditing(null)}
                className="text-bazaar-ink3 hover:text-bazaar-ink"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={onEditSave} className="space-y-3">
              <div>
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  required
                />
                <p className="text-[10.5px] text-bazaar-ink3 mt-1">
                  Slug stays as <code>/{editing.slug}</code>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Icon</label>
                  <input
                    className="form-input text-center text-[20px]"
                    value={editing.icon}
                    onChange={(e) =>
                      setEditing({ ...editing, icon: e.target.value })
                    }
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="form-label">Position</label>
                  <input
                    type="number"
                    className="form-input text-center"
                    value={editing.position}
                    onChange={(e) =>
                      setEditing({ ...editing, position: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-1 flex-wrap">
                {ICON_SUGGESTIONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setEditing({ ...editing, icon: ic })}
                    className={`w-7 h-7 rounded text-[16px] flex items-center justify-center border ${
                      editing.icon === ic
                        ? 'border-bazaar-gold bg-bazaar-gold-l/30'
                        : 'border-bazaar-border'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) =>
                    setEditing({ ...editing, isActive: e.target.checked })
                  }
                />
                Visible on storefront
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-primary btn-sm"
                >
                  <Save size={12} /> {savingEdit ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function sortCats(a, b) {
  return (a.position || 0) - (b.position || 0);
}

// Convert a free-text category name into a backend-valid slug.
// Lowercase ASCII letters, digits and dashes only; 2–40 chars; trims and collapses repeats.
function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}