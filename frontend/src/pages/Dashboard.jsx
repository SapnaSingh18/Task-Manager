import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function Ring({ percent, size = 120, stroke = 8, color = 'var(--accent)' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-glass)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 800ms ease' }} />
    </svg>
  );
}

function MiniBar({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: 90 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-glass)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 600ms ease' }} />
      </div>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 28, textAlign: 'right', color }}>{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/').then(res => setData(res.data))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
      </div>
    );
  }

  if (!data) return <div className="page-container"><p>Failed to load dashboard.</p></div>;

  const { stats, my_tasks, overdue_tasks, projects } = data;
  const completionPct = stats.total_tasks > 0 ? Math.round((stats.done / stats.total_tasks) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-container">
      {/* ── Welcome Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 50%, rgba(6,182,212,0.06) 100%)',
        border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-xl)',
        padding: '36px 40px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {stats.total_tasks === 0
              ? 'You have no tasks yet. Create a project to get started!'
              : `You have ${stats.total_tasks - stats.done} task${stats.total_tasks - stats.done !== 1 ? 's' : ''} remaining across ${stats.total_projects} project${stats.total_projects !== 1 ? 's' : ''}.`
            }
          </p>
        </div>
        <Link to="/projects" className="btn btn-primary" style={{ flexShrink: 0 }}>View Projects →</Link>
      </div>

      {/* ── Top Row: Completion Ring + Quick Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 24 }}>
        {/* Completion Ring */}
        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px' }}>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Ring percent={completionPct} size={130} stroke={10} color="var(--green)" />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', transform: 'rotate(0deg)',
              }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>{completionPct}%</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>Complete</span>
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {stats.done} of {stats.total_tasks} tasks done
            </span>
          </div>
        </div>

        {/* Quick Stat Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Projects', value: stats.total_projects, icon: '📂', gradient: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))' },
            { label: 'In Progress', value: stats.in_progress, icon: '🔄', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.06))' },
            { label: 'Overdue', value: stats.overdue, icon: '🔥', gradient: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(249,115,22,0.06))', danger: stats.overdue > 0 },
          ].map(s => (
            <div key={s.label} className="card" style={{ background: s.gradient, borderColor: s.danger ? 'rgba(239,68,68,0.3)' : undefined }}>
              <div className="card-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, marginBottom: 4, color: s.danger ? 'var(--red)' : 'var(--text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
          {/* My Assigned */}
          <div className="card" style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(34,197,94,0.05))' }}>
            <div className="card-body" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 12 }}>My Assigned Tasks</div>
              <div style={{ display: 'flex', gap: 24 }}>
                {[
                  { label: 'To Do', val: my_tasks.todo, color: 'var(--accent-light)' },
                  { label: 'Active', val: my_tasks.in_progress, color: 'var(--amber)' },
                  { label: 'Done', val: my_tasks.done, color: 'var(--green)' },
                ].map(t => (
                  <div key={t.label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: t.color }}>{t.val}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle: Task Distribution + Overdue ── */}
      <div style={{ display: 'grid', gridTemplateColumns: overdue_tasks.length > 0 ? '1fr 1fr' : '1fr', gap: 20, marginBottom: 24 }}>
        {/* Task Distribution */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Task Distribution</h3>
            {stats.total_tasks > 0 ? (
              <>
                <MiniBar label="To Do" value={stats.todo} total={stats.total_tasks} color="var(--accent-light)" />
                <MiniBar label="In Progress" value={stats.in_progress} total={stats.total_tasks} color="var(--amber)" />
                <MiniBar label="Completed" value={stats.done} total={stats.total_tasks} color="var(--green)" />
                {stats.overdue > 0 && <MiniBar label="Overdue" value={stats.overdue} total={stats.total_tasks} color="var(--red)" />}
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>No tasks to display yet</p>
            )}
          </div>
        </div>

        {/* Overdue Alerts */}
        {overdue_tasks.length > 0 && (
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.25)' }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--red)' }}>⚠ Overdue</h3>
                <span className="badge badge-high">{overdue_tasks.length} task{overdue_tasks.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {overdue_tasks.slice(0, 5).map(t => (
                  <div key={t.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(239,68,68,0.12)', fontSize: '0.82rem',
                  }}>
                    <span style={{ fontWeight: 600, flex: 1, marginRight: 12 }}>{t.title}</span>
                    <span style={{ color: 'var(--red)', fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>Due {t.due_date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom: Project Cards ── */}
      {projects.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Your Projects</h3>
            <Link to="/projects" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {projects.map(p => {
              const pct = p.total_tasks > 0 ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0;
              return (
                <Link to={`/projects/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ height: '100%' }}>
                    <div className="card-body" style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</h4>
                        <span className={`badge badge-${p.my_role}`}>{p.my_role}</span>
                      </div>
                      {/* Mini Progress */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                          <span>{p.done_tasks}/{p.total_tasks} tasks</span>
                          <span style={{ fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--text-secondary)' }}>{pct}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      {/* Footer Stats */}
                      <div style={{ display: 'flex', gap: 16, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {p.overdue_tasks > 0 && (
                          <span style={{ color: 'var(--red)', fontWeight: 600 }}>🔥 {p.overdue_tasks} overdue</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
