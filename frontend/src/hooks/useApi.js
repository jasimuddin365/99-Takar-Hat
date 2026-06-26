// useApi — wrap a fetcher with loading/error/retry semantics so every page
// can render a consistent error UI instead of silently failing.
//
// Usage:
//   const { data, loading, error, refetch } = useApi(
//     () => api.get('/products').then((r) => r.data.products),
//     [cat, vendor, q]
//   );
//
//   if (error) return <ApiError error={error} onRetry={refetch} />;
//
// We intentionally do NOT throw inside the fetcher; instead we normalise the
// axios error into `{ message, status }` so consumers can branch on it.

import { useCallback, useEffect, useRef, useState } from 'react';

export function normalizeError(err) {
  if (!err) return { message: 'Unknown error', status: 0 };
  if (err.response) {
    return {
      message:
        err.response.data?.message ||
        err.response.data?.error ||
        `Request failed (${err.response.status})`,
      status: err.response.status,
    };
  }
  if (err.request) {
    return { message: 'Network error — is the backend running on :5000?', status: 0 };
  }
  return { message: err.message || 'Unexpected error', status: 0 };
}

export default function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.resolve()
      .then(() => fetcher())
      .then((value) => {
        if (alive && aliveRef.current) setData(value ?? null);
      })
      .catch((err) => {
        if (alive && aliveRef.current) setError(normalizeError(err));
      })
      .finally(() => {
        if (alive && aliveRef.current) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, refetch, setData };
}
