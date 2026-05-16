import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/projects') return 'Projects';
    if (path.startsWith('/projects/') && path.includes('/team')) return 'Team';
    if (path.startsWith('/projects/')) return 'Project';
    return '';
  };

  return (
    <nav className="navbar" role="banner">
      <span className="navbar-title">{getPageTitle()}</span>
      <div className="navbar-right">
        <div className="navbar-user">
          <div className="avatar avatar-sm">{user?.name?.charAt(0).toUpperCase()}</div>
          <span className="navbar-name">{user?.name}</span>
        </div>
        <button onClick={logout} className="btn btn-secondary btn-sm" aria-label="Sign out">
          Sign Out
        </button>
      </div>

      <style>{`
        .navbar {
          position:fixed; top:0; right:0; left:var(--sidebar-w);
          height:var(--navbar-h); background:rgba(11,15,25,0.85);
          backdrop-filter:blur(16px); border-bottom:1px solid var(--border-glass);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 32px; z-index:100;
        }
        .navbar-title { font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-muted); }
        .navbar-right { display:flex; align-items:center; gap:16px; }
        .navbar-user { display:flex; align-items:center; gap:10px; }
        .navbar-name { font-size:0.85rem; font-weight:500; color:var(--text-primary); }
      `}</style>
    </nav>
  );
}
