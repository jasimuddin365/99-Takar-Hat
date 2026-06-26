// AuthModal — portal-mounted sign-in / register dialog.
// Reuses the same form shape as LoginPage so behavior stays consistent.
// On successful auth:
//   1. Closes the modal (parent calls onSuccess which then runs any queued action).
//   2. After queued action settles, the LoginPage-style useEffect inside onSuccess
//      would normally redirect — but since the user is mid-flow on a public page,
//      we keep them on `from` (deep-link return). The provider's runAfter is
//      responsible for navigating back if needed.
//
// Controlled entirely by parent props:
//   open        — boolean visibility
//   title       — optional override (string)
//   from        — the path the user was on (informational)
//   onClose     — dismiss without auth
//   onSuccess   — called after auth resolves successfully
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { X, LogIn, UserPlus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function AuthModal({ open, title, from, onClose, onSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [busy, setBusy] = useState(false);

  const {
    register: rf,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { name: '', email: '', password: '', role: 'CUSTOMER' },
  });

  // Reset form on open.
  useEffect(() => {
    if (open) reset({ name: '', email: '', password: '', role: 'CUSTOMER' });
  }, [open, reset]);

  // Scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  async function onSubmit(values) {
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(values.email.trim(), values.password);
        toast.success('Welcome back!');
      } else {
        await register({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          role: values.role,
        });
        toast.success('Account created — happy shopping!');
      }
      await onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title || (mode === 'login' ? 'Sign in' : 'Create account')}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_.15s_ease-out]">
        {/* Header */}
        <div className="relative px-6 pt-5 pb-3 border-b border-bazaar-border bg-gradient-to-br from-bazaar-bg to-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-bazaar-bg2 flex items-center justify-center text-bazaar-ink3"
            aria-label="Close"
          >
            <X size={15} />
          </button>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <span className="w-8 h-8 rounded-full bg-bazaar-gold text-bazaar-ink flex items-center justify-center font-serif text-[14px] font-bold">
              ৯৯
            </span>
            <span className="font-serif text-[16px] font-bold text-bazaar-ink">Taka Bazaar</span>
          </div>
          <h2 className="font-serif text-[20px] font-bold text-bazaar-ink flex items-center gap-2">
            {mode === 'login' ? <LogIn size={18} className="text-bazaar-gold" /> : <UserPlus size={18} className="text-bazaar-gold" />}
            {title || (mode === 'login' ? 'Sign in to continue' : 'Create your account')}
          </h2>
          {from && from !== '/login' && (
            <p className="text-[11.5px] text-bazaar-ink3 mt-1">
              You'll return to <span className="font-mono text-bazaar-ink2">{prettyPath(from)}</span> after signing in.
            </p>
          )}
        </div>

        {/* Mode tabs */}
        <div className="px-6 pt-4">
          <div className="flex items-center bg-bazaar-bg2 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 text-[12.5px] font-semibold rounded-md transition-colors ${
                mode === 'login' ? 'bg-white text-bazaar-ink shadow-soft' : 'text-bazaar-ink3 hover:text-bazaar-ink'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 text-[12.5px] font-semibold rounded-md transition-colors ${
                mode === 'register' ? 'bg-white text-bazaar-ink shadow-soft' : 'text-bazaar-ink3 hover:text-bazaar-ink'
              }`}
            >
              Create account
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-3">
          {mode === 'register' && (
            <div>
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Your name"
                autoFocus
                {...rf('name', { required: 'Name is required' })}
              />
              {errors.name && <p className="text-[11px] text-bazaar-red mt-1">{errors.name.message}</p>}
            </div>
          )}

          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              autoFocus={mode === 'login'}
              {...rf('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <p className="text-[11px] text-bazaar-red mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="At least 6 characters"
              {...rf('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'At least 6 characters' },
              })}
            />
            {errors.password && <p className="text-[11px] text-bazaar-red mt-1">{errors.password.message}</p>}
          </div>

          {mode === 'register' && (
            <div>
              <label className="form-label">I am a…</label>
              <select className="form-select" {...rf('role')}>
                <option value="CUSTOMER">Customer — buying products</option>
                <option value="VENDOR">Vendor — running a stall</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary w-full justify-center mt-1"
          >
            {busy ? (
              <Spinner size={14} />
            ) : mode === 'login' ? (
              <><LogIn size={14} /> Sign in</>
            ) : (
              <><Sparkles size={14} /> Create account</>
            )}
          </button>

          <p className="text-[11px] text-bazaar-ink3 text-center pt-1">
            By continuing you agree to Taka Bazaar's terms. ৳99 always, fair delivery.
          </p>
        </form>
      </div>
    </div>,
    document.body
  );
}

function prettyPath(p) {
  if (!p) return '';
  if (p.length > 32) return p.slice(0, 30) + '…';
  return p;
}