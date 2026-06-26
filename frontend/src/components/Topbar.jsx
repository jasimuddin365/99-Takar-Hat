// Top navigation — logo, search, role-aware links, cart button.
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, LogOut, User as UserIcon, Store, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAuthModal } from '../context/AuthModalContext';
import { initials } from '../lib/format';
import RoleChip from './RoleChip';

export default function Topbar() {
  const { user, role, isAuthed, logout } = useAuth();
  const { pricing, openDrawer } = useCart();
  const { show } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();

  // For guest actions we deep-link back to where they were when they auth.
  const guestFrom = location.pathname + location.search;

  const navClass = ({ isActive }) =>
    `px-3 py-2 text-[13px] font-semibold tracking-[0.2px] rounded transition-colors ${
      isActive
        ? 'text-bazaar-gold bg-bazaar-gold-l/40'
        : 'text-bazaar-ink2 hover:text-bazaar-gold hover:bg-bazaar-bg'
    }`;

  function customerLinks() {
    return (
      <>
        <NavLink to="/" end className={navClass}>Home</NavLink>
        <NavLink to="/browse" className={navClass}>Browse</NavLink>
        <NavLink to="/stalls" className={navClass}>Stalls</NavLink>
        <NavLink to="/orders" className={navClass}>Orders</NavLink>
        <NavLink to="/wishlist" className={navClass}>Wishlist</NavLink>
      </>
    );
  }

  function vendorLinks() {
    return (
      <>
        <NavLink to="/vendor" end className={navClass}>Dashboard</NavLink>
        <NavLink to="/vendor/stall" className={navClass}>My Stall</NavLink>
        <NavLink to="/vendor/products" className={navClass}>Products</NavLink>
        <NavLink to="/vendor/orders" className={navClass}>Orders</NavLink>
      </>
    );
  }

  function adminLinks() {
    return (
      <>
        <NavLink to="/admin" end className={navClass}>Dashboard</NavLink>
        <NavLink to="/admin/analytics" className={navClass}>Analytics</NavLink>
        <NavLink to="/admin/users" className={navClass}>Users</NavLink>
        <NavLink to="/admin/vendors" className={navClass}>Vendors</NavLink>
        <NavLink to="/admin/products" className={navClass}>Products</NavLink>
        <NavLink to="/admin/orders" className={navClass}>Orders</NavLink>
        <NavLink to="/admin/categories" className={navClass}>Categories</NavLink>
      </>
    );
  }

  function goHome() {
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'VENDOR') navigate('/vendor');
    else navigate('/');
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-bazaar-border shadow-soft">
      <div className="max-w-[1240px] mx-auto flex items-center gap-4 px-5 py-3">
        <button
          onClick={goHome}
          className="flex items-center gap-2 group"
          aria-label="99 Taka Bazaar home"
        >
          <span className="w-9 h-9 rounded-full bg-bazaar-gold text-bazaar-ink flex items-center justify-center font-serif text-[16px] font-bold shadow-soft">
            ৯৯
          </span>
          <span className="font-serif text-[18px] font-bold text-bazaar-ink leading-tight tracking-[0.4px]">
            Taka Bazaar
            <span className="block text-[10.5px] font-sans font-medium text-bazaar-ink3 -mt-[2px] tracking-[0.6px]">
              Everything ৳99
            </span>
          </span>
        </button>

        <button
          onClick={() => navigate('/browse')}
          className="flex-1 max-w-[420px] mx-2 hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-bazaar-bg border-[1.5px] border-bazaar-border text-[13px] text-bazaar-ink3 hover:border-bazaar-gold transition-colors"
        >
          <Search size={15} className="text-bazaar-ink3" />
          <span>Search products, vendors, categories…</span>
        </button>

        <nav className="hidden lg:flex items-center gap-1">
          {role === 'ADMIN' ? adminLinks() : role === 'VENDOR' ? vendorLinks() : customerLinks()}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          {role === 'CUSTOMER' || role === 'ADMIN' ? (
            <button
              onClick={() => {
                if (!isAuthed) {
                  show({
                    from: guestFrom,
                    title: 'Sign in to view your cart',
                    runAfter: openDrawer,
                  });
                  return;
                }
                openDrawer();
              }}
              className="relative p-2 rounded hover:bg-bazaar-bg transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCart size={20} className="text-bazaar-ink2" />
              {isAuthed && pricing.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-bazaar-red text-white text-[10.5px] font-bold flex items-center justify-center">
                  {pricing.itemCount}
                </span>
              )}
            </button>
          ) : null}

          {isAuthed ? (
            <div className="flex items-center gap-2 pl-2 border-l border-bazaar-border">
              <div className="hidden md:flex flex-col items-end leading-tight">
                <span className="text-[12.5px] font-semibold text-bazaar-ink">
                  {user?.name || 'Account'}
                </span>
                <span className="flex items-center gap-1 text-[10.5px] text-bazaar-ink3">
                  {role === 'VENDOR' ? (
                    <Store size={11} />
                  ) : role === 'ADMIN' ? (
                    <ShieldCheck size={11} />
                  ) : (
                    <UserIcon size={11} />
                  )}
                  <RoleChip role={role} size="xs" />
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-bazaar-gold text-bazaar-ink flex items-center justify-center text-[11px] font-bold">
                {initials(user?.name)}
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="p-2 rounded hover:bg-bazaar-bg transition-colors"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={16} className="text-bazaar-ink2" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => show({ from: guestFrom, title: 'Welcome back' })}
              className="btn btn-primary btn-sm"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}