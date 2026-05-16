import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/projects/').then(res => setProjects(res.data.projects))
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/projects/', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="grid grid-3">
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 180 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <p className="empty-state-text">No Projects Yet</p>
          <p className="empty-state-sub">Create your first project to begin</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {projects.map(p => (
            <Link to={`/projects/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ height: '100%' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{p.name}</h3>
                    <span className={`badge badge-${p.my_role}`}>{p.my_role}</span>
                  </div>
                  {p.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.5 }}>
                      {p.description.length > 100 ? p.description.slice(0, 100) + '...' : p.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 20, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, borderTop: '1px solid var(--border-glass)', paddingTop: 12 }}>
                    <span>👥 {p.member_count}</span>
                    <span>📋 {p.task_count}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Project"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label" htmlFor="project-name-input">Project Name</label>
            <input id="project-name-input" className="form-input" placeholder="Enter project name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="project-desc">Description</label>
            <textarea id="project-desc" className="form-textarea" placeholder="Brief description"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
