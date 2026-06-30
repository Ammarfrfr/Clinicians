import { useState, useEffect, useRef } from 'react';
import { Stethoscope, ClipboardList } from 'lucide-react';
import { apiClient } from '../config.js';
import { copyNoteToClipboard } from '../utils/exportPDF.js';
import { FollowUpTodos } from './FollowUpTodos.jsx';
import { DrugSearchInput } from './DrugSearchInput.jsx';
import { ExportModal } from './ExportModal.jsx';
import { shareOnWhatsApp, generatePrescriptionMessage } from '../utils/whatsappHelper.js';
import { checkDrugAllergy } from '../utils/allergyChecker.js';
import exercisesDb from '../data/exercises.json';
import { Activity } from 'lucide-react';

export function NotePanel({ note, noteError, loading, patient, doctor, transcript, recordingId, onSave, onCancel, isOpenMobile, onCloseMobile, desktopWidth, template, lastVoiceCommand, setLastVoiceCommand }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [editing, setEditing] = useState(false);
  const [editedNote, setEditedNote] = useState({
    chief_complaint: '',
    history: '',
    examination: '',
    diagnosis: '',
    prescription: [],
    followup: '',
    exercises: [],
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [sharingPdf, setSharingPdf] = useState(false);

  // Local Dictation Audio Recording States & Refs (Per-section)
  const [recordingSection, setRecordingSection] = useState(null);
  const [transcribingSection, setTranscribingSection] = useState(null);
  const [notesRecordTime, setNotesRecordTime] = useState(0);
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

  // Reset edit state when note changes or patient changes
  useEffect(() => {
    if (note) {
      const parsedNote = JSON.parse(JSON.stringify(note));
      if (!parsedNote.exercises) parsedNote.exercises = [];
      setEditedNote(parsedNote);
      setEditing(false);
    } else {
      // Clear values when note is null (no active session note)
      const initialNote = {
        prescription: [],
        followup: '',
        exercises: [],
      };
      if (template && template.sections) {
        template.sections.forEach((s) => {
          initialNote[s.key] = '';
        });
      } else {
        initialNote.chief_complaint = '';
        initialNote.history = '';
        initialNote.examination = '';
        initialNote.diagnosis = '';
      }
      setEditedNote(initialNote);
      setEditing(true);
    }
  }, [note, patient?._id, template]);

  // Handle voice commands from useRecorder
  useEffect(() => {
    if (lastVoiceCommand && !loading) {
      const { command, args } = lastVoiceCommand;
      console.log('🔔 NotePanel executing voice command:', command, args);
      
      if (command === 'save') {
        // Trigger save and finalize
        handleSave(true);
        if (setLastVoiceCommand) setLastVoiceCommand(null);
      } else if (command === 'followup') {
        // Update followup field
        setEditedNote(prev => {
          const updated = { ...prev, followup: args };
          if (recordingId) {
            handleSaveDirectly(updated, false);
          }
          return updated;
        });
        if (setLastVoiceCommand) setLastVoiceCommand(null);
      }
    }
  }, [lastVoiceCommand, loading, recordingId, setLastVoiceCommand]);

  // Clean up recording timers/streams on unmount
  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearInterval(notesTimerRef.current);
      if (notesStreamRef.current) {
        notesStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Micro audio recorder handlers for specific sections
  const startSectionRecording = async (section) => {
    if (recordingSection || transcribingSection) return;
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
        await processSectionAudio(section, audioBlob);
      };

      mediaRecorder.start();
      setRecordingSection(section);
      setNotesRecordTime(0);

      notesTimerRef.current = setInterval(() => {
        setNotesRecordTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(`Failed to start recording for ${section}:`, err);
      alert('Microphone access denied or error starting recording.');
    }
  };

  const stopSectionRecording = () => {
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
    setRecordingSection(null);
  };

  const processSectionAudio = async (section, audioBlob) => {
    if (audioBlob.size === 0) return;
    setTranscribingSection(section);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'dictation.webm');
      formData.append('section', section);

      // Get current value to merge/append
      let existingValue = '';
      if (section === 'prescription') {
        existingValue = JSON.stringify(editedNote?.prescription || []);
      } else {
        existingValue = editedNote?.[section] || '';
      }
      formData.append('existingValue', existingValue);

      const response = await apiClient.post('/api/analyze/dictate-section', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success && response.data.data.value !== undefined) {
        const newValue = response.data.data.value;

        setEditedNote(prev => {
          const updated = {
            ...prev,
            [section]: newValue
          };

          // Autosave if recordingId exists
          if (recordingId) {
            handleSaveDirectly(updated);
          }
          return updated;
        });
      }
    } catch (err) {
      console.error(`Dictation processing error for ${section}:`, err);
      alert('Processing failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setTranscribingSection(null);
    }
  };

  const handleSaveDirectly = async (noteToSave, isFinalizing = false) => {
    if (!noteToSave) return;
    setSaving(true);
    try {
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

  const handleSave = async (isFinalizing = false) => {
    await handleSaveDirectly(editing ? editedNote : note, isFinalizing);
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
      <aside className="w-96 flex flex-col bg-white border-l border-gray-200 h-full shrink-0 max-[768px]:w-full max-[768px]:border-l-0 max-[768px]:border-t">
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
  const clinicalFields = template?.sections || [
    { key: 'chief_complaint', label: 'Chief Complaint', rows: 2, placeholder: 'Main symptom, severity, duration...' },
    { key: 'history', label: 'History', rows: 4, placeholder: 'Patient history, medications tried, risk factors...' },
    { key: 'examination', label: 'Examination', rows: 4, placeholder: 'Physical findings, vitals, test results...' },
    { key: 'diagnosis', label: 'Diagnosis', rows: 2, placeholder: 'Clinical impression or confirmed diagnosis...' },
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

  const handleSharePdfWhatsApp = async () => {
    const activeNote = editing ? editedNote : note;
    if (!activeNote) return;
    
    setSharingPdf(true);
    try {
      const response = await apiClient.post('/api/share/prescription', {
        clinicalNote: activeNote,
        patient,
        doctor: {
          name: doctor?.profile?.name || doctor?.name,
          qualification: doctor?.profile?.qualification,
          hospital: doctor?.profile?.hospital,
        },
      });
      
      if (response.data.success && response.data.data?.url) {
        const shareUrl = response.data.data.url;
        const docName = doctor?.profile?.name || 'Clinician';
        const msg = `Hello ${patient?.firstName || 'Patient'}, here is your digital prescription from Dr. ${docName}: ${shareUrl}`;
        shareOnWhatsApp(whatsappPhone, msg);
      } else {
        alert('Failed to generate PDF share link.');
      }
    } catch (err) {
      console.error('Error sharing PDF on WhatsApp:', err);
      alert('Error sharing PDF: ' + (err.response?.data?.error || err.message));
    } finally {
      setSharingPdf(false);
    }
  };

  const renderMicButton = (section) => {
    const isRecording = recordingSection === section;
    const isTranscribing = transcribingSection === section;

    return (
      <div className="flex items-center gap-1.5 shrink-0">
        {isRecording && (
          <span className="text-[10px] font-mono font-bold text-red-brand animate-pulse">
            {Math.floor(notesRecordTime / 60)}:{String(notesRecordTime % 60).padStart(2, '0')}
          </span>
        )}
        {isTranscribing && (
          <svg className="animate-spin text-teal" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10" strokeDasharray="16" />
          </svg>
        )}
        <button
          type="button"
          onClick={isRecording ? stopSectionRecording : () => startSectionRecording(section)}
          disabled={transcribingSection !== null && transcribingSection !== section}
          className={`flex items-center justify-center border-none rounded-lg cursor-pointer transition-all ${
            isRecording
              ? 'bg-red-brand text-white hover:bg-red-700 p-1 animate-pulse'
              : 'bg-teal-light text-teal-dark hover:bg-teal hover:text-navy p-1'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          style={{ width: '22px', height: '22px' }}
          title={isRecording ? 'Stop recording' : 'Dictate for this section'}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {isRecording ? (
              <rect x="4" y="4" width="16" height="16" rx="2" />
            ) : (
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
            )}
          </svg>
        </button>
      </div>
    );
  };

  return (
    <aside
      style={!isOpenMobile && desktopWidth ? { width: `${desktopWidth}px` } : undefined}
      className={`flex flex-col bg-white h-full shrink-0 transition-all duration-200 border-l border-gray-200
        ${isOpenMobile ? 'fixed inset-0 z-[100] w-full h-full' : 'hidden md:flex w-96'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center">
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden block bg-transparent border-none text-navy p-1 cursor-pointer mr-2 flex items-center justify-center"
              title="Back to Recorder"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}
          <span className="text-sm font-semibold text-navy">Clinical Note</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 text-[10.5px] font-semibold rounded-md uppercase tracking-[0.25px] bg-teal-light text-teal-dark">
            {transcribingSection ? 'Transcribing' : editing ? 'Editing' : 'Generated'}
          </span>
          {note && (
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
        {noteError && (
          <div className="p-3 rounded-xl bg-red-brand-light text-red-brand text-xs flex items-center gap-2 mb-2 border border-red-brand/10">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Note may be incomplete: {noteError}
          </div>
        )}

        <>
          {/* Compartment A — Clinical Assessment / Text Notes */}
          <div className="p-4 rounded-xl border mb-3 bg-gray-50/50 border-gray-200/60 text-left">
            <div className="flex items-center justify-between font-semibold text-sm text-navy mb-1">
              <span className="flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-gray-500" />
                Clinical Assessment
              </span>
              <span className="px-1.5 py-0.5 text-[9.5px] font-mono rounded font-semibold uppercase bg-gray-200 text-gray-600">Internal Only</span>
            </div>
            <div className="text-[11.5px] text-gray-500 mb-4">Not included in the printed prescription copy.</div>
            
            {clinicalFields.map(({ key, label, rows, placeholder }) => {
              if (!editing && (!displayNote || !displayNote[key])) return null;
              return (
                <div key={key} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs font-bold text-gray-600">{label}</div>
                    {editing && renderMicButton(key)}
                  </div>
                  {editing ? (
                    <textarea
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-none"
                      value={editedNote?.[key] || ''}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      onBlur={() => {
                        if (recordingId) handleSave(false);
                      }}
                      rows={rows || 3}
                      placeholder={placeholder || `Enter ${label.toLowerCase()} or record at side...`}
                    />
                  ) : (
                    <div className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 rounded-xl p-3 shadow-xs whitespace-pre-wrap">{displayNote?.[key]}</div>
                  )}
                </div>
              );
            })}
          </div>

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
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-bold text-gray-600">Prescription</div>
                  {editing && renderMicButton('prescription')}
                </div>
                {editing ? (
                  <div className="flex flex-col gap-2">
                    {(Array.isArray(editedNote?.prescription) ? editedNote.prescription : []).map((med, idx) => {
                      const warning = checkDrugAllergy(typeof med === 'object' ? med.drug : String(med), patient?.medicalInfo?.allergies);
                      return (
                        <div key={idx} className="flex flex-col gap-1 w-full mb-1">
                          <div className="flex gap-1.5 items-center w-full">
                            <div className="flex-1 min-w-0">
                              <DrugSearchInput
                                value={typeof med === 'object' ? med.drug || '' : String(med)}
                                onChange={(val) => handlePrescriptionChange(idx, 'drug', val)}
                                onBlur={() => {
                                  if (recordingId) handleSave(false);
                                }}
                                placeholder="Drug name..."
                                hideIcon={true}
                              />
                            </div>
                            <input
                              type="text"
                              value={typeof med === 'object' ? med.dose || '' : ''}
                              onChange={(e) => handlePrescriptionChange(idx, 'dose', e.target.value)}
                              onBlur={() => {
                                  if (recordingId) handleSave(false);
                              }}
                              placeholder="Dose"
                              className="w-10 px-1 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal shrink-0 placeholder:text-[10px]"
                            />
                            <input
                              type="text"
                              value={typeof med === 'object' ? med.frequency || '' : ''}
                              onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                              onBlur={() => {
                                  if (recordingId) handleSave(false);
                              }}
                              placeholder="Frequency"
                              className="w-16 px-1 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal shrink-0 placeholder:text-[10px]"
                            />
                            <button className="p-1 text-gray-400 hover:text-red-brand bg-transparent border-none cursor-pointer flex items-center justify-center shrink-0" onClick={() => removePrescriptionRow(idx)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                          {warning && (
                            <div className="text-[10px] font-semibold text-red-brand bg-red-brand-light/30 border border-red-brand/10 px-2 py-0.5 rounded-md self-start flex items-center gap-1 mt-0.5">
                              <span>⚠️</span>
                              <span>{warning.message}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark hover:text-teal bg-transparent border-none cursor-pointer mt-1 self-start" onClick={addPrescriptionRow}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add Medication
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {prescriptionArray.map((med, idx) => {
                      const drugName = typeof med === 'object' ? med.drug || 'Unknown' : med;
                      const warning = checkDrugAllergy(drugName, patient?.medicalInfo?.allergies);
                      return (
                        <div key={idx} className="flex flex-col gap-1 bg-white border border-gray-100 rounded-xl p-3 shadow-xs text-left">
                          <div className="flex justify-between items-center text-sm text-gray-700">
                            <span className="font-medium text-navy">
                              {drugName}
                            </span>
                            {typeof med === 'object' && (med.dose || med.frequency) && (
                              <span className="text-xs font-semibold text-teal-dark bg-teal-light px-2 py-0.5 rounded">
                                {med.dose}{med.frequency ? ` · ${med.frequency}` : ''}
                              </span>
                            )}
                          </div>
                          {warning && (
                            <div className="text-[10px] font-semibold text-red-brand bg-red-brand-light/30 border border-red-brand/10 px-2 py-0.5 rounded-md self-start flex items-center gap-1 mt-1">
                              <span>⚠️</span>
                              <span>{warning.message}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Follow up */}
            {handoutFields.map(({ key, label }) => {
              if (!editing && (!displayNote || !displayNote[key])) return null;
              return (
                <div key={key} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs font-bold text-gray-600">{label}</div>
                    {editing && renderMicButton(key)}
                  </div>
                  {editing ? (
                    <textarea
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-none"
                      value={editedNote?.[key] || ''}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      onBlur={() => {
                        if (recordingId) handleSave(false);
                      }}
                      rows={2}
                      placeholder={`Enter ${label.toLowerCase()} or record at side...`}
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
                  <button 
                    disabled={sharingPdf}
                    className="inline-flex items-center justify-center px-4 py-1.5 bg-[#25D366] hover:bg-[#20ba59] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border-none" 
                    onClick={handleSharePdfWhatsApp}
                  >
                    {sharingPdf ? (
                      <span className="flex items-center gap-1">
                        <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <circle cx="12" cy="12" r="10" strokeDasharray="16" />
                        </svg>
                        PDF...
                      </span>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                          <path d="M12.031 2C6.446 2 1.92 6.509 1.916 12.067c-.002 1.777.466 3.511 1.355 5.038L2 22l5.068-1.32c1.478.801 3.136 1.222 4.829 1.229h.004c5.584 0 10.113-4.509 10.117-10.07A10.007 10.007 0 0 0 12.031 2zm5.726 13.882c-.314.876-1.572 1.606-2.177 1.706-.554.092-1.282.164-3.79-.824-3.21-1.264-5.263-4.526-5.424-4.739-.161-.212-1.3-1.722-1.3-3.284 0-1.562.822-2.327 1.118-2.628.298-.3.65-.375.867-.375h.619c.198 0 .463-.075.725.556.262.631.897 2.18.974 2.332.078.152.13.328.026.531-.102.203-.153.328-.306.506-.153.178-.323.398-.461.534-.153.152-.314.318-.135.62.18.3.8 1.309 1.714 2.115 1.173 1.039 2.16 1.361 2.463 1.512.302.152.48.127.66-.076.18-.203.774-.897.98-1.201.206-.304.412-.253.695-.152.284.101 1.796.837 2.106.988.31.152.516.228.593.354.077.127.077.734-.237 1.61z"/>
                        </svg>
                        Share PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Compartment C — Exercises & Rehab (Printable) */}
          <div className="p-4 rounded-xl border mb-3 bg-teal-light/5 border-teal/10 text-left">
            <div className="flex items-center justify-between font-semibold text-sm text-navy mb-1">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal" />
                Prescribed Rehabilitation
              </span>
              <span className="px-1.5 py-0.5 text-[9.5px] font-mono rounded font-semibold uppercase bg-teal-light text-teal-dark">Rx & Printed</span>
            </div>
            <div className="text-[11.5px] text-gray-500 mb-4">Prescribe standard orthopedic rehab exercises.</div>

            {editing ? (
              <div className="flex flex-col gap-3">
                {/* Selected exercises list with sets/reps controls */}
                {editedNote.exercises && editedNote.exercises.length > 0 && (
                  <div className="flex flex-col gap-2 mb-2">
                    {editedNote.exercises.map((ex, idx) => (
                      <div key={idx} className="bg-white border border-gray-150 rounded-xl p-3 shadow-xs flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-navy">{ex.name} <span className="text-[9px] font-mono font-medium text-gray-400">({ex.category})</span></span>
                          <button
                            type="button"
                            className="p-1 text-gray-400 hover:text-red-brand bg-transparent border-none cursor-pointer flex items-center justify-center"
                            onClick={() => {
                              setEditedNote(prev => ({
                                ...prev,
                                exercises: prev.exercises.filter((_, i) => i !== idx)
                              }));
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Sets</label>
                            <input
                              type="text"
                              value={ex.sets || ''}
                              placeholder="e.g. 3"
                              onChange={(e) => {
                                setEditedNote(prev => {
                                  const updated = [...prev.exercises];
                                  updated[idx] = { ...updated[idx], sets: e.target.value };
                                  return { ...prev, exercises: updated };
                                });
                              }}
                              className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Reps</label>
                            <input
                              type="text"
                              value={ex.reps || ''}
                              placeholder="e.g. 10"
                              onChange={(e) => {
                                setEditedNote(prev => {
                                  const updated = [...prev.exercises];
                                  updated[idx] = { ...updated[idx], reps: e.target.value };
                                  return { ...prev, exercises: updated };
                                });
                              }}
                              className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Frequency</label>
                            <input
                              type="text"
                              value={ex.frequency || ''}
                              placeholder="e.g. Twice Daily"
                              onChange={(e) => {
                                setEditedNote(prev => {
                                  const updated = [...prev.exercises];
                                  updated[idx] = { ...updated[idx], frequency: e.target.value };
                                  return { ...prev, exercises: updated };
                                });
                              }}
                              className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new exercises dropdown & categories */}
                <div className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-150 rounded-xl">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Prescribe Exercise</div>
                  <select
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-teal"
                    value=""
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const ex = exercisesDb.find(item => item.id === selectedId);
                      if (!ex) return;
                      
                      setEditedNote(prev => {
                        const exercises = prev.exercises ? [...prev.exercises] : [];
                        if (exercises.some(item => item.id === ex.id)) return prev;

                        let setsStr = "3";
                        let repsStr = "10";
                        if (ex.defaultSetsReps.includes("sets")) {
                          setsStr = ex.defaultSetsReps.split("sets")[0].trim();
                        }
                        if (ex.defaultSetsReps.includes("reps")) {
                          const parts = ex.defaultSetsReps.split("of");
                          if (parts.length > 1) {
                            repsStr = parts[1].replace("reps", "").trim();
                          }
                        }

                        exercises.push({
                          id: ex.id,
                          name: ex.name,
                          category: ex.category,
                          sets: setsStr,
                          reps: repsStr,
                          frequency: "Twice Daily",
                          instruction: ex.instruction
                        });
                        return { ...prev, exercises };
                      });
                    }}
                  >
                    <option value="">-- Choose Exercise --</option>
                    {['Knee', 'Hip', 'Low Back', 'Shoulder', 'Neck', 'Wrist'].map(cat => (
                      <optgroup key={cat} label={cat}>
                        {exercisesDb
                          .filter(item => item.category === cat)
                          .map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                  
                  {/* Presets */}
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase self-center mr-1">Presets:</span>
                    <button
                      type="button"
                      className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-gray-200 hover:bg-gray-50 rounded text-teal-dark cursor-pointer transition-all"
                      onClick={() => {
                        setEditedNote(prev => {
                          const exercises = prev.exercises ? [...prev.exercises] : [];
                          const kneePrescribed = ['short_arc_quads', 'quad_sets', 'knee_slides', 'ankle_pumps'];
                          
                          kneePrescribed.forEach(exId => {
                            const ex = exercisesDb.find(item => item.id === exId);
                            if (ex && !exercises.some(item => item.id === ex.id)) {
                              exercises.push({
                                id: ex.id,
                                name: ex.name,
                                category: ex.category,
                                sets: "3",
                                reps: "10",
                                frequency: "Twice Daily",
                                instruction: ex.instruction
                              });
                            }
                          });
                          return { ...prev, exercises };
                        });
                      }}
                    >
                      Knee Routine
                    </button>
                    <button
                      type="button"
                      className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-gray-200 hover:bg-gray-50 rounded text-teal-dark cursor-pointer transition-all"
                      onClick={() => {
                        setEditedNote(prev => {
                          const exercises = prev.exercises ? [...prev.exercises] : [];
                          const backPrescribed = ['press_up_sphinx', 'knee_to_chest', 'cats_and_dogs'];
                          
                          backPrescribed.forEach(exId => {
                            const ex = exercisesDb.find(item => item.id === exId);
                            if (ex && !exercises.some(item => item.id === ex.id)) {
                              exercises.push({
                                id: ex.id,
                                name: ex.name,
                                category: ex.category,
                                sets: "3",
                                reps: "10",
                                frequency: "Twice Daily",
                                instruction: ex.instruction
                              });
                            }
                          });
                          return { ...prev, exercises };
                        });
                      }}
                    >
                      Low Back Routine
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {displayNote?.exercises && displayNote.exercises.length > 0 ? (
                  displayNote.exercises.map((ex, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 shadow-xs text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-navy">{ex.name}</span>
                        <span className="text-[10px] font-semibold text-teal-dark bg-teal-light px-2 py-0.5 rounded">
                          {ex.sets} sets · {ex.reps} reps · {ex.frequency}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1.5 leading-relaxed">{ex.instruction}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 italic py-2 text-center">No rehabilitation exercises prescribed.</div>
                )}
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
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
        <button className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal hover:bg-teal-dark text-navy font-semibold text-xs rounded-xl transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed flex-1" onClick={() => handleSave(true)} disabled={saving || saved}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {saved ? <polyline points="20 6 9 17 4 12" /> : <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />}
          </svg>
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Visit'}
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
