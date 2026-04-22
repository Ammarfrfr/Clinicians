import { useState, useEffect } from 'react';
import { apiClient } from '../config.js';
import './Vitals.css';

export function Vitals({ sessionId, onVitalsSaved }) {
  const [mode, setMode] = useState('form'); // 'form' or 'display'
  const [loading, setLoading] = useState(false);
  const [vitals, setVitals] = useState({
    systolic: '',
    diastolic: '',
    hr: '',
    spo2: '',
    temp: '',
    weight: '',
  });
  const [savedVitals, setSavedVitals] = useState(null);

  // Fetch existing vitals if session already has them
  useEffect(() => {
    if (sessionId && mode === 'form') {
      // Could fetch existing vitals here if desired
    }
  }, [sessionId, mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVitals(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!sessionId) {
      alert('No session ID available');
      return;
    }

    // Validate required fields
    if (!vitals.systolic || !vitals.diastolic || !vitals.hr || !vitals.spo2 || !vitals.temp) {
      alert('Please fill in all vital signs');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.patch(`/api/recordings/${sessionId}/vitals`, { vitals });

      const data = response.data;
      if (data.success) {
        setSavedVitals(data.vitals);
        setMode('display');
        if (onVitalsSaved) onVitalsSaved(data.vitals);
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

  const getStatus = (field, value) => {
    if (!value) return null;
    
    switch (field) {
      case 'systolic':
      case 'diastolic':
        const bp = field === 'systolic' ? value : savedVitals.diastolic;
        const sbp = field === 'systolic' ? value : savedVitals.systolic;
        if (sbp > 130 || bp > 80) return { status: 'Elevated', color: '#f59e0b' };
        return { status: 'Normal', color: '#22c55e' };
      case 'hr':
        if (value > 100) return { status: 'Elevated', color: '#f59e0b' };
        if (value < 60) return { status: 'Low', color: '#3b82f6' };
        return { status: 'Normal', color: '#22c55e' };
      case 'spo2':
        if (value < 95) return { status: 'Low', color: '#ef4444' };
        return { status: 'Normal', color: '#22c55e' };
      case 'temp':
        if (value > 99) return { status: 'Elevated', color: '#ef4444' };
        return { status: 'Normal', color: '#22c55e' };
      case 'weight':
        return { status: 'Recorded', color: '#22c55e' };
      default:
        return null;
    }
  };

  const formatLabel = (field) => {
    const labels = {
      systolic: 'Systolic (mmHg)',
      diastolic: 'Diastolic (mmHg)',
      hr: 'Heart Rate (bpm)',
      spo2: 'SpO2 (%)',
      temp: 'Temperature (°F)',
      weight: 'Weight (kg)'
    };
    return labels[field] || field;
  };

  if (mode === 'display' && savedVitals) {
    return (
      <div className="vitals-container">
        <div className="vitals-header">
          <h3>Vitals</h3>
          <button className="btn-edit" onClick={() => setMode('form')}>
            Edit
          </button>
        </div>
        
        <div className="vitals-grid">
          {/* BP Card - takes 2 columns */}
          <div className="vital-card bp-card">
            <div className="vital-label">Blood Pressure</div>
            <div className="vital-value">
              {savedVitals.systolic}/{savedVitals.diastolic}
              <span className="vital-unit">mmHg</span>
            </div>
            {getStatus('systolic', savedVitals.systolic) && (
              <div className="vital-badge" style={{ backgroundColor: getStatus('systolic', savedVitals.systolic).color }}>
                {getStatus('systolic', savedVitals.systolic).status}
              </div>
            )}
          </div>

          {/* Heart Rate */}
          <div className="vital-card">
            <div className="vital-label">Heart Rate</div>
            <div className="vital-value">
              {savedVitals.hr}
              <span className="vital-unit">bpm</span>
            </div>
            {getStatus('hr', savedVitals.hr) && (
              <div className="vital-badge" style={{ backgroundColor: getStatus('hr', savedVitals.hr).color }}>
                {getStatus('hr', savedVitals.hr).status}
              </div>
            )}
          </div>

          {/* SpO2 */}
          <div className="vital-card">
            <div className="vital-label">SpO2</div>
            <div className="vital-value">
              {savedVitals.spo2}
              <span className="vital-unit">%</span>
            </div>
            {getStatus('spo2', savedVitals.spo2) && (
              <div className="vital-badge" style={{ backgroundColor: getStatus('spo2', savedVitals.spo2).color }}>
                {getStatus('spo2', savedVitals.spo2).status}
              </div>
            )}
          </div>

          {/* Temperature */}
          <div className="vital-card">
            <div className="vital-label">Temperature</div>
            <div className="vital-value">
              {savedVitals.temp}
              <span className="vital-unit">°F</span>
            </div>
            {getStatus('temp', savedVitals.temp) && (
              <div className="vital-badge" style={{ backgroundColor: getStatus('temp', savedVitals.temp).color }}>
                {getStatus('temp', savedVitals.temp).status}
              </div>
            )}
          </div>

          {/* Weight */}
          <div className="vital-card">
            <div className="vital-label">Weight</div>
            <div className="vital-value">
              {savedVitals.weight}
              <span className="vital-unit">kg</span>
            </div>
            {getStatus('weight', savedVitals.weight) && (
              <div className="vital-badge" style={{ backgroundColor: getStatus('weight', savedVitals.weight).color }}>
                {getStatus('weight', savedVitals.weight).status}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vitals-container">
      <h3>Record Vitals</h3>
      
      <form onSubmit={handleSubmit} className="vitals-form">
        <div className="form-row">
          <div className="form-group">
            <label>Systolic (mmHg)</label>
            <input
              type="number"
              name="systolic"
              value={vitals.systolic}
              onChange={handleInputChange}
              placeholder="120"
              min="0"
              max="300"
              required
            />
          </div>
          <div className="form-group">
            <label>Diastolic (mmHg)</label>
            <input
              type="number"
              name="diastolic"
              value={vitals.diastolic}
              onChange={handleInputChange}
              placeholder="80"
              min="0"
              max="200"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Heart Rate (bpm)</label>
            <input
              type="number"
              name="hr"
              value={vitals.hr}
              onChange={handleInputChange}
              placeholder="72"
              min="0"
              max="250"
              required
            />
          </div>
          <div className="form-group">
            <label>SpO2 (%)</label>
            <input
              type="number"
              name="spo2"
              value={vitals.spo2}
              onChange={handleInputChange}
              placeholder="98"
              min="0"
              max="100"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Temperature (°F)</label>
            <input
              type="number"
              name="temp"
              value={vitals.temp}
              onChange={handleInputChange}
              placeholder="98.6"
              min="0"
              max="120"
              step="0.1"
              required
            />
          </div>
          <div className="form-group">
            <label>Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={vitals.weight}
              onChange={handleInputChange}
              placeholder="70"
              min="0"
              max="500"
              step="0.1"
            />
          </div>
        </div>

        <button type="submit" className="btn-save-vitals" disabled={loading}>
          {loading ? 'Saving...' : 'Save Vitals'}
        </button>
      </form>
    </div>
  );
}
