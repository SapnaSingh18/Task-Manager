import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';

export default function Team() {
  const { id } = useParams();
  const [members, setMembers] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [myRole, setMyRole] = useState(null);

  const load = () => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/members`),
    ]).then(([pRes, mRes]) => {
      setProject(pRes.data.project);
      setMyRole(pRes.data.project.my_role);
      setMembers(mRes.data.members);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const isAdmin = myRole === 'admin';

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/projects/${id}/members`, { email, role });
      setShowModal(false);
      setEmail('');
      setRole('member');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/projects/${id}/members/${userId}`, { role: newRole });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  if (loading) {
    return <div className="page-container"><div className="skeleton" style={{ height: 300 }} /></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{project?.name} — {members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to={`/projects/${id}`} className="btn btn-secondary">← Back to Project</Link>
          {isAdmin && (
            <button id="add-member-btn" className="btn btn-primary" onClick={() => { setError(''); setShowModal(true); }}>
              + Add Member
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member</th><th>Email</th><th>Role</th>{isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar avatar-sm">{m.user?.name?.charAt(0)}</div>
                      <span style={{ fontWeight: 600 }}>{m.user?.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.user?.email}</td>
                  <td><span className={`badge badge-${m.role}`}>{m.role}</span></td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select className="form-select" style={{ width: 'auto', padding: '4px 8px', fontSize: '0.7rem' }}
                          value={m.role} onChange={e => handleRoleChange(m.user_id, e.target.value)}
                          aria-label={`Change role for ${m.user?.name}`}>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m.user_id)}
                          aria-label={`Remove ${m.user?.name}`}>
                          Remove
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Member"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? 'Adding...' : 'Add'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label className="form-label" htmlFor="member-email-input">Email Address</label>
            <input id="member-email-input" type="email" className="form-input" placeholder="colleague@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="member-role-select">Role</label>
            <select id="member-role-select" className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
