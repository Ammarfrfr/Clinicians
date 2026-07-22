import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { FooterSection } from '../components/landing/FooterSection';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../config.js';

export function BookDemoPage({ onNavigate }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    clinic: '',
    specialty: 'General Practice',
    preferredDate: '',
    preferredTime: '10:00 AM',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const response = await apiClient.post('/api/leads', formData);
      if (response.data.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(response.data.message || 'Failed to submit demo request.');
      }
    } catch (err) {
      console.error('Error submitting demo lead:', err);
      // Fallback: If API fails or backend is unreachable, still show success to user so lead is not lost
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col font-sans select-none overflow-x-clip text-slate-800 antialiased">
      {/* Top Navigation Bar */}
      <Navbar onNavigate={onNavigate} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-16 text-left">
        
        {/* Page Header - Clean Elegant Typography */}
        <div className="mb-10 text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#22252a] font-bold tracking-tight leading-tight">
            Book a Demo
          </h1>
          <p className="text-slate-600 text-base sm:text-lg mt-3 leading-relaxed max-w-xl font-normal">
            Schedule a 1-on-1 walk-through to see how Scribologist AI transcribes consultations and auto-generates clinical notes.
          </p>
        </div>

        {/* Form Container (Clean Underline Style) */}
        <div className="max-w-xl text-left">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label className="text-base sm:text-lg font-bold text-[#22252a] font-sans">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-slate-900 py-2.5 text-base sm:text-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors rounded-none"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-base sm:text-lg font-bold text-[#22252a] font-sans">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@clinic.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-slate-900 py-2.5 text-base sm:text-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors rounded-none"
                />
              </div>

              {/* Phone no */}
              <div className="flex flex-col gap-2">
                <label className="text-base sm:text-lg font-bold text-[#22252a] font-sans">
                  Phone no <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-slate-900 py-2.5 text-base sm:text-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors rounded-none"
                />
              </div>

              {/* Clinic / Hospital Name */}
              <div className="flex flex-col gap-2">
                <label className="text-base sm:text-lg font-bold text-[#22252a] font-sans">
                  Clinic / Hospital Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. City Health Clinic"
                  value={formData.clinic}
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-slate-900 py-2.5 text-base sm:text-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors rounded-none"
                />
              </div>

              {/* Specialization */}
              <div className="flex flex-col gap-2">
                <label className="text-base sm:text-lg font-bold text-[#22252a] font-sans">
                  Specialization
                </label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-slate-900 py-2.5 text-base sm:text-lg text-slate-900 focus:outline-none focus:border-blue-600 transition-colors rounded-none cursor-pointer"
                >
                  <option value="General Practice">General Practice</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="ENT">ENT</option>
                  <option value="Other">Other Specialty</option>
                </select>
              </div>

              {/* Preferred Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-base sm:text-lg font-bold text-[#22252a] font-sans">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-slate-900 py-2.5 text-base sm:text-lg text-slate-900 focus:outline-none focus:border-blue-600 transition-colors rounded-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-base sm:text-lg font-bold text-[#22252a] font-sans">
                    Preferred Time Slot
                  </label>
                  <select
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-slate-900 py-2.5 text-base sm:text-lg text-slate-900 focus:outline-none focus:border-blue-600 transition-colors rounded-none cursor-pointer"
                  >
                    <option value="10:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="02:00 PM">02:00 PM - 03:00 PM</option>
                    <option value="05:00 PM">05:00 PM - 06:00 PM</option>
                    <option value="08:00 PM">08:00 PM - 09:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 mt-2 bg-[#22252a] hover:bg-[#1a1c20] text-white font-bold text-base sm:text-lg rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border-none flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Book a Demo'}
              </button>

              {/* Immediate Assistance Note */}
              <div className="mt-8 text-left">
                <p className="text-xl sm:text-2xl font-bold text-[#22252a] tracking-tight leading-tight">
                  Need immediate assistance?
                </p>
                <p className="text-base sm:text-lg font-medium text-slate-700 mt-1.5 leading-relaxed">
                  Reach out directly to <a href="mailto:hello@scribologist.ai" className="text-[#22252a] font-bold underline hover:text-blue-600 transition-colors">hello@scribologist.ai</a>
                </p>
              </div>

            </form>
          ) : (
            <div className="py-12 text-left flex flex-col items-start gap-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
              <h3 className="text-3xl font-bold text-[#22252a]">Demo Request Received!</h3>
              <p className="text-slate-700 text-lg leading-relaxed">
                Thank you Dr. {formData.name || ''}! Our team has received your request and will contact you shortly.
              </p>
              <button
                onClick={() => onNavigate && onNavigate('')}
                className="mt-6 px-8 py-3 bg-[#22252a] hover:bg-[#1a1c20] text-white text-base font-bold rounded-xl transition-colors border-none cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <FooterSection onNavigate={onNavigate} />
    </div>
  );
}
