import { useState, useEffect } from 'react';
import { exportNoteAsPDF, copyNoteToClipboard } from '../utils/exportPDF';
import { generateClinicalNotePDF, downloadPDFFromHTML } from '../utils/generatePDFHTML';
import { Modal } from './Modal';
import { apiClient } from '../config.js';
import './PastVisits.css';

export function PastVisits({ patientId, currentSessionId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [deleteConfirmSessionId, setDeleteConfirmSessionId] = useState(null);
  const [deleteConfirmSessionName, setDeleteConfirmSessionName] = useState('');
  const [selectedNoteForPdf, setSelectedNoteForPdf] = useState(null);
  const [selectedNoteForCopy, setSelectedNoteForCopy] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editedNote, setEditedNote] = useState(null);
  const [savingEditId, setSavingEditId] = useState(null);

  // Fetch when patientId changes OR when a new recording is created (currentSessionId changes)
  useEffect(() => {
    if (patientId) {
      fetchPatientInfo();
      fetchSessions();
    }
  }, [patientId, currentSessionId]);

  const fetchPatientInfo = async () => {
    try {
      const response = await apiClient.get(`/api/patients/${patientId}`);
      const data = response.data;
      if (data.success) {
        setPatientInfo(data.patient);
      }
    } catch (err) {
      console.error('Error fetching patient info:', err.response?.data || err.message);
    }
  };

  const fetchSessions = async () => {
    if (!patientId) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/api/recordings/patients/${patientId}/sessions`);
      const data = response.data;
      
      if (data.success && data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const toggleExpand = (sessionId) => {
    setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId);
  };

  const handleDeleteSession = (sessionId, sessionDate) => {
    setDeleteConfirmSessionId(sessionId);
    setDeleteConfirmSessionName(formatDate(sessionDate));
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmSessionId) return;

    if (!window.confirm('Are you absolutely sure you want to delete this visit? This action cannot be undone.')) {
      setDeleteConfirmSessionId(null);
      return;
    }

    try {
      const response = await apiClient.delete(`/api/recordings/${deleteConfirmSessionId}`);

      const data = response.data;
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s._id !== deleteConfirmSessionId));
        alert('Visit deleted successfully');
        setDeleteConfirmSessionId(null);
      } else {
        alert('Error deleting visit: ' + data.error);
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      alert('Error deleting visit: ' + err.message);
    }
  };

  const handleEditSession = (session) => {
    setEditingSessionId(session._id);
    setEditedNote(JSON.parse(JSON.stringify(session.note)));
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
    if (!editingSessionId || !editedNote) return;

    setSavingEditId(editingSessionId);
    try {
      const response = await apiClient.patch(`/api/recordings/${editingSessionId}/note`, { 
        clinicalNote: editedNote,
        processingStatus: 'completed'
      });

      const data = response.data;
      if (data.success) {
        // Update the session in the list
        setSessions(prev => prev.map(s => 
          s._id === editingSessionId ? { ...s, note: editedNote } : s
        ));
        setSuccessMessage('Clinical note updated successfully!');
        setShowSuccessModal(true);
        setEditingSessionId(null);
        setEditedNote(null);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        alert('Error saving: ' + data.error);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Error saving: ' + err.message);
    } finally {
      setSavingEditId(null);
    }
  };

  if (loading) {
    return (
      <div className="past-visits-container">
        <div className="loading-spinner">Loading past visits...</div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="past-visits-container">
        <div className="empty-state">
          <p>No past visits</p>
        </div>
      </div>
    );
  }

  return (
    <div className="past-visits-container">
      <div className="past-visits-header">
        <h3>Past Visits</h3>
        <span className="visit-count">{sessions.length}</span>
      </div>

      <div className="sessions-list">
        {sessions.map((session) => (
          <div key={session._id} className="session-card">
            {/* Session Card Header */}
            <div
              className="session-header"
              onClick={() => toggleExpand(session._id)}
            >
              <div className="session-header-info">
                <div className="session-date-time">
                  <div className="session-date">{formatDate(session.createdAt)}</div>
                  <div className="session-time">{formatTime(session.createdAt)}</div>
                </div>
                <div className="session-summary">
                  <div className="chief-complaint">
                    {session.note?.chief_complaint || 'No chief complaint recorded'}
                  </div>
                  <div className="diagnosis-tags">
                    {session.note?.diagnosis && (
                      <span className="tag">{session.note.diagnosis}</span>
                    )}
                    {session.note?.prescription && session.note.prescription.length > 0 && (
                      <span className="tag prescription-tag">
                        {session.note.prescription.length} med(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                className={`expand-btn ${expandedSessionId === session._id ? 'expanded' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(session._id);
                }}
              >
                ▼
              </button>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(session._id, session.createdAt);
                }}
                title="Delete this visit"
              >
                🗑️
              </button>
            </div>

            {/* Session Details (Expanded) */}
            {expandedSessionId === session._id && (
              <div className="session-details">
                {/* Clinical Note Section */}
                {session.note && (
                  <div className="detail-section clinical-note-section">
                    <div className="section-header">
                      <h4>Clinical Note</h4>
                      <div className="note-actions">
                        <button
                          className="note-action-btn edit-btn"
                          onClick={() => handleEditSession(session)}
                          title="Edit clinical note"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="note-action-btn"
                          onClick={() => setSelectedNoteForPdf(session)}
                          title="Export as PDF"
                        >
                          Export PDF
                        </button>
                        <button
                          className="note-action-btn"
                          onClick={async () => {
                            const result = await copyNoteToClipboard(session.note, patientInfo);
                            if (result.success) {
                              setSuccessMessage('Clinical note copied to clipboard!');
                            } else {
                              setSuccessMessage('Failed to copy note to clipboard');
                            }
                            setShowSuccessModal(true);
                            setTimeout(() => setShowSuccessModal(false), 2000);
                          }}
                          title="Copy to clipboard"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="note-content">
                      {session.note.chief_complaint && (
                        <div className="note-field">
                          <label>Chief Complaint</label>
                          <p>{session.note.chief_complaint}</p>
                        </div>
                      )}

                      {session.note.history && (
                        <div className="note-field">
                          <label>History</label>
                          <p>{session.note.history}</p>
                        </div>
                      )}

                      {session.note.examination && (
                        <div className="note-field">
                          <label>Examination</label>
                          <p>{session.note.examination}</p>
                        </div>
                      )}

                      {session.note.diagnosis && (
                        <div className="note-field">
                          <label>Diagnosis</label>
                          <p>{session.note.diagnosis}</p>
                        </div>
                      )}

                      {session.note.prescription && (
                        <div className="note-field">
                          <label>Prescription</label>
                          <div className="prescription-list">
                            {Array.isArray(session.note.prescription) ? (
                              session.note.prescription.map((med, idx) => (
                                <div key={idx} className="prescription-item">
                                  <span className="drug">{med.drug}</span>
                                  {med.dose && <span className="dose">{med.dose}</span>}
                                  {med.frequency && <span className="frequency">{med.frequency}</span>}
                                </div>
                              ))
                            ) : (
                              <p>{session.note.prescription}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {session.note.followup && (
                        <div className="note-field">
                          <label>Follow-up</label>
                          <p>{session.note.followup}</p>
                        </div>
                      )}

                      {session.vitals && Object.keys(session.vitals).length > 0 && (
                        <div className="note-field">
                          <label>Vitals</label>
                          <div className="vitals-grid">
                            {session.vitals.systolic && (
                              <div className="vital">
                                <span className="vital-label">BP</span>
                                <span className="vital-value">{session.vitals.systolic}/{session.vitals.diastolic}</span>
                              </div>
                            )}
                            {session.vitals.hr && (
                              <div className="vital">
                                <span className="vital-label">HR</span>
                                <span className="vital-value">{session.vitals.hr} bpm</span>
                              </div>
                            )}
                            {session.vitals.spo2 && (
                              <div className="vital">
                                <span className="vital-label">SpO2</span>
                                <span className="vital-value">{session.vitals.spo2}%</span>
                              </div>
                            )}
                            {session.vitals.temp && (
                              <div className="vital">
                                <span className="vital-label">Temp</span>
                                <span className="vital-value">{session.vitals.temp}°C</span>
                              </div>
                            )}
                            {session.vitals.weight && (
                              <div className="vital">
                                <span className="vital-label">Weight</span>
                                <span className="vital-value">{session.vitals.weight} kg</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Transcript Section */}
                {session.labeledTranscript && (
                  <div className="detail-section">
                    <h4>Transcript</h4>
                    <div className="transcript-content" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {session.labeledTranscript.replace(/(Patient:|Doctor:|Orthopedic Surgeon:)/gi, '\n$1').split('\n').map(l => l.trim()).filter(l => l.length > 0).map((line, idx) => {
                        const isDoctor = line.toLowerCase().startsWith('doctor');
                        const isPatient = line.toLowerCase().startsWith('patient');
                        return (
                          <div key={idx} className="transcript-line" style={{ marginBottom: '8px' }}>
                            {(isDoctor || isPatient) && line.includes(':') ? (
                              <>
                                <strong style={{ color: isDoctor ? '#4f46e5' : '#e11d48', marginRight: '6px' }}>
                                  {line.substring(0, line.indexOf(':') + 1)}
                                </strong>
                                <span>{line.substring(line.indexOf(':') + 1)}</span>
                              </>
                            ) : (
                              line
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {deleteConfirmSessionId && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>Delete Visit?</h3>
            <p>Are you sure you want to delete the visit from <strong>{deleteConfirmSessionName}</strong>?</p>
            <p className="warning-text">This action cannot be undone. All visit records and transcripts will be permanently deleted.</p>
            <div className="delete-confirm-actions">
              <button 
                className="btn-cancel"
                onClick={() => setDeleteConfirmSessionId(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-delete-confirm"
                onClick={handleConfirmDelete}
              >
                Delete Visit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      <Modal
        isOpen={!!selectedNoteForPdf}
        title="Export Clinical Note as PDF"
        onClose={() => setSelectedNoteForPdf(null)}
        primaryLabel="Export"
        secondaryLabel="Cancel"
        primaryAction={() => {
          if (selectedNoteForPdf && selectedNoteForPdf.note) {
            const htmlContent = generateClinicalNotePDF(selectedNoteForPdf.note, patientInfo, { name: 'Dr. [Name]', qualification: 'MBBS' });
            downloadPDFFromHTML(htmlContent, `Clinical_Note_${patientInfo?.firstName || 'Patient'}_${new Date().getTime()}.pdf`);
            setSelectedNoteForPdf(null);
            setSuccessMessage('PDF opened in print preview. Use your browser print function to save as PDF.');
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
          }
        }}
        secondaryAction={() => setSelectedNoteForPdf(null)}
      >
        <p>Export this clinical note as a PDF file?</p>
        {selectedNoteForPdf && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
            Date: {formatDate(selectedNoteForPdf.createdAt)}
          </p>
        )}
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
    </div>
  );
}
