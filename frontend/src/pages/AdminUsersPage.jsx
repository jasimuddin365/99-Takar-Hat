// Admin user directory. Filter by role + active, search by name/email,
// change role or suspend/restore.
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Search,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import RoleChip from '../components/RoleChip';
import Spinner from '../components/Spinner';

const ROLES = ['CUSTOMER', 'VENDOR', 'ADMIN'];
const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Suspended' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const [busy, setBusy] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/admin/users', { params: { q, role, active } })
      .then((r) => setUsers(r.data.users || []))
      .catch((err) => toast.error(err.message || 'Could not load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, role, active]);

  const counts = useMemo(() => {
    const c = { all: 0, active: 0, inactive: 0 };
    for (const u of users) {
      c.all += 1;
      if (u.isActive) c.active += 1;
      else c.inactive += 1;
    }
    return c;
  }, [users]);

  const onRoleChange = async (u, newRole) => {
    if (newRole === u.role) return;
    if (!confirm(`Change ${u.name}'s role from ${u.role} → ${newRole}?`)) return;
    setBusy(u.id);
    try {
      const r = await api.patch(`/admin/users/${u.id}`, { role: newRole });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...r.data } : x)));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setBusy('');
    }
  };

  const onToggleActive = async (u) => {
    setBusy(u.id);
    try {
      const r = await api.patch(`/admin/users/${u.id}`, { isActive: !u.isActive });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...r.data } : x)));
      toast.success(u.isActive ? `${u.name} suspended` : `${u.name} reactivated`);
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
          <h1 className="font-serif text-[26px] font-bold text-bazaar-ink">Users</h1>
          <p className="text-[12.5px] text-bazaar-ink3">
            {users.length} {users.length === 1 ? 'user' : 'users'} match your filters.
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="card p-3 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bazaar-ink3"
            />
            <input
              className="form-input pl-8 py-1.5 text-[12.5px]"
              placeholder="Search by name or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {FILTER_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() =>
                  setActive(t.key === 'all' ? '' : t.key === 'active' ? 'true' : 'false')
                }
                className={`chip ${active === (t.key === 'all' ? '' : t.key === 'active' ? 'true' : 'false') ? 'chip-gold' : 'chip-gray'} cursor-pointer`}
              >
                {t.label} · {counts[t.key] || 0}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setRole('')}
            className={`chip ${role === '' ? 'chip-gold' : 'chip-gray'} cursor-pointer`}
          >
            All roles
          </button>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`chip ${role === r ? 'chip-gold' : 'chip-gray'} cursor-pointer`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <Spinner label="Loading users…" />
      ) : users.length === 0 ? (
        <div className="card p-10 text-center text-[12.5px] text-bazaar-ink3">
          <Users size={28} className="mx-auto mb-2 text-bazaar-border" />
          No users match.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead className="bg-bazaar-bg2 text-[10.5px] uppercase tracking-wide text-bazaar-ink3">
              <tr>
                <th className="text-left py-2.5 px-3">User</th>
                <th className="text-left py-2.5 px-3">Role</th>
                <th className="text-right py-2.5 px-3">Orders</th>
                <th className="text-left py-2.5 px-3">Joined</th>
                <th className="text-center py-2.5 px-3">Status</th>
                <th className="text-right py-2.5 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-bazaar-border">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-bazaar-gold-l/40 text-bazaar-gold font-bold flex items-center justify-center text-[13px]">
                        {u.name?.[0]?.toUpperCase() || '?'}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{u.name}</div>
                        <div className="text-[10.5px] text-bazaar-ink3 truncate">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <select
                      value={u.role}
                      onChange={(e) => onRoleChange(u, e.target.value)}
                      disabled={busy === u.id}
                      className="form-select py-1 text-[12px] max-w-[140px]"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-semibold">{u.orderCount || 0}</span>
                  </td>
                  <td className="py-2.5 px-3 text-bazaar-ink3">
                    {u.joined ? new Date(u.joined).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {u.isActive ? (
                      <span className="chip chip-green">Active</span>
                    ) : (
                      <span className="chip chip-red">Suspended</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onToggleActive(u)}
                      disabled={busy === u.id}
                      className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                    >
                      {u.isActive ? (
                        <>
                          <UserX size={12} /> Suspend
                        </>
                      ) : (
                        <>
                          <UserCheck size={12} /> Restore
                        </>
                      )}
                    </button>
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