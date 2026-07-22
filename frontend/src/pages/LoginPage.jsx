import { useState, useEffect } from 'react';
import { apiClient, API_BASE_URL } from '../config.js';

export function LoginPage({ onNavigate, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'google_not_configured') {
      setError('Google Sign-In is not configured on the server. Please register/login with your email instead.');
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (err) {
      setError(decodeURIComponent(err));
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      const data = response.data;
      if (data.success && data.data) {
        localStorage.setItem('token', data.data.token);
        onLoginSuccess(data.data.user);
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col items-center justify-center p-6 text-center select-none">

      {/* Brand Header */}
      <div
        className="flex items-center gap-2 select-none cursor-pointer mb-8 hover:opacity-80 transition-opacity"
        onClick={() => onNavigate('landing')}
      >
        <span className="font-sans text-2xl font-black tracking-tighter text-slate-900 uppercase">
          Scribologist
        </span>
      </div>

      {/* Main Form Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col gap-5 text-left">
        <div>
          <h1
            className="text-3xl sm:text-4xl font-normal text-[#22252a] tracking-tight leading-tight mb-2"
            style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}
          >
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans">
            Sign in to access your ambient AI scribe & EHR workspace.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center w-full my-1">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-3 text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">OR EMAIL SIGN IN</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
              Work Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="dr.name@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#22252a] hover:bg-[#1a1c20] text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2 border-none"
          >
            {loading ? (
              <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
            ) : (
              'Sign In to Workspace ✦'
            )}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-1 text-center">
          Need access to Scribologist?{' '}
          <span
            className="text-slate-900 font-bold hover:underline cursor-pointer ml-0.5"
            onClick={() => onNavigate('book-demo')}
          >
            Book a demo here
          </span>
        </p>
      </div>
    </div>
  );
}
