import { useState, useEffect } from 'react';
import { apiClient } from '../config.js';

export function RegisterPage({ onNavigate, onRegisterSuccess }) {
  const [inviteToken, setInviteToken] = useState('');
  const [inviteValid, setInviteValid] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    hospital: '',
    specialization: '',
    licenseNumber: '',
    qualification: '',
    phone: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check URL query parameters for invite token (e.g. /register?invite=INV-CODE or ?invite=true)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');

    if (token) {
      setInviteToken(token);
      setInviteValid(true);
      setCheckingInvite(false);
    } else {
      // No invite token provided — registration is locked. Redirect to Book Demo page after brief notice.
      setInviteValid(false);
      setCheckingInvite(false);
    }
  }, []);

  const specializations = [
    'General Practice',
    'Cardiology',
    'Orthopedics',
    'Pediatrics',
    'Dermatology',
    'ENT',
    'Ophthalmology',
    'Psychiatry',
    'Internal Medicine',
    'Obstetrics & Gynecology',
    'Surgery',
    'Other',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, email, and password are required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        username: formData.username || undefined,
        password: formData.password,
        hospital: formData.hospital,
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        qualification: formData.qualification,
        phone: formData.phone,
        inviteToken: inviteToken || undefined,
      };

      const response = await apiClient.post('/api/auth/register', payload);
      const data = response.data;
      if (data.success && data.data) {
        localStorage.setItem('token', data.data.token);
        onRegisterSuccess(data.data.user);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingInvite) {
    return (
      <div className="min-h-screen bg-[#fafafc] flex items-center justify-center p-6">
        <div className="animate-spin border-2 border-[#22252a] border-t-transparent rounded-full w-6 h-6" />
      </div>
    );
  }

  // Locked View if user accesses /register without a valid ?invite= token
  if (!inviteValid) {
    return (
      <div className="min-h-screen bg-[#fafafc] flex flex-col items-center justify-center p-6 text-center select-none">
        <div
          className="flex items-center gap-2 select-none cursor-pointer mb-8"
          onClick={() => onNavigate('landing')}
        >
          <span className="font-sans text-2xl font-black tracking-tighter text-slate-900 uppercase">
            Scribologist
          </span>
        </div>

        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col gap-6 items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 text-2xl">
            🔒
          </div>

          <div className="flex flex-col gap-2">
            <h1
              className="text-2xl sm:text-3xl font-normal text-[#22252a] tracking-tight"
              style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}
            >
              Private Invite Required
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
              Registration for Scribologist is strictly invite-only for verified clinic networks & doctors. Please book a demo to receive your private activation link.
            </p>
          </div>

          <button
            onClick={() => onNavigate('book-demo')}
            className="w-full py-3.5 bg-[#22252a] hover:bg-[#1a1c20] text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md border-none"
          >
            Book a Demo to Request Access ✦
          </button>

          <span
            className="text-xs text-slate-400 font-medium hover:text-slate-600 cursor-pointer"
            onClick={() => onNavigate('login')}
          >
            Already registered? Sign in here
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col items-center justify-center p-6 text-center select-none py-12">

      {/* Brand Header */}
      <div
        className="flex items-center gap-2 select-none cursor-pointer mb-8 hover:opacity-80 transition-opacity"
        onClick={() => onNavigate('landing')}
      >
        <span className="font-sans text-2xl font-black tracking-tighter text-slate-900 uppercase">
          Scribologist
        </span>
      </div>

      {/* Main Registration Card */}
      <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col gap-6 text-left">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono text-[10px] font-bold uppercase tracking-wider">
              ✓ Verified Invite Pass ({inviteToken.slice(0, 12)})
            </span>
          </div>

          <h1
            className="text-3xl sm:text-4xl font-normal text-[#22252a] tracking-tight leading-tight mb-2"
            style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}
          >
            Complete Your Clinic Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans">
            Set up your credentials to activate ambient AI clinical transcription and SOAP note drafting.
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

          {/* Account Details Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Account & Security
            </h3>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Dr. John Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                Work Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="dr.name@hospital.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          {/* Clinical Profile Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Clinical Profile
            </h3>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="hospital" className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                Clinic / Hospital Name
              </label>
              <input
                id="hospital"
                name="hospital"
                type="text"
                placeholder="Apex Multispecialty Hospital"
                value={formData.hospital}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="specialization" className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                Specialization
              </label>
              <select
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900"
              >
                <option value="">Select Specialization...</option>
                {specializations.map((spec, i) => (
                  <option key={i} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="licenseNumber" className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                Medical Registration / License No.
              </label>
              <input
                id="licenseNumber"
                name="licenseNumber"
                type="text"
                placeholder="MCI-2024-84920"
                value={formData.licenseNumber}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                Contact Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#22252a] hover:bg-[#1a1c20] text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              {loading ? (
                <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
              ) : (
                'Activate Account & Access Workspace ✦'
              )}
            </button>
          </div>
        </form>

        <p className="text-xs text-slate-500 mt-1 text-center">
          Already registered?{' '}
          <span
            className="text-slate-900 font-bold hover:underline cursor-pointer ml-0.5"
            onClick={() => onNavigate('login')}
          >
            Sign in here
          </span>
        </p>
      </div>
    </div>
  );
}
