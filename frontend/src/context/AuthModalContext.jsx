// AuthModalContext — single shared controller for the sign-in modal.
// Any component can call `show({ from, title, runAfter })`.
//   - `from` is the path to navigate back to after successful auth (defaults to current location).
//   - `title` (optional) overrides the modal heading.
//   - `runAfter` (optional) is an async () => void that fires AFTER auth resolves,
//     so components can replay a queued action (e.g. retry addToCart).
// The provider mounts <AuthModal /> once at the app root.
//
// Typical usage:
//   const { isAuthed } = useAuth();
//   const { show } = useAuthModal();
//   async function onAddToCart() {
//     if (!isAuthed) {
//       show({ from: `/product/${id}`, runAfter: onAddToCart });
//       return;
//     }
//     await add(id, qty);
//   }
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AuthModal from '../components/AuthModal';

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(null);
  const [from, setFrom] = useState(null);

  // Stored in a ref so a queued action can be invoked without re-creating it.
  const runAfterRef = useRef(null);

  const show = useCallback(({ from: fromArg, title: titleArg, runAfter } = {}) => {
    setFrom(fromArg ?? location.pathname + location.search);
    setTitle(titleArg || null);
    runAfterRef.current = typeof runAfter === 'function' ? runAfter : null;
    setOpen(true);
  }, [location.pathname, location.search]);

  const hide = useCallback(() => {
    setOpen(false);
    runAfterRef.current = null;
  }, []);

  // Called by <AuthModal /> after a successful login/register.
  const handleSuccess = useCallback(async () => {
    const fn = runAfterRef.current;
    runAfterRef.current = null;
    setOpen(false);
    if (fn) {
      try { await fn(); } catch (err) { console.warn('[auth-modal] runAfter failed', err); }
    }
  }, []);

  // Esc closes the modal (cancel, not success).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') hide(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hide]);

  const value = useMemo(
    () => ({ open, from, title, show, hide }),
    [open, from, title, show, hide]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal open={open} title={title} from={from} onClose={hide} onSuccess={handleSuccess} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used inside <AuthModalProvider>');
  return ctx;
}