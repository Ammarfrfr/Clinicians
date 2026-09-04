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

  const getStatusColor = (param, value) => {
    if (!value) return null;
    const v = parseFloat(value);
    switch (param) {
      case 'systolic':
        if (v < 90) return '#3b82f6';
        if (v <= 120) return '#10b981';
        if (v <= 139) return '#f59e0b';
        return '#ef4444';
      case 'hr':
        if (v < 60) return '#3b82f6';
        if (v <= 100) return '#10b981';
        return '#ef4444';
      case 'spo2':
        if (v >= 95) return '#10b981';
        if (v >= 90) return '#f59e0b';
        return '#ef4444';
      case 'temp':
        if (v < 97) return '#3b82f6';
        if (v <= 99) return '#10b981';
        return '#ef4444';
      default:
        return null;
    }
  };

  const getStatusLabel = (param, value) => {
    if (!value) return null;
    const v = parseFloat(value);
    switch (param) {
      case 'systolic':
        if (v < 90) return 'Low';
        if (v <= 120) return 'Normal';
        if (v <= 139) return 'Prehypertension';
        return 'High';
      case 'hr':
        if (v < 60) return 'Bradycardia';
        if (v <= 100) return 'Normal';
        return 'Tachycardia';
      case 'spo2':
        if (v >= 95) return 'Normal';
        if (v >= 90) return 'Mild Hypoxia';
        return 'Hypoxia';
      case 'temp':
        if (v < 97) return 'Low';
        if (v <= 99) return 'Normal';
        return 'Fever';
      default:
        return null;
    }
  };

  if (!sessionId) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-4 text-left select-none">
        <h3
          className="text-2xl font-normal text-[#22252a] tracking-tight border-b border-slate-100 pb-3"
          style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}
        >
          Patient Vitals
        </h3>
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-10 text-center text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
            <polyline strokeLinecap="round" points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>Record an encounter to log patient vital signs</span>
        </div>
      </div>
    );
  }

  if (mode === 'display' && savedVitals) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-5 text-left select-none">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3
            className="text-2xl font-normal text-[#22252a] tracking-tight"
            style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}
          >
            Patient Vitals
          </h3>
          <button
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
            onClick={() => setMode('form')}
          >
            Edit Vitals
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-3 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col relative gap-1">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Blood Pressure</div>
            <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1 mt-1 tracking-tight">
              {savedVitals.systolic}/{savedVitals.diastolic}
              <span className="text-xs font-mono text-slate-400">mmHg</span>
            </div>
            {getStatusColor('systolic', savedVitals.systolic) && (
              <span
                className="absolute top-4 right-4 text-[10px] font-mono font-bold text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-xs"
                style={{ backgroundColor: getStatusColor('systolic', savedVitals.systolic) }}
              >
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
              <div key={key} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col relative gap-1">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">{label}</div>
                <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1 mt-1 tracking-tight">
                  {savedVitals[key]}
                  <span className="text-xs font-mono text-slate-400">{unit}</span>
                </div>
                {getStatusColor(key, savedVitals[key]) && (
                  <span
                    className="absolute top-3 right-3 text-[9px] font-mono font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ backgroundColor: getStatusColor(key, savedVitals[key]) }}
                  >
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
    <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-5 text-left select-none">
      <div className="border-b border-slate-100 pb-3">
        <h3
          className="text-2xl font-normal text-[#22252a] tracking-tight mb-1"
          style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}
        >
          Log Vital Signs
        </h3>
        <p className="text-xs text-slate-500 font-sans">
          Record current patient vitals for clinical note attachment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">Systolic BP (mmHg) *</label>
            <input
              type="number"
              name="systolic"
              placeholder="120"
              value={vitals.systolic}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">Diastolic BP (mmHg) *</label>
            <input
              type="number"
              name="diastolic"
              placeholder="80"
              value={vitals.diastolic}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">Heart Rate (bpm) *</label>
            <input
              type="number"
              name="hr"
              placeholder="72"
              value={vitals.hr}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">SpO2 (%) *</label>
            <input
              type="number"
              name="spo2"
              placeholder="98"
              value={vitals.spo2}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">Temp (°F) *</label>
            <input
              type="number"
              step="0.1"
              name="temp"
              placeholder="98.6"
              value={vitals.temp}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              name="weight"
              placeholder="70"
              value={vitals.weight}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#8B5E3C] hover:bg-[#6e482d] text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md border-none"
        >
          {loading ? 'Saving Vitals...' : 'Save & Attach Vitals ✦'}
        </button>
      </form>
    </div>
  );
}
