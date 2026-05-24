import { useState } from 'react';
import { apiClient } from '../config.js';

export function OnboardingModal({ isOpen, user, onOnboardingSuccess, isInline = false }) {
  const [formData, setFormData] = useState({
    name: user?.profile?.name || '',
    username: user?.profile?.username || '',
    qualification: user?.profile?.qualification || '',
    specialization: user?.profile?.specialization || '',
    hospital: user?.profile?.hospital || '',
    licenseNumber: user?.profile?.licenseNumber || '',
    phone: user?.profile?.phone || '',
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

  if (!isOpen && !isInline) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Full Name is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.patch('/api/auth/onboarding', formData);
      const data = response.data;
      if (data.success && data.data) {
        onOnboardingSuccess(data.data);
      } else {
        setError(data.message || 'Failed to complete profile onboarding.');
      }
    } catch (err) {
      console.error('Onboarding update error:', err);
      setError(err.response?.data?.message || 'Failed to save onboarding details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formCard = (
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-gray-100 flex flex-col p-8 animate-in fade-in zoom-in-95 duration-200">
      <h2 className="text-xl font-bold text-navy mb-1 text-left">Complete Your Profile</h2>
      <p className="text-xs text-gray-500 mb-6 text-left">
        Please fill in your professional details to set up your clinical scribe dashboard.
      </p>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-brand-light text-red-brand text-xs flex items-center gap-2 mb-4 border border-red-brand/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
        <div className="flex flex-col gap-1.5">
          <label className="block text-xs font-bold text-gray-600 mb-0.5">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Dr. John Doe"
            disabled={loading}
            required
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-bold text-gray-600 mb-0.5">Username (Optional)</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="drjohndoe"
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-bold text-gray-600 mb-0.5">Qualification</label>
            <input
              type="text"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              placeholder="MBBS, MD"
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-bold text-gray-600 mb-0.5">Specialization</label>
            <select
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
          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-bold text-gray-600 mb-0.5">Hospital/Clinic Name</label>
            <input
              type="text"
              name="hospital"
              value={formData.hospital}
              onChange={handleChange}
              placeholder="City General Hospital"
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-bold text-gray-600 mb-0.5">Medical License Number</label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="LIC12345"
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-bold text-gray-600 mb-0.5">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 XXXXX XXXXX"
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 inline-flex items-center justify-center px-4 py-3 bg-teal hover:bg-teal-dark text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving Details...' : 'Complete Registration'}
        </button>
      </form>
    </div>
  );

  if (isInline) {
    return formCard;
  }

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-xs">
      {formCard}
    </div>
  );
}
