import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  }

  function handleGuest() {
    loginAsGuest();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🪐</span>
          <h1 className="text-3xl font-bold text-ink">Welcome back</h1>
          <p className="text-ink-muted mt-1">Sign in to your Planet</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-card shadow-sm border border-border p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-btn px-4 py-2">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-btn border border-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-cool-lavender/50 focus:border-cool-lavender transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-btn border border-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-cool-lavender/50 focus:border-cool-lavender transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-btn bg-ink text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleGuest}
            className="w-full py-2.5 rounded-btn border-2 border-dashed border-border text-ink-muted font-medium hover:border-cool-lavender hover:text-cool-lavender transition-colors cursor-pointer bg-transparent"
          >
            Use without an account
          </button>
        </div>

        <p className="text-center text-sm text-ink-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-cool-lavender font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
