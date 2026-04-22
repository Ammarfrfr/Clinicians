import React, { useState } from 'react';
import { exportNoteAsPDF, copyNoteToClipboard } from '../utils/exportPDF';
import { generateClinicalNotePDF, downloadPDFFromHTML } from '../utils/generatePDFHTML';
import { Modal } from './Modal';
import { apiClient } from '../config.js';

export function NotePanel({ note, noteError, loading, patient = {}, transcript = '', recordingId = null, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedNote, setEditedNote] = useState(null);
  const [vitals, setVitals] = useState({
    systolic: '',
    diastolic: '',
    hr: '',
    spo2: '',
    temp: '',
    weight: '',
  });

  const getStatus = () => {
    if (loading) return 'Generating...';
    if (note) return 'Generated';
    return 'Pending';
  };

  const getStatusClass = () => {
    if (loading) return 'generating';
    if (note) return 'generated';
    return 'pending';
  };

  const handleVitalsChange = (field, value) => {
    setVitals(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveWithVitals = async () => {
    if (!recordingId) {
      alert('Recording ID not available');
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.patch(`/api/recordings/${recordingId}/note`, { 
        clinicalNote: note,
        vitals: vitals,
        processingStatus: 'completed'
      });

      const data = response.data;
      if (data.success) {
        alert('✅ Recording saved successfully!');
        setShowVitalsModal(false);
        if (onSave) onSave(data.data);
      } else {
        alert('Error saving: ' + data.error);
      }
    } catch (err) {
      console.error('Error saving recording:', err.response?.data || err.message);
      alert('Error saving: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setShowVitalsModal(true);
  };

  const handleSkipVitals = async () => {
    if (!recordingId) {
      alert('Recording ID not available');
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.patch(`/api/recordings/${recordingId}/note`, { 
        clinicalNote: note,
        processingStatus: 'completed'
      });

      const data = response.data;
      if (data.success) {
        alert('✅ Recording saved successfully!');
        setShowVitalsModal(false);
        if (onSave) onSave(data.data);
      } else {
        alert('Error saving: ' + data.error);
      }
    } catch (err) {
      console.error('Error saving recording:', err.response?.data || err.message);
      alert('Error saving: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure? This will discard the current note.')) {
      if (onCancel) onCancel();
    }
  };

  const handleEditNote = () => {
    setEditedNote(JSON.parse(JSON.stringify(note)));
    setShowEditModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditedNote(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrescriptionChange = (index, field, value) => {
    setEditedNote(prev => {
      const newPrescription = Array.isArray(prev.prescription) ? [...prev.prescription] : [];
      if (!newPrescription[index]) newPrescription[index] = {};
      newPrescription[index][field] = value;
      return { ...prev, prescription: newPrescription };
    });
  };

  const handleSaveEditedNote = async () => {
    if (!recordingId) {
      alert('Recording ID not available');
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.patch(`/api/recordings/${recordingId}/note`, { 
        clinicalNote: editedNote,
        processingStatus: 'completed'
      });

      const data = response.data;
      if (data.success) {
        setSuccessMessage('Clinical note updated successfully!');
        setShowSuccessModal(true);
        setShowEditModal(false);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        alert('Error saving: ' + data.error);
      }
    } catch (err) {
      console.error('Error saving note:', err.response?.data || err.message);
      alert('Error saving: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="note-panel">
      <div className="note-header">
        <h3>Clinical Note</h3>
        <span className={`status-badge ${getStatusClass()}`}>
          {getStatus()}
        </span>
      </div>

      {noteError && (
        <div className="note-error" style={{ 
          padding: '12px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '6px', 
          marginBottom: '12px',
          color: '#c33'
        }}>
          <strong>Note Generation Error:</strong>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {noteError}
          </p>
        </div>
      )}

      {note && (
        <div className="note-content">
          <div className="note-section">
            <label>Chief Complaint</label>
            <p>{note.chief_complaint}</p>
          </div>

          <div className="note-section">
            <label>History</label>
            <p>{note.history}</p>
          </div>

          <div className="note-section">
            <label>Examination</label>
            <p>{note.examination}</p>
          </div>

          <div className="note-section">
            <label>Diagnosis</label>
            <p>{note.diagnosis}</p>
          </div>

          <div className="note-section">
            <label>Prescription</label>
            <div className="prescription-list">
              {Array.isArray(note.prescription) ? (
                note.prescription.map((med, idx) => (
                  <div key={idx} className="prescription-item">
                    <span className="drug">{med.drug}</span>
                    <span className="dose">{med.dose}</span>
                  </div>
                ))
              ) : (
                <p>{note.prescription || 'No prescription specified'}</p>
              )}
            </div>
          </div>

          <div className="note-section">
            <label>Follow-up</label>
            <p>{note.followup}</p>
          </div>

          <div className="note-actions">
            <button 
              className="action-btn edit-btn"
              onClick={handleEditNote}
              title="Edit clinical note"
            >
              ✏️ Edit
            </button>
            <button 
              className="action-btn save-btn"
              onClick={handleSave}
              disabled={saving}
              title="Save this recording and note"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="action-btn"
              onClick={() => setShowPDFModal(true)}
              title="Export clinical note as PDF"
            >
              Export PDF
            </button>
            <button 
              className="action-btn"
              onClick={async () => {
                const result = await copyNoteToClipboard(note, patient);
                if (result.success) {
                  setSuccessMessage('Note copied to clipboard!');
                } else {
                  setSuccessMessage('Failed to copy note to clipboard');
                }
                setShowSuccessModal(true);
                setTimeout(() => setShowSuccessModal(false), 2000);
              }}
              title="Copy formatted note to clipboard"
            >
              Copy Text
            </button>
            <button 
              className="action-btn cancel-btn"
              onClick={handleCancel}
              title="Discard this recording"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!note && !loading && (
        <div className="note-empty">
          <p>Start recording to generate clinical notes</p>
        </div>
      )}

      {showVitalsModal && (
        <div className="vitals-modal-overlay">
          <div className="vitals-modal">
            <h3>Enter Patient Vitals (Optional)</h3>
            <form className="vitals-form">
              <div className="vitals-grid">
                <div className="vitals-field">
                  <label>BP Systolic (mmHg)</label>
                  <input 
                    type="number" 
                    placeholder="120"
                    value={vitals.systolic}
                    onChange={(e) => handleVitalsChange('systolic', e.target.value)}
                  />
                </div>
                <div className="vitals-field">
                  <label>BP Diastolic (mmHg)</label>
                  <input 
                    type="number" 
                    placeholder="80"
                    value={vitals.diastolic}
                    onChange={(e) => handleVitalsChange('diastolic', e.target.value)}
                  />
                </div>
                <div className="vitals-field">
                  <label>Heart Rate (bpm)</label>
                  <input 
                    type="number" 
                    placeholder="72"
                    value={vitals.hr}
                    onChange={(e) => handleVitalsChange('hr', e.target.value)}
                  />
                </div>
                <div className="vitals-field">
                  <label>SpO2 (%)</label>
                  <input 
                    type="number" 
                    placeholder="98"
                    value={vitals.spo2}
                    onChange={(e) => handleVitalsChange('spo2', e.target.value)}
                  />
                </div>
                <div className="vitals-field">
                  <label>Temperature (°C)</label>
                  <input 
                    type="number" 
                    placeholder="37"
                    step="0.1"
                    value={vitals.temp}
                    onChange={(e) => handleVitalsChange('temp', e.target.value)}
                  />
                </div>
                <div className="vitals-field">
                  <label>Weight (kg)</label>
                  <input 
                    type="number" 
                    placeholder="70"
                    step="0.1"
                    value={vitals.weight}
                    onChange={(e) => handleVitalsChange('weight', e.target.value)}
                  />
                </div>
              </div>
              <div className="vitals-actions">
                <button 
                  type="button"
                  className="action-btn save-btn"
                  onClick={handleSaveWithVitals}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save with Vitals'}
                </button>
                <button 
                  type="button"
                  className="action-btn"
                  onClick={handleSkipVitals}
                  disabled={saving}
                >
                  Skip Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      <Modal
        isOpen={showPDFModal}
        title="Export PDF"
        onClose={() => setShowPDFModal(false)}
        primaryLabel="Export"
        secondaryLabel="Cancel"
        primaryAction={() => {
          const htmlContent = generateClinicalNotePDF(note, patient, { name: 'Dr. [Name]', qualification: 'MBBS' });
          downloadPDFFromHTML(htmlContent, `Clinical_Note_${patient.firstName || 'Patient'}_${new Date().getTime()}.pdf`);
          setShowPDFModal(false);
          setSuccessMessage('PDF opened in print preview. Use your browser print function to save as PDF.');
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 3000);
        }}
        secondaryAction={() => setShowPDFModal(false)}
      >
        <p>Export this clinical note as a PDF file?</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
          The file will be named: Clinical_Note_{patient.firstName || 'Patient'}_{Date.now()}.pdf
        </p>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        title="Success"
        onClose={() => setShowSuccessModal(false)}
        primaryLabel="OK"
        primaryAction={() => setShowSuccessModal(false)}
      >
        <p>{successMessage}</p>
      </Modal>

      {/* Edit Note Modal */}
      <Modal
        isOpen={showEditModal}
        title="Edit Clinical Note"
        onClose={() => setShowEditModal(false)}
        primaryLabel="Save Changes"
        secondaryLabel="Cancel"
        primaryAction={handleSaveEditedNote}
        secondaryAction={() => setShowEditModal(false)}
      >
        {editedNote && (
          <div className="edit-note-form">
            <div className="form-group">
              <label>Chief Complaint</label>
              <textarea
                value={editedNote.chief_complaint || ''}
                onChange={(e) => handleEditChange('chief_complaint', e.target.value)}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>History</label>
              <textarea
                value={editedNote.history || ''}
                onChange={(e) => handleEditChange('history', e.target.value)}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Examination</label>
              <textarea
                value={editedNote.examination || ''}
                onChange={(e) => handleEditChange('examination', e.target.value)}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Diagnosis</label>
              <textarea
                value={editedNote.diagnosis || ''}
                onChange={(e) => handleEditChange('diagnosis', e.target.value)}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Prescription</label>
              {Array.isArray(editedNote.prescription) && editedNote.prescription.map((med, idx) => (
                <div key={idx} className="prescription-edit">
                  <input
                    type="text"
                    placeholder="Drug name"
                    value={med.drug || ''}
                    onChange={(e) => handlePrescriptionChange(idx, 'drug', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Dose (e.g., 500mg)"
                    value={med.dose || ''}
                    onChange={(e) => handlePrescriptionChange(idx, 'dose', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Frequency (e.g., twice daily)"
                    value={med.frequency || ''}
                    onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Follow-up</label>
              <textarea
                value={editedNote.followup || ''}
                onChange={(e) => handleEditChange('followup', e.target.value)}
                rows="3"
              />
            </div>
          </div>
        )}
      </Modal>
    </aside>
  );
}
