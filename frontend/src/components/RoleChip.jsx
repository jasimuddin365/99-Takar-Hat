// Compact role pill used in the topbar, profile, and login.
export default function RoleChip({ role, size = 'sm' }) {
  if (!role) return null;
  const cls =
    role === 'ADMIN'
      ? 'role-chip role-chip-admin'
      : role === 'VENDOR'
      ? 'role-chip role-chip-vendor'
      : 'role-chip role-chip-customer';
  const sizeCls = size === 'xs' ? 'text-[10px] px-2 py-[2px]' : '';
  return <span className={`${cls} ${sizeCls}`}>{role}</span>;
}