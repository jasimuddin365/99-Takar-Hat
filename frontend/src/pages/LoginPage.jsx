// Login / Register — single screen with a mode toggle.
// On success, the AuthContext updates and the router's <Root /> handles the
// role-based redirect (/admin, /vendor, /home).
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function LoginPage() {
  const { user, status, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [busy, setBusy] = useState(false);

  const {
    register: rf,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: { name: '', email: '', password: '', role: 'CUSTOMER' },
  });

  // If already authenticated, push to the role landing.
  useEffect(() => {
    if (status === 'auth' && user) {
      const to = location.state?.from || defaultLanding(user.role);
      navigate(to, { replace: true });
    }
  }, [status, user, location.state, navigate]);

  function defaultLanding(role) {
    if (role === 'ADMIN') return '/admin';
    if (role === 'VENDOR') return '/vendor';
    return '/';
  }

  function switchMode(next) {
    setMode(next);
    reset({ name: '', email: '', password: '', role: 'CUSTOMER' });
  }

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
      // The useEffect above handles the redirect once `user` resolves.
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bazaar-bg flex items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-10 h-10 rounded-full bg-bazaar-gold text-bazaar-ink flex items-center justify-center font-serif text-[18px] font-bold shadow-soft">
              ৯৯
            </span>
            <span className="font-serif text-[22px] font-bold text-bazaar-ink">
              Taka Bazaar
            </span>
          </div>
          <p className="text-[13px] text-bazaar-ink3">
            Everything ৳99 — smart pricing, free delivery on 3+ items.
          </p>
        </div>

        <div className="card p-7">
          <div className="flex items-center bg-bazaar-bg2 rounded-lg p-1 mb-5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-bazaar-ink shadow-soft'
                  : 'text-bazaar-ink3 hover:text-bazaar-ink'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-white text-bazaar-ink shadow-soft'
                  : 'text-bazaar-ink3 hover:text-bazaar-ink'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Your name"
                  {...rf('name', { required: 'Name is required' })}
                />
                {errors.name && (
                  <p className="text-[11.5px] text-bazaar-red mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                {...rf('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && (
                <p className="text-[11.5px] text-bazaar-red mt-1">
                  {errors.email.message}
                </p>
              )}
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
              {errors.password && (
                <p className="text-[11.5px] text-bazaar-red mt-1">
                  {errors.password.message}
                </p>
              )}
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
              className="btn btn-primary w-full justify-center mt-2"
            >
              {busy ? (
                <Spinner size={14} />
              ) : mode === 'login' ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11.5px] text-bazaar-ink3 mt-4">
          <Link to="/browse" className="hover:underline">
            Just browse as guest →
          </Link>
        </p>
      </div>
    </div>
  );
}