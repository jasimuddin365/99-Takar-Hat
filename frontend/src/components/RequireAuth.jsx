// Route guards — RequireAuth + RequireRole.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner label="Checking your session…" />
      </div>
    );
  }
  if (status !== 'auth') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export function RequireRole({ roles, children }) {
  const { status, role } = useAuth();
  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner label="Checking your session…" />
      </div>
    );
  }
  if (status !== 'auth' || !roles.includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
