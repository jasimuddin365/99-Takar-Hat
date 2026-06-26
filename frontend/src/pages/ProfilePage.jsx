// Profile — view-only customer info (no backend PATCH endpoint exists).
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, Calendar, ShoppingBag, Heart } from 'lucide-react';
import RoleChip from '../components/RoleChip';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/format';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-[820px] mx-auto px-5 py-6 space-y-5">
      <header className="card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-bazaar-gold text-white flex items-center justify-center font-serif text-[24px] font-bold">
          {user.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-[22px] font-bold text-bazaar-ink">
              {user.name}
            </h1>
            <RoleChip role={user.role} />
          </div>
          <p className="text-[12.5px] text-bazaar-ink3">{user.email}</p>
        </div>
      </header>

      <section className="grid sm:grid-cols-2 gap-4">
        <InfoRow icon={<Mail size={14} />} label="Email" value={user.email} />
        <InfoRow
          icon={<ShieldCheck size={14} />}
          label="Role"
          value={user.role}
        />
        <InfoRow
          icon={<Calendar size={14} />}
          label="Joined"
          value={formatDate(user.createdAt) || '—'}
        />
        <InfoRow
          icon={<ShoppingBag size={14} />}
          label="Orders placed"
          value={user.orderCount ?? '—'}
        />
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/orders"
          className="card p-4 hover:border-bazaar-gold transition flex items-center gap-3"
        >
          <ShoppingBag size={18} className="text-bazaar-gold" />
          <div>
            <div className="text-[13px] font-semibold">My orders</div>
            <div className="text-[11.5px] text-bazaar-ink3">Track and review past purchases</div>
          </div>
        </Link>
        <Link
          to="/wishlist"
          className="card p-4 hover:border-bazaar-gold transition flex items-center gap-3"
        >
          <Heart size={18} className="text-bazaar-red" />
          <div>
            <div className="text-[13px] font-semibold">Wishlist</div>
            <div className="text-[11.5px] text-bazaar-ink3">Products you've saved for later</div>
          </div>
        </Link>
      </section>

      <footer className="text-center text-[11px] text-bazaar-ink3">
        Profile editing is read-only in this build.
      </footer>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-bazaar-bg2 flex items-center justify-center text-bazaar-gold mt-0.5">
        {icon}
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-bazaar-ink3">{label}</div>
        <div className="text-[13.5px] font-semibold text-bazaar-ink break-all">{value}</div>
      </div>
    </div>
  );
}