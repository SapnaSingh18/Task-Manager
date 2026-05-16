import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
