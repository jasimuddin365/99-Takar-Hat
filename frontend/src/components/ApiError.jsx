// ApiError — render a friendly error panel with a retry button. Used by every
// page that does a primary data fetch.
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ApiError({ error, onRetry, hint }) {
  const message = error?.message || 'Something went wrong.';
  const isNetwork = error?.status === 0;
  return (
    <div className="card p-5 my-4 border-l-4 border-bazaar-red bg-red-50/50 max-w-[640px]">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-bazaar-red shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[14px] text-bazaar-ink mb-1">
            {isNetwork ? 'Cannot reach the server' : 'Could not load data'}
          </h3>
          <p className="text-[12.5px] text-bazaar-ink2 break-words">{message}</p>
          {hint && (
            <p className="text-[11.5px] text-bazaar-ink3 mt-1.5">{hint}</p>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="btn btn-secondary btn-sm mt-3"
            >
              <RefreshCw size={12} /> Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
