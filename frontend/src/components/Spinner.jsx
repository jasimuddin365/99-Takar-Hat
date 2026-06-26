// Loading spinner used across pages.
export default function Spinner({ size = 22, label }) {
  return (
    <div className="flex items-center gap-2 text-bazaar-ink3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className="animate-spin text-bazaar-gold"
        fill="none"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="text-[12.5px]">{label}</span>}
    </div>
  );
}