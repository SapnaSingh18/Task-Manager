import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/projects', label: 'Projects', icon: '📁' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-brand">
        <div className="sidebar-logo">Task<span className="sidebar-logo-accent">Flow</span></div>
        <div className="sidebar-logo-sub">Team Manager</div>
      </div>
      <nav className="sidebar-nav">
        {links.map(link => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}>
            <span className="sidebar-link-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">© 2025 TaskFlow</div>

      <style>{`
        .sidebar {
          position:fixed; top:0; left:0; bottom:0; width:var(--sidebar-w);
          background:var(--bg-secondary); display:flex; flex-direction:column;
          z-index:200; border-right:1px solid var(--border-glass);
        }
        .sidebar-brand { padding:24px 20px; border-bottom:1px solid var(--border-glass); }
        .sidebar-logo { font-size:1.5rem; font-weight:900; letter-spacing:-0.03em; color:var(--text-primary); }
        .sidebar-logo-accent { background:linear-gradient(135deg,var(--accent),#8b5cf6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .sidebar-logo-sub { font-size:0.65rem; text-transform:uppercase; letter-spacing:0.15em; color:var(--text-muted); margin-top:2px; font-weight:500; }
        .sidebar-nav { padding:16px 12px; flex:1; display:flex; flex-direction:column; gap:4px; }
        .sidebar-link {
          display:flex; align-items:center; gap:12px; padding:12px 16px;
          font-size:0.85rem; font-weight:500; color:var(--text-muted);
          text-decoration:none; border-radius:var(--radius-sm);
          transition:all var(--transition);
        }
        .sidebar-link:hover { color:var(--text-primary); background:var(--bg-glass); }
        .sidebar-link--active {
          color:#fff; background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15));
          border:1px solid rgba(99,102,241,0.3); font-weight:600;
        }
        .sidebar-link-icon { font-size:1rem; }
        .sidebar-link:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
        .sidebar-footer { padding:16px 20px; border-top:1px solid var(--border-glass); font-size:0.7rem; color:var(--text-muted); }
      `}</style>
    </aside>
  );
}
