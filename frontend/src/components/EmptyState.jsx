// Reusable empty-state placeholder.
export default function EmptyState({ icon = '🛍️', title, hint, action }) {
  return (
    <div className="card text-center py-10 px-6">
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="font-serif text-[17px] font-bold text-bazaar-ink">{title}</h3>
      {hint && <p className="text-[13px] text-bazaar-ink3 mt-1">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}