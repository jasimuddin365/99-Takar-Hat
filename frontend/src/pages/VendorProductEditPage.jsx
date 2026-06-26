// Vendor — edit existing product (PUT /api/products/:id, multipart).
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Upload, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import SafeImage from '../components/SafeImage';

const PRICE_PRESETS = [49, 79, 99, 149];

export default function VendorProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [clearedImage, setClearedImage] = useState(false);

  const {
    register: rf,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      categorySlug: '',
      price: 99,
      stock: 0,
      discount: 0,
      badge: '',
      isActive: true,
    },
  });

  // Load categories once
  useEffect(() => {
    let alive = true;
    api
      .get('/categories')
      .then((r) => alive && setCategories(r.data.categories || []))
      .catch((err) => alive && toast.error(err.message || 'Could not load categories'));
    return () => {
      alive = false;
    };
  }, []);

  // Load the product
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then((r) => {
        if (!alive) return;
        const p = r.data.product;
        setProduct(p);
        setValue('name', p.name || '');
        setValue('description', p.description || '');
        setValue('categorySlug', p.category?.slug || '');
        setValue('price', p.price || 99);
        setValue('stock', p.stock || 0);
        setValue('discount', p.discount || 0);
        setValue('badge', p.badge || '');
        setValue('isActive', p.isActive !== false);
        setPreviewUrl(p.imageUrl || '');
      })
      .catch((err) => alive && toast.error(err.message || 'Could not load product'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, setValue]);

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
    setClearedImage(false);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  }

  async function onSubmit(values) {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', values.name.trim());
      fd.append('description', values.description.trim());
      fd.append('categorySlug', values.categorySlug);
      fd.append('price', String(Number(values.price) || 99));
      fd.append('stock', String(Number(values.stock) || 0));
      fd.append('discount', String(Number(values.discount) || 0));
      if (values.badge?.trim()) fd.append('badge', values.badge.trim());
      fd.append('isActive', String(Boolean(values.isActive)));
      if (fileRef.current?.files?.[0]) fd.append('image', fileRef.current.files[0]);

      await api.put(`/products/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Product updated');
      navigate('/vendor/products', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not update product');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading product…" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[600px] mx-auto px-5 py-10 text-center">
        <p className="text-[14px] text-bazaar-ink2 mb-4">Product not found.</p>
        <Link to="/vendor/products" className="btn btn-secondary btn-sm">
          Back to products
        </Link>
      </div>
    );
  }

  const price = watch('price');
  const isActive = watch('isActive');

  return (
    <div className="max-w-[960px] mx-auto px-5 py-6">
      <Link
        to="/vendor/products"
        className="inline-flex items-center gap-1 text-[12px] text-bazaar-ink3 hover:text-bazaar-gold mb-3"
      >
        <ArrowLeft size={12} /> Back to products
      </Link>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">Edit product</h1>
        <Link
          to={`/product/${product.id}`}
          className="btn btn-secondary btn-sm"
        >
          <Eye size={12} /> Public page
        </Link>
      </div>
      <p className="text-[12.5px] text-bazaar-ink3 mb-5">
        {product.sales || 0} sold · listed {new Date(product.createdAt).toLocaleDateString()}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-[1fr,320px] gap-5">
        <div className="card p-5 space-y-4">
          <div>
            <label className="form-label">Product name</label>
            <input
              className="form-input"
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
              <label className="form-label">Badge</label>
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

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...rf('isActive')}
              className="accent-bazaar-gold w-4 h-4"
            />
            <span className="text-[12.5px] text-bazaar-ink2">
              {isActive ? (
                <>
                  <Eye size={11} className="inline -mt-0.5 text-bazaar-green" /> Active — visible in shop
                </>
              ) : (
                <>
                  <EyeOff size={11} className="inline -mt-0.5 text-bazaar-ink3" /> Hidden from shop
                </>
              )}
            </span>
          </label>
        </div>

        <aside className="space-y-3">
          <div className="card p-4">
            <h3 className="font-serif text-[15px] font-bold mb-3">Image</h3>
            <div
              className="aspect-square rounded-lg border-2 border-dashed border-bazaar-border bg-bazaar-bg2 flex items-center justify-center overflow-hidden cursor-pointer hover:border-bazaar-gold"
              onClick={() => fileRef.current?.click()}
            >
              {previewUrl && !clearedImage ? (
                <SafeImage src={previewUrl} alt="Product preview" className="w-full h-full" />
              ) : (
                <div className="text-center text-bazaar-ink3 p-3">
                  <Upload size={22} className="mx-auto mb-1" />
                  <div className="text-[11px]">Click to replace</div>
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
            disabled={saving}
            className="btn btn-primary w-full justify-center disabled:opacity-50"
          >
            {saving ? <Spinner size={14} /> : <><Save size={14} /> Save changes</>}
          </button>
        </aside>
      </form>
    </div>
  );
}