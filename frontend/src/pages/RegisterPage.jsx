import { useState } from 'react';
import { apiClient } from '../config.js';

export function RegisterPage({ onNavigate, onRegisterSuccess }) {
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

    // Validations
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

  return (
    <div className="min-h-screen bg-warm-white flex flex-col items-center justify-center p-6 text-center">
      <div className="font-serif text-[32px] text-navy tracking-[0.5px] cursor-pointer mb-6 select-none" onClick={() => onNavigate('landing')}>
        Qa<span className="text-teal">lam</span>
      </div>

      <div className="w-full max-w-2xl bg-white border border-gray-200/60 rounded-2xl p-8 shadow-xs flex flex-col gap-4 text-left">
        <h2 className="text-xl font-bold text-navy text-left">Create Doctor Account</h2>
        <p className="text-xs text-gray-500 text-left -mt-2.5 mb-2">Get started with your clinical assistant</p>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-brand-light text-red-brand text-xs flex items-center gap-2 mb-2 border border-red-brand/10 text-left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-teal-dark border-b border-gray-100 pb-2 mb-1">Login Credentials</h3>
            
            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="name" className="text-xs font-bold text-gray-600">Full Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Dr. John Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="email" className="text-xs font-bold text-gray-600">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="dr.name@hospital.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="username" className="text-xs font-bold text-gray-600">Username (Optional)</label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="drjohndoe"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="password" className="text-xs font-bold text-gray-600">Password *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="confirmPassword" className="text-xs font-bold text-gray-600">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-teal-dark border-b border-gray-100 pb-2 mb-1">Professional Profile</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="qualification" className="text-xs font-bold text-gray-600">Qualification</label>
                <input
                  id="qualification"
                  name="qualification"
                  type="text"
                  placeholder="MBBS, MD"
                  value={formData.qualification}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="specialization" className="text-xs font-bold text-gray-600">Specialization</label>
                <select
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all h-[42px]"
                >
                  <option value="">Select Specialization</option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="hospital" className="text-xs font-bold text-gray-600">Hospital/Clinic Name</label>
              <input
                id="hospital"
                name="hospital"
                type="text"
                placeholder="City General Hospital"
                value={formData.hospital}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="licenseNumber" className="text-xs font-bold text-gray-600">Medical License #</label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  placeholder="LIC12345"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="phone" className="text-xs font-bold text-gray-600">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-center mt-4">
            <button type="submit" className="w-full md:w-1/2 inline-flex items-center justify-center px-4 py-3 bg-teal hover:bg-teal-dark text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer border-none shadow-xs disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
              {loading ? (
                <span className="animate-spin border-2 border-navy border-t-transparent rounded-full w-4 h-4"></span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <p className="md:col-span-2 text-xs text-gray-500 text-center mt-2">
          Already have an account?{' '}
          <span className="text-teal-dark hover:text-teal font-semibold cursor-pointer underline ml-0.5" onClick={() => onNavigate('login')}>
            Sign In here
          </span>
        </p>
      </div>
    </div>
  );
}
