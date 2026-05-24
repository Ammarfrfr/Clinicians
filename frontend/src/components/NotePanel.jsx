import { useState, useEffect, useRef } from 'react';
import { Stethoscope, ClipboardList } from 'lucide-react';
import { apiClient } from '../config.js';
import { copyNoteToClipboard } from '../utils/exportPDF.js';
import { FollowUpTodos } from './FollowUpTodos.jsx';
import { DrugSearchInput } from './DrugSearchInput.jsx';
import { ExportModal } from './ExportModal.jsx';
import { shareOnWhatsApp, generatePrescriptionMessage } from '../utils/whatsappHelper.js';

export function NotePanel({ note, noteError, loading, patient, doctor, transcript, recordingId, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [editing, setEditing] = useState(false);
  const [editedNote, setEditedNote] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');

  // Template State: 'soap' (Comprehensive SOAP) or 'rx' (Quick Prescription)
  const [activeTemplate, setActiveTemplate] = useState('soap');

  // Local Dictation Audio Recording States & Refs
  const [isNotesRecording, setIsNotesRecording] = useState(false);
  const [notesRecordTime, setNotesRecordTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const notesMediaRecorderRef = useRef(null);
  const notesAudioChunksRef = useRef([]);
  const notesTimerRef = useRef(null);
  const notesStreamRef = useRef(null);

  // Sync phone state when patient changes
  useEffect(() => {
    if (patient?.contactInfo?.phone) {
      setWhatsappPhone(patient.contactInfo.phone);
    } else {
      setWhatsappPhone('');
    }
  }, [patient]);

  // Reset edit state when note changes
  useEffect(() => {
    if (note) {
      setEditedNote(JSON.parse(JSON.stringify(note)));
      setEditing(false);

      // Auto-detect template based on contents
      if (note.chief_complaint || note.history || note.examination || note.diagnosis) {
        setActiveTemplate('soap');
      } else if (note.notes) {
        setActiveTemplate('rx');
      }
    } else {
      // Clear values when note is null (no active session note)
      setEditedNote({
        chief_complaint: '',
        history: '',
        examination: '',
        diagnosis: '',
        prescription: [],
        followup: '',
        notes: '',
      });
      // Rx mode starts in editing state by default
      setEditing(activeTemplate === 'rx');
    }
  }, [note, recordingId, activeTemplate]);

  // Clean up recording timers/streams on unmount
  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearInterval(notesTimerRef.current);
      if (notesStreamRef.current) {
        notesStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Micro audio recorder handlers
  const startNotesRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      notesStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      notesMediaRecorderRef.current = mediaRecorder;
      notesAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          notesAudioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(notesAudioChunksRef.current, { type: 'audio/webm' });
        await transcribeNotesAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsNotesRecording(true);
      setNotesRecordTime(0);

      notesTimerRef.current = setInterval(() => {
        setNotesRecordTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start dictation recording:', err);
      alert('Microphone access denied or error starting recording.');
    }
  };

  const stopNotesRecording = () => {
    if (notesTimerRef.current) {
      clearInterval(notesTimerRef.current);
      notesTimerRef.current = null;
    }
    if (notesMediaRecorderRef.current && notesMediaRecorderRef.current.state !== 'inactive') {
      notesMediaRecorderRef.current.stop();
    }
    if (notesStreamRef.current) {
      notesStreamRef.current.getTracks().forEach(track => track.stop());
      notesStreamRef.current = null;
    }
    setIsNotesRecording(false);
  };

  const transcribeNotesAudio = async (audioBlob) => {
    if (audioBlob.size === 0) return;
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'dictation.webm');
      const response = await apiClient.post('/api/analyze/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success && response.data.data.text) {
        const transcribedText = response.data.data.text.trim();
        setEditedNote(prev => {
          const currentNotes = prev?.notes || '';
          return {
            ...prev,
            notes: currentNotes ? `${currentNotes} ${transcribedText}` : transcribedText
          };
        });
      }
    } catch (err) {
      console.error('Transcription error:', err);
      alert('Transcription failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSave = async (isFinalizing = false) => {
    if (!note && !editedNote) return;
    setSaving(true);
    try {
      const noteToSave = editing ? editedNote : note;
      
      let response;
      if (recordingId) {
        // Update existing recording
        response = await apiClient.patch(`/api/recordings/${recordingId}/note`, {
          clinicalNote: noteToSave,
          processingStatus: 'completed',
          isFinalized: isFinalizing === true
        });
      } else {
        // Create a manual recording directly since no active session exists
        response = await apiClient.post('/api/recordings', {
          patientId: patient?._id,
          clinicalNote: noteToSave,
          tags: ['Medication']
        });
      }

      if (response.data.success) {
        setSaved(true);
        setEditing(false);
        if (onSave) onSave(response.data.data);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Error saving note: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    const noteData = editing ? editedNote : note;
    if (!noteData) return;
    const result = await copyNoteToClipboard(noteData, patient);
    if (result.success) {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedNote((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEditing = () => {
    if (editing) {
      handleSave();
    } else {
      setEditing(true);
    }
  };

  const handlePrescriptionChange = (index, field, value) => {
    setEditedNote((prev) => {
      const prescriptions = Array.isArray(prev.prescription) ? [...prev.prescription] : [];
      if (!prescriptions[index]) prescriptions[index] = { drug: '', dose: '', frequency: '' };
      prescriptions[index] = { ...prescriptions[index], [field]: value };
      return { ...prev, prescription: prescriptions };
    });
  };

  const addPrescriptionRow = () => {
    setEditedNote((prev) => {
      const prescriptions = Array.isArray(prev.prescription) ? [...prev.prescription] : [];
      prescriptions.push({ drug: '', dose: '', frequency: '' });
      return { ...prev, prescription: prescriptions };
    });
  };

  const removePrescriptionRow = (index) => {
    setEditedNote((prev) => {
      const prescriptions = Array.isArray(prev.prescription) ? [...prev.prescription] : [];
      return { ...prev, prescription: prescriptions.filter((_, i) => i !== index) };
    });
  };

  const displayNote = editing ? editedNote : note;

  const prescriptionArray = Array.isArray(displayNote?.prescription)
    ? displayNote.prescription
    : typeof displayNote?.prescription === 'string'
    ? [{ drug: displayNote.prescription, dose: '', frequency: '' }]
    : [];

  if (loading) {
    return (
      <aside className="w-96 flex flex-col bg-white border-l border-gray-200 h-full shrink-0 max-[1024px]:w-full max-[1024px]:border-l-0 max-[1024px]:border-t">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
          <span className="text-sm font-semibold text-navy">Clinical Note</span>
          <span className="px-2 py-0.5 text-[10.5px] font-semibold rounded-md uppercase tracking-[0.25px] bg-teal-light text-teal-dark animate-pulse">Generating</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
          <div className="flex flex-col items-center justify-center gap-3 text-gray-500 py-16 text-center text-sm font-medium">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-teal">
              <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Processing audio...
          </div>
        </div>
      </aside>
    );
  }

  // Note fields mapping definitions
  const clinicalFields = [
    { key: 'chief_complaint', label: 'Chief Complaint' },
    { key: 'history', label: 'History' },
    { key: 'examination', label: 'Examination' },
    { key: 'diagnosis', label: 'Diagnosis' },
  ];

  const handoutFields = [
    { key: 'followup', label: 'Follow-up' },
  ];

  const handleWhatsAppSend = () => {
    const activeNote = editing ? editedNote : note;
    if (!activeNote) return;
    const msg = generatePrescriptionMessage(patient, doctor, activeNote);
    shareOnWhatsApp(whatsappPhone, msg);
  };

  return (
    <aside className="w-96 flex flex-col bg-white border-l border-gray-200 h-full shrink-0 max-[1024px]:w-full max-[1024px]:border-l-0 max-[1024px]:border-t">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <span className="text-sm font-semibold text-navy">Clinical Note</span>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 text-[10.5px] font-semibold rounded-md uppercase tracking-[0.25px] bg-teal-light text-teal-dark">
            {isTranscribing ? 'Transcribing' : editing ? 'Editing' : 'Generated'}
          </span>
          {activeTemplate === 'soap' && note && (
            <button
              className={`flex items-center justify-center text-gray-400 hover:text-navy border border-gray-200 rounded-lg bg-white cursor-pointer transition-all ${editing ? 'text-red-brand border-red-brand/20 bg-red-brand-light hover:text-red-brand' : ''}`}
              onClick={toggleEditing}
              title={editing ? 'Save and close editing' : 'Edit note'}
              style={{ width: '28px', height: '28px' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {editing ? (
                  <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                ) : (
                  <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Template selector tabs */}
      <div className="flex border-b border-gray-100 shrink-0 bg-gray-50/50">
        <button
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${activeTemplate === 'soap' ? 'border-teal text-teal-dark bg-white font-bold' : 'border-transparent text-gray-500 hover:text-navy hover:bg-gray-50/50'}`}
          onClick={() => {
            setActiveTemplate('soap');
            setEditing(false);
          }}
        >
          Comprehensive SOAP
        </button>
        <button
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${activeTemplate === 'rx' ? 'border-teal text-teal-dark bg-white font-bold' : 'border-transparent text-gray-500 hover:text-navy hover:bg-gray-50/50'}`}
          onClick={() => {
            setActiveTemplate('rx');
            setEditing(true);
          }}
        >
          Quick Prescription (Rx)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
        {noteError && activeTemplate === 'soap' && (
          <div className="p-3 rounded-xl bg-red-brand-light text-red-brand text-xs flex items-center gap-2 mb-2 border border-red-brand/10">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Note may be incomplete: {noteError}
          </div>
        )}

        {activeTemplate === 'soap' && !note ? (
          <div className="flex flex-col items-center justify-center gap-3 text-gray-400 py-16 text-center text-sm font-medium h-full">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
            </svg>
            <span>Record a consultation to generate a clinical note</span>
          </div>
        ) : (
          <>
            {/* Compartment A — Clinical Assessment / Text Notes */}
            {activeTemplate === 'soap' ? (
              <div className="p-4 rounded-xl border mb-3 bg-gray-50/50 border-gray-200/60 text-left">
                <div className="flex items-center justify-between font-semibold text-sm text-navy mb-1">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-gray-500" />
                    Clinical Assessment
                  </span>
                  <span className="px-1.5 py-0.5 text-[9.5px] font-mono rounded font-semibold uppercase bg-gray-200 text-gray-600">Internal Only</span>
                </div>
                <div className="text-[11.5px] text-gray-500 mb-4">Not included in the printed prescription copy.</div>
                
                {clinicalFields.map(({ key, label }) => {
                  if (!editing && (!displayNote || !displayNote[key])) return null;
                  return (
                    <div key={key} className="mb-4 last:mb-0">
                      <div className="text-xs font-bold text-gray-600 mb-1.5">{label}</div>
                      {editing ? (
                        <textarea
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-none"
                          value={editedNote?.[key] || ''}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          onBlur={() => handleSave(false)}
                          rows={key === 'history' || key === 'examination' ? 4 : 2}
                          placeholder={`Enter ${label.toLowerCase()}...`}
                        />
                      ) : (
                        <div className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 rounded-xl p-3 shadow-xs">{displayNote?.[key]}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Quick Medicine Notes template */
              <div className="p-4 rounded-xl border mb-3 bg-gray-50/50 border-gray-200/60 text-left">
                <div className="flex items-center justify-between font-semibold text-sm text-navy mb-3">
                  <span className="flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-gray-500" />
                    Clinical Notes / Summary
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <textarea
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                      value={editedNote?.notes || ''}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      onBlur={() => {
                        if (recordingId) handleSave(false);
                      }}
                      rows={6}
                      placeholder="Type clinical notes, findings, or diagnosis summary here..."
                      disabled={isTranscribing}
                    />
                  </div>

                  {/* Dictation controls */}
                  <div className="flex items-center justify-between bg-white border border-gray-150 rounded-xl p-2.5 px-3.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      {isNotesRecording ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-red-brand animate-pulse" />
                          <span className="text-xs font-mono font-bold text-red-brand">
                            Recording... {Math.floor(notesRecordTime / 60)}:{String(notesRecordTime % 60).padStart(2, '0')}
                          </span>
                        </>
                      ) : isTranscribing ? (
                        <>
                          <svg className="animate-spin text-teal" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <circle cx="12" cy="12" r="10" strokeDasharray="16" />
                          </svg>
                          <span className="text-xs font-semibold text-teal-dark animate-pulse">Transcribing...</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Dictate summary directly</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={isNotesRecording ? stopNotesRecording : startNotesRecording}
                      disabled={isTranscribing}
                      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all border-none ${
                        isNotesRecording
                          ? 'bg-red-brand text-white hover:bg-red-700 animate-pulse'
                          : 'bg-teal-light text-teal-dark hover:bg-teal hover:text-navy'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {isNotesRecording ? (
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                        ) : (
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
                        )}
                      </svg>
                      {isNotesRecording ? 'Stop' : 'Record'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Compartment B — Patient Handout (Printable) */}
            <div className="p-4 rounded-xl border mb-3 bg-teal-light/5 border-teal/10 text-left">
              <div className="flex items-center justify-between font-semibold text-sm text-navy mb-1">
                <span className="flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-teal" />
                  Patient Handout
                </span>
                <span className="px-1.5 py-0.5 text-[9.5px] font-mono rounded font-semibold uppercase bg-teal-light text-teal-dark">Rx & Shared</span>
              </div>
              <div className="text-[11.5px] text-gray-500 mb-4">Printed on paper and sent to patients.</div>

              {/* Prescription list */}
              {(editing || prescriptionArray.length > 0) && (
                <div className="mb-4 last:mb-0">
                  <div className="text-xs font-bold text-gray-600 mb-1.5">Prescription</div>
                  {editing ? (
                    <div className="flex flex-col gap-2">
                      {(Array.isArray(editedNote?.prescription) ? editedNote.prescription : []).map((med, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <DrugSearchInput
                            value={typeof med === 'object' ? med.drug || '' : String(med)}
                            onChange={(val) => handlePrescriptionChange(idx, 'drug', val)}
                            onBlur={() => {
                              if (recordingId) handleSave(false);
                            }}
                            placeholder="Drug name..."
                          />
                          <input
                            type="text"
                            value={typeof med === 'object' ? med.dose || '' : ''}
                            onChange={(e) => handlePrescriptionChange(idx, 'dose', e.target.value)}
                            onBlur={() => {
                              if (recordingId) handleSave(false);
                            }}
                            placeholder="Dose"
                            className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal"
                          />
                          <input
                            type="text"
                            value={typeof med === 'object' ? med.frequency || '' : ''}
                            onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                            onBlur={() => {
                              if (recordingId) handleSave(false);
                            }}
                            placeholder="Frequency"
                            className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal"
                          />
                          <button className="p-1 text-gray-400 hover:text-red-brand bg-transparent border-none cursor-pointer flex items-center justify-center" onClick={() => removePrescriptionRow(idx)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark hover:text-teal bg-transparent border-none cursor-pointer mt-1 self-start" onClick={addPrescriptionRow}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Medication
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {prescriptionArray.map((med, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-700 shadow-xs">
                          <span className="font-medium text-navy">
                            {typeof med === 'object' ? med.drug || 'Unknown' : med}
                          </span>
                          {typeof med === 'object' && (med.dose || med.frequency) && (
                            <span className="text-xs font-semibold text-teal-dark bg-teal-light px-2 py-0.5 rounded">
                              {med.dose}{med.frequency ? ` · ${med.frequency}` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Follow up */}
              {handoutFields.map(({ key, label }) => {
                if (!editing && (!displayNote || !displayNote[key])) return null;
                return (
                  <div key={key} className="mb-4 last:mb-0">
                    <div className="text-xs font-bold text-gray-600 mb-1.5">{label}</div>
                    {editing ? (
                      <textarea
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-none"
                        value={editedNote?.[key] || ''}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        onBlur={() => {
                          if (recordingId) handleSave(false);
                        }}
                        rows={2}
                        placeholder={`Enter ${label.toLowerCase()}...`}
                      />
                    ) : (
                      <div className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 rounded-xl p-3 shadow-xs">{displayNote?.[key]}</div>
                    )}
                  </div>
                );
              })}

              {/* WhatsApp sharing controls */}
              {!editing && (
                <div className="mt-4 p-3 bg-white border border-gray-100 rounded-xl shadow-xs">
                  <div className="text-xs font-bold text-navy mb-2">📲 Send to Patient WhatsApp</div>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="WhatsApp number..."
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal"
                    />
                    <button className="inline-flex items-center justify-center px-4 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border-none" onClick={handleWhatsAppSend}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                        <path d="M12.031 2C6.446 2 1.92 6.509 1.916 12.067c-.002 1.777.466 3.511 1.355 5.038L2 22l5.068-1.32c1.478.801 3.136 1.222 4.829 1.229h.004c5.584 0 10.113-4.509 10.117-10.07A10.007 10.007 0 0 0 12.031 2zm5.726 13.882c-.314.876-1.572 1.606-2.177 1.706-.554.092-1.282.164-3.79-.824-3.21-1.264-5.263-4.526-5.424-4.739-.161-.212-1.3-1.722-1.3-3.284 0-1.562.822-2.327 1.118-2.628.298-.3.65-.375.867-.375h.619c.198 0 .463-.075.725.556.262.631.897 2.18.974 2.332.078.152.13.328.026.531-.102.203-.153.328-.306.506-.153.178-.323.398-.461.534-.153.152-.314.318-.135.62.18.3.8 1.309 1.714 2.115 1.173 1.039 2.16 1.361 2.463 1.512.302.152.48.127.66-.076.18-.203.774-.897.98-1.201.206-.304.412-.253.695-.152.284.101 1.796.837 2.106.988.31.152.516.228.593.354.077.127.077.734-.237 1.61z"/>
                      </svg>
                      Share
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Follow-up TODOs */}
            {recordingId && (
              <div className="mb-4 last:mb-0" style={{ marginTop: '4px' }}>
                <FollowUpTodos recordingId={recordingId} initialTodos={[]} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {(note || activeTemplate === 'rx') && (
        <div className="flex gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal hover:bg-teal-dark text-navy font-semibold text-xs rounded-xl transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed flex-1" onClick={() => handleSave(true)} disabled={saving || saved}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {saved ? <polyline points="20 6 9 17 4 12" /> : <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />}
            </svg>
            {saving ? 'Saving...' : saved ? 'Saved' : editing ? 'Save Visit' : 'Save Visit'}
          </button>

          <button className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-xs rounded-xl transition-all cursor-pointer" onClick={() => setShowExportModal(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Print / Export
          </button>

          <button className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-xs rounded-xl transition-all cursor-pointer" onClick={handleCopy}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copyStatus || 'Copy'}
          </button>
        </div>
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        note={editing ? editedNote : note}
        patient={patient}
        doctor={doctor}
      />
    </aside>
  );
}
