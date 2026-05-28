import { useState, useEffect } from 'react';
import { exportNoteAsPDF, copyNoteToClipboard } from '../utils/exportPDF';
import { generateClinicalNotePDF, downloadPDFFromHTML } from '../utils/generatePDFHTML';
import { Modal } from './Modal';
import { apiClient } from '../config.js';
import { DrugSearchInput } from './DrugSearchInput.jsx';
import { ChevronDown, Trash2, Pencil, Save } from 'lucide-react';

export function PastVisits({ patientId, currentSessionId, noteSavedTrigger }) {
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
  const [selectedTag, setSelectedTag] = useState('All');

  // Fetch when patientId changes, when a new recording is created, or when note is saved/updated
  useEffect(() => {
    if (patientId) {
      fetchPatientInfo();
      fetchSessions();
    }
  }, [patientId, currentSessionId, noteSavedTrigger]);

  const fetchPatientInfo = async () => {
    try {
      const response = await apiClient.get(`/api/patients/${patientId}`);
      const data = response.data;
      if (data.success) {
        setPatientInfo(data.data);
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
      
      if (data.success && data.data) {
        setSessions(data.data);
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

    try {
      const response = await apiClient.delete(`/api/recordings/${deleteConfirmSessionId}`);

      const data = response.data;
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s._id !== deleteConfirmSessionId));
        setSuccessMessage('Visit deleted successfully!');
        setShowSuccessModal(true);
        setDeleteConfirmSessionId(null);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        setSuccessMessage('Error deleting visit: ' + data.error);
        setShowSuccessModal(true);
        setDeleteConfirmSessionId(null);
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      setSuccessMessage('Error deleting visit: ' + err.message);
      setShowSuccessModal(true);
      setDeleteConfirmSessionId(null);
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

  const allTags = ['All', ...new Set(sessions.flatMap(s => s.tags || []))];
  const filteredSessions = selectedTag === 'All'
    ? sessions
    : sessions.filter(s => s.tags?.includes(selectedTag));

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
    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-bold text-navy">Past Visits</h3>
        <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 rounded-full">{sessions.length}</span>
      </div>

      {/* Filter Chips */}
      {allTags.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {allTags.map(tag => (
            <button
              key={tag}
              className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${selectedTag === tag ? 'bg-teal text-navy border-teal' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 text-gray-500 py-8 text-center text-sm font-medium border border-dashed border-gray-200 rounded-xl">
            <p>No past visits match the "{selectedTag}" filter.</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div key={session._id} className="border border-gray-150 rounded-xl bg-white overflow-hidden shadow-xs hover:border-teal/30 transition-all">
              {/* Session Card Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => toggleExpand(session._id)}
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="flex flex-col text-left shrink-0">
                    <div className="text-sm font-semibold text-navy">{formatDate(session.createdAt)}</div>
                    <div className="text-xs text-gray-400 font-medium">{formatTime(session.createdAt)}</div>
                  </div>
                  <div className="flex flex-col text-left gap-1 flex-1">
                    <div className="text-sm font-medium text-gray-700 flex items-center gap-2 flex-wrap">
                      <span>{session.note?.chief_complaint || session.note?.notes || 'No chief complaint recorded'}</span>
                      {session.tags && session.tags.map(tag => (
                        <span 
                          key={tag} 
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wider ${tag === 'Surgery' ? 'bg-red-brand-light text-red-brand' : tag === 'Medication' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {session.note?.diagnosis && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-md uppercase tracking-wider">{session.note.diagnosis}</span>
                      )}
                      {session.note?.prescription && session.note.prescription.length > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase tracking-wider bg-teal-light text-teal-dark">
                          {session.note.prescription.length} med(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className={`p-1.5 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-lg cursor-pointer transition-all ${expandedSessionId === session._id ? 'rotate-180' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(session._id);
                    }}
                    title={expandedSessionId === session._id ? "Collapse" : "Expand"}
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    className="p-1.5 text-gray-400 hover:text-red-brand hover:bg-red-brand-light rounded-lg cursor-pointer transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session._id, session.createdAt);
                    }}
                    title="Delete this visit"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Session Details (Expanded) */}
              {expandedSessionId === session._id && (
                <div className="border-t border-gray-100 bg-gray-50/30 p-4 flex flex-col gap-4 animate-in slide-in-from-top-1 duration-150">
                  {/* Clinical Note Section */}
                  {session.note && (
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <h4 className="text-sm font-bold text-navy">Clinical Note</h4>
                        <div className="flex items-center gap-1.5">
                          {editingSessionId === session._id ? (
                            <>
                              <button
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal hover:bg-teal-dark text-navy text-xs font-bold rounded-lg transition-colors cursor-pointer border-none"
                                onClick={handleSaveEditedNote}
                                disabled={savingEditId === session._id}
                              >
                                {savingEditId === session._id ? (
                                  'Saving...'
                                ) : (
                                  <>
                                    <Save size={12} /> Save
                                  </>
                                )}
                              </button>
                              <button
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-navy text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                onClick={() => { setEditingSessionId(null); setEditedNote(null); }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-200 bg-white hover:bg-gray-50 rounded-lg font-semibold text-teal-dark hover:text-teal cursor-pointer transition-all"
                                onClick={() => handleEditSession(session)}
                                title="Edit clinical note"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              <button
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-200 bg-white hover:bg-gray-50 rounded-lg font-semibold text-gray-700 cursor-pointer transition-all"
                                onClick={() => setSelectedNoteForPdf(session)}
                                title="Export as PDF"
                              >
                                Export PDF
                              </button>
                              <button
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-200 bg-white hover:bg-gray-50 rounded-lg font-semibold text-gray-700 cursor-pointer transition-all"
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
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {editingSessionId === session._id ? (
                          <>
                            {editedNote?.notes !== undefined && (
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Clinical Notes / Summary</label>
                                <textarea
                                  rows={3}
                                  value={editedNote?.notes || ''}
                                  onChange={(e) => handleEditChange('notes', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-none"
                                />
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Chief Complaint</label>
                              <input
                                type="text"
                                value={editedNote?.chief_complaint || ''}
                                onChange={(e) => handleEditChange('chief_complaint', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Diagnosis</label>
                              <input
                                type="text"
                                value={editedNote?.diagnosis || ''}
                                onChange={(e) => handleEditChange('diagnosis', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2">
                              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">History</label>
                              <textarea
                                rows={3}
                                value={editedNote?.history || ''}
                                onChange={(e) => handleEditChange('history', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2">
                              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Examination</label>
                              <textarea
                                rows={3}
                                value={editedNote?.examination || ''}
                                onChange={(e) => handleEditChange('examination', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2">
                              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Prescription</label>
                              <div className="flex flex-col gap-2">
                                {(Array.isArray(editedNote?.prescription) ? editedNote.prescription : []).map((med, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                    <DrugSearchInput
                                      value={typeof med === 'object' ? med.drug || '' : String(med)}
                                      onChange={(val) => handlePrescriptionChange(idx, 'drug', val)}
                                      placeholder="Drug name..."
                                    />
                                    <input
                                      type="text"
                                      value={typeof med === 'object' ? med.dose || '' : ''}
                                      onChange={(e) => handlePrescriptionChange(idx, 'dose', e.target.value)}
                                      placeholder="Dose"
                                      className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal"
                                    />
                                    <input
                                      type="text"
                                      value={typeof med === 'object' ? med.frequency || '' : ''}
                                      onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                                      placeholder="Frequency"
                                      className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal"
                                    />
                                    <button className="p-1 text-gray-400 hover:text-red-brand bg-transparent border-none cursor-pointer flex items-center justify-center" onClick={() => {
                                      setEditedNote(prev => {
                                        const rx = [...prev.prescription];
                                        rx.splice(idx, 1);
                                        return { ...prev, prescription: rx };
                                      });
                                    }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                                <button className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark hover:text-teal bg-transparent border-none cursor-pointer mt-1 self-start" onClick={() => {
                                  setEditedNote(prev => {
                                    const rx = Array.isArray(prev.prescription) ? [...prev.prescription] : [];
                                    rx.push({ drug: '', dose: '', frequency: '' });
                                    return { ...prev, prescription: rx };
                                  });
                                }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                  Add Medication
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2">
                              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Follow-up Instructions</label>
                              <input
                                type="text"
                                value={editedNote?.followup || ''}
                                onChange={(e) => handleEditChange('followup', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            {session.note.notes && (
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Clinical Notes / Summary</label>
                                <p className="text-sm text-gray-700 leading-relaxed">{session.note.notes}</p>
                              </div>
                            )}

                            {session.note.chief_complaint && (
                              <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Chief Complaint</label>
                                <p className="text-sm text-gray-700 leading-relaxed">{session.note.chief_complaint}</p>
                              </div>
                            )}

                            {session.note.diagnosis && (
                              <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Diagnosis</label>
                                <p className="text-sm text-gray-700 leading-relaxed">{session.note.diagnosis}</p>
                              </div>
                            )}

                            {session.note.history && (
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">History</label>
                                <p className="text-sm text-gray-700 leading-relaxed">{session.note.history}</p>
                              </div>
                            )}

                            {session.note.examination && (
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Examination</label>
                                <p className="text-sm text-gray-700 leading-relaxed">{session.note.examination}</p>
                              </div>
                            )}

                            {session.note.prescription && (
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Prescription</label>
                                <div className="flex flex-col gap-1.5">
                                  {Array.isArray(session.note.prescription) ? (
                                    session.note.prescription.map((med, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                        <span className="font-medium text-navy">{med.drug}</span>
                                        {med.dose && <span className="text-xs text-teal-dark bg-teal-light px-1.5 py-0.5 rounded font-semibold">{med.dose}</span>}
                                        {med.frequency && <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-semibold">{med.frequency}</span>}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-700 leading-relaxed">{session.note.prescription}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {session.note.followup && (
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Follow-up</label>
                                <p className="text-sm text-gray-700 leading-relaxed">{session.note.followup}</p>
                              </div>
                            )}
                          </>
                        )}

                        {session.vitals && Object.keys(session.vitals).length > 0 && (
                          <div className="flex flex-col gap-1 md:col-span-2 mt-1">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Vitals</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
                              {session.vitals.systolic && (
                                <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg flex flex-col gap-0.5">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">BP</span>
                                  <span className="text-sm font-bold text-navy">{session.vitals.systolic}/{session.vitals.diastolic}</span>
                                </div>
                              )}
                              {session.vitals.hr && (
                                <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg flex flex-col gap-0.5">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">HR</span>
                                  <span className="text-sm font-bold text-navy">{session.vitals.hr} bpm</span>
                                </div>
                              )}
                              {session.vitals.spo2 && (
                                <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg flex flex-col gap-0.5">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">SpO2</span>
                                  <span className="text-sm font-bold text-navy">{session.vitals.spo2}%</span>
                                </div>
                              )}
                              {session.vitals.temp && (
                                <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg flex flex-col gap-0.5">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">Temp</span>
                                  <span className="text-sm font-bold text-navy">{session.vitals.temp}°F</span>
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
                    <div className="flex flex-col gap-2 bg-white border border-gray-100 rounded-xl p-4 shadow-xs">
                      <h4 className="text-sm font-bold text-navy">Transcript</h4>
                      <div className="text-sm text-gray-700 max-h-60 overflow-y-auto leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                        {session.labeledTranscript.replace(/(Patient:|Doctor:|Orthopedic Surgeon:)/gi, '\n$1').split('\n').map(l => l.trim()).filter(l => l.length > 0).map((line, idx) => {
                          const isDoctor = line.toLowerCase().startsWith('doctor');
                          const isPatient = line.toLowerCase().startsWith('patient');
                          return (
                            <div key={idx} className="mb-2">
                              {(isDoctor || isPatient) && line.includes(':') ? (
                                <>
                                  <strong className={isDoctor ? 'text-teal-dark mr-1.5' : 'text-rose-600 mr-1.5'}>
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
          ))
        )}
      </div>

      {deleteConfirmSessionId && (
        <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200 gap-3">
            <h3 className="text-base font-bold text-red-brand">Delete Visit?</h3>
            <p className="text-sm text-gray-600">Are you sure you want to delete the visit from <strong>{deleteConfirmSessionName}</strong>?</p>
            <p className="text-xs font-medium text-red-brand bg-red-brand-light p-3 rounded-lg border border-red-brand/10">This action cannot be undone. All visit records and transcripts will be permanently deleted.</p>
            <div className="flex justify-end gap-2.5 mt-2">
              <button 
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer"
                onClick={() => setDeleteConfirmSessionId(null)}
              >
                Cancel
              </button>
              <button 
                className="inline-flex items-center justify-center px-4 py-2 bg-red-brand text-white hover:bg-red-brand/90 font-semibold text-sm rounded-xl transition-all cursor-pointer border-none"
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
        <p className="text-sm text-gray-600">Export this clinical note as a PDF file?</p>
        {selectedNoteForPdf && (
          <p className="text-xs text-gray-400 mt-3 font-mono">
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
        <p className="text-sm text-gray-600">{successMessage}</p>
      </Modal>
    </div>
  );
}
