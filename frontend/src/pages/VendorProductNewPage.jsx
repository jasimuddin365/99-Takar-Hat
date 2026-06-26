// Vendor — create new product (multipart with optional image).
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Upload, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import SafeImage from '../components/SafeImage';

const PRICE_PRESETS = [49, 79, 99, 149];

export default function VendorProductNewPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const {
    register: rf,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      categorySlug: '',
      price: 99,
      stock: 10,
      discount: 0,
      badge: '',
    },
  });

  useEffect(() => {
    let alive = true;
    setLoadingCats(true);
    api
      .get('/categories')
      .then((r) => {
        if (!alive) return;
        const list = r.data.categories || [];
        setCategories(list);
        if (list.length) setValue('categorySlug', list[0].slug);
      })
      .catch((err) => alive && toast.error(err.message || 'Could not load categories'))
      .finally(() => alive && setLoadingCats(false));
    return () => {
      alive = false;
    };
  }, [setValue]);

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error('Use JPEG, PNG, or WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  }

  async function onSubmit(values) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', values.name.trim());
      fd.append('description', values.description.trim());
      fd.append('categorySlug', values.categorySlug);
      fd.append('price', String(Number(values.price) || 99));
      fd.append('stock', String(Number(values.stock) || 0));
      fd.append('discount', String(Number(values.discount) || 0));
      if (values.badge?.trim()) fd.append('badge', values.badge.trim());
      if (fileRef.current?.files?.[0]) fd.append('image', fileRef.current.files[0]);

      const { data } = await api.post('/products', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Product created!');
      navigate(`/vendor/products`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not create product');
    } finally {
      setBusy(false);
    }
  }

  if (loadingCats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading…" />
      </div>
    );
  }

  const price = watch('price');

  return (
    <div className="max-w-[960px] mx-auto px-5 py-6">
      <Link
        to="/vendor/products"
        className="inline-flex items-center gap-1 text-[12px] text-bazaar-ink3 hover:text-bazaar-gold mb-3"
      >
        <ArrowLeft size={12} /> Back to products
      </Link>
      <h1 className="font-serif text-[26px] font-bold text-bazaar-ink mb-1">Add product</h1>
      <p className="text-[12.5px] text-bazaar-ink3 mb-5">
        Your stall will be auto-created the moment you submit this form.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-[1fr,320px] gap-5">
        <div className="card p-5 space-y-4">
          <div>
            <label className="form-label">Product name</label>
            <input
              className="form-input"
              placeholder="e.g. Aloo Paratha"
              {...rf('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'At least 2 characters' },
                maxLength: 120,
              })}
            />
            {errors.name && (
              <p className="text-[11.5px] text-bazaar-red mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              rows={4}
              className="form-textarea"
              placeholder="Tell customers what makes it special…"
              {...rf('description', { maxLength: 800 })}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Category</label>
              <select className="form-select" {...rf('categorySlug', { required: true })}>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Badge (optional)</label>
              <input
                className="form-input"
                placeholder="e.g. New, Bestseller"
                {...rf('badge', { maxLength: 30 })}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="form-label">Price (৳)</label>
              <input
                type="number"
                min={1}
                className="form-input"
                {...rf('price', { required: true, min: { value: 1, message: 'Min 1' } })}
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {PRICE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue('price', p)}
                    className={`text-[10.5px] px-2 py-0.5 rounded border transition ${
                      Number(price) === p
                        ? 'border-bazaar-gold bg-bazaar-gold-l text-bazaar-gold font-semibold'
                        : 'border-bazaar-border text-bazaar-ink3 hover:border-bazaar-gold'
                    }`}
                  >
                    ৳{p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">Stock</label>
              <input
                type="number"
                min={0}
                className="form-input"
                {...rf('stock', { min: { value: 0, message: 'Min 0' } })}
              />
            </div>
            <div>
              <label className="form-label">Discount %</label>
              <input
                type="number"
                min={0}
                max={30}
                className="form-input"
                {...rf('discount', { min: 0, max: 30 })}
              />
              <p className="text-[10.5px] text-bazaar-ink3 mt-1">Capped at 30%.</p>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="card p-4">
            <h3 className="font-serif text-[15px] font-bold mb-3">Image</h3>
            <div
              className="aspect-square rounded-lg border-2 border-dashed border-bazaar-border bg-bazaar-bg2 flex items-center justify-center overflow-hidden cursor-pointer hover:border-bazaar-gold"
              onClick={() => fileRef.current?.click()}
            >
              {previewUrl ? (
                <SafeImage src={previewUrl} alt="Product preview" className="w-full h-full" />
              ) : (
                <div className="text-center text-bazaar-ink3 p-3">
                  <Upload size={22} className="mx-auto mb-1" />
                  <div className="text-[11px]">Click to upload</div>
                  <div className="text-[10px] mt-0.5">JPEG / PNG / WebP, max 5 MB</div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary w-full justify-center disabled:opacity-50"
          >
            {busy ? <Spinner size={14} /> : <><Save size={14} /> Publish</>}
          </button>
        </aside>
      </form>
    </div>
  );
}