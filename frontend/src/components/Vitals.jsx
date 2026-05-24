import { useState, useEffect } from 'react';
import { apiClient } from '../config.js';

export function Vitals({ sessionId, onVitalsSaved }) {
  const [mode, setMode] = useState('form');
  const [loading, setLoading] = useState(false);
  const [vitals, setVitals] = useState({
    systolic: '', diastolic: '', hr: '', spo2: '', temp: '', weight: '',
  });
  const [savedVitals, setSavedVitals] = useState(null);

  useEffect(() => {
    setMode('form');
    setSavedVitals(null);
    setVitals({ systolic: '', diastolic: '', hr: '', spo2: '', temp: '', weight: '' });
  }, [sessionId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVitals((prev) => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionId) {
      alert('No active session. Please record a consultation first.');
      return;
    }
    if (!vitals.systolic || !vitals.diastolic || !vitals.hr || !vitals.spo2 || !vitals.temp) {
      alert('Please fill in all required vital signs');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.patch(`/api/recordings/${sessionId}/vitals`, { vitals });
      const data = response.data;
      if (data.success && data.data) {
        setSavedVitals(data.data.vitals);
        setMode('display');
        if (onVitalsSaved) onVitalsSaved(data.data.vitals);
      } else {
        alert('Error saving vitals: ' + data.error);
      }
    } catch (err) {
      console.error('Error saving vitals:', err.response?.data || err.message);
      alert('Error saving vitals: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (field, value) => {
    if (!value) return null;
    switch (field) {
      case 'systolic': return value > 130 ? '#E05555' : '#22C55E';
      case 'diastolic': return value > 80 ? '#F59E0B' : '#22C55E';
      case 'hr': return value > 100 || value < 60 ? '#F59E0B' : '#22C55E';
      case 'spo2': return value < 95 ? '#E05555' : '#22C55E';
      case 'temp': return value > 99 ? '#E05555' : '#22C55E';
      default: return '#22C55E';
    }
  };

  const getStatusLabel = (field, value) => {
    if (!value) return null;
    switch (field) {
      case 'systolic': return value > 130 ? 'High' : 'Normal';
      case 'diastolic': return value > 80 ? 'Elevated' : 'Normal';
      case 'hr': return value > 100 ? 'Elevated' : value < 60 ? 'Low' : 'Normal';
      case 'spo2': return value < 95 ? 'Low' : 'Normal';
      case 'temp': return value > 99 ? 'Elevated' : 'Normal';
      default: return 'Recorded';
    }
  };

  if (!sessionId) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col gap-4">
        <h3 className="text-base font-bold text-navy">Vitals</h3>
        <div className="flex flex-col items-center justify-center gap-3 text-gray-400 py-8 text-center text-sm font-medium border border-dashed border-gray-200 rounded-xl">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
            <polyline strokeLinecap="round" points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>Record a consultation to log vitals</span>
        </div>
      </div>
    );
  }

  if (mode === 'display' && savedVitals) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-navy">Vitals</h3>
          <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-xs rounded-xl transition-all cursor-pointer" onClick={() => setMode('form')} style={{ fontSize: '12px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
          {/* BP card - full width */}
          <div className="col-span-2 sm:col-span-3 p-4 bg-gray-50/50 border border-gray-100 rounded-xl flex flex-col relative gap-1">
            <div className="text-xs font-bold text-gray-500">Blood Pressure</div>
            <div className="text-2xl font-bold text-navy flex items-baseline gap-1 mt-1">
              {savedVitals.systolic}/{savedVitals.diastolic}
              <span className="text-xs font-medium text-gray-400">mmHg</span>
            </div>
            {getStatusColor('systolic', savedVitals.systolic) && (
              <span className="absolute top-3 right-3 text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: getStatusColor('systolic', savedVitals.systolic) }}>
                {getStatusLabel('systolic', savedVitals.systolic)}
              </span>
            )}
          </div>

          {[
            { key: 'hr', label: 'Heart Rate', unit: 'bpm' },
            { key: 'spo2', label: 'SpO2', unit: '%' },
            { key: 'temp', label: 'Temperature', unit: '°F' },
            { key: 'weight', label: 'Weight', unit: 'kg' },
          ].map(({ key, label, unit }) => (
            savedVitals[key] ? (
              <div key={key} className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl flex flex-col relative gap-1">
                <div className="text-xs font-bold text-gray-500">{label}</div>
                <div className="text-2xl font-bold text-navy flex items-baseline gap-1 mt-1">
                  {savedVitals[key]}
                  <span className="text-xs font-medium text-gray-400">{unit}</span>
                </div>
                {getStatusColor(key, savedVitals[key]) && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: getStatusColor(key, savedVitals[key]) }}>
                    {getStatusLabel(key, savedVitals[key])}
                  </span>
                )}
              </div>
            ) : null
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col gap-4">
      <h3 className="text-base font-bold text-navy">Record Vitals</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Systolic (mmHg) *</label>
            <input type="number" name="systolic" value={vitals.systolic} onChange={handleInputChange} placeholder="120" min="0" max="300" required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Diastolic (mmHg) *</label>
            <input type="number" name="diastolic" value={vitals.diastolic} onChange={handleInputChange} placeholder="80" min="0" max="200" required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Heart Rate (bpm) *</label>
            <input type="number" name="hr" value={vitals.hr} onChange={handleInputChange} placeholder="72" min="0" max="250" required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">SpO2 (%) *</label>
            <input type="number" name="spo2" value={vitals.spo2} onChange={handleInputChange} placeholder="98" min="0" max="100" required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Temperature (°F) *</label>
            <input type="number" name="temp" value={vitals.temp} onChange={handleInputChange} placeholder="98.6" min="0" max="120" step="0.1" required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Weight (kg)</label>
            <input type="number" name="weight" value={vitals.weight} onChange={handleInputChange} placeholder="70" min="0" max="500" step="0.1" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all" />
          </div>
        </div>
        <button type="submit" className="mt-2 w-full inline-flex items-center justify-center px-4 py-2.5 bg-teal hover:bg-teal-dark text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
          {loading ? 'Saving...' : 'Save Vitals'}
        </button>
      </form>
    </div>
  );
}
