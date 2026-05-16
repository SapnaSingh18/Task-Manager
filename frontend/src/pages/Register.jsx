import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Begin organizing your team's work</p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">Full Name</label>
            <input id="register-name" type="text" className="form-input" placeholder="Jane Doe"
              value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Email</label>
            <input id="register-email" type="email" className="form-input" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="register-password">Password</label>
            <input id="register-password" type="password" className="form-input" placeholder="Min 6 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
          </div>
          <button id="register-submit" type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
