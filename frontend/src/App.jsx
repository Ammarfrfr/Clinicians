import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { PatientBar } from './components/PatientBar';
import { Recorder } from './components/Recorder';
import { Transcript } from './components/Transcript';
import { NotePanel } from './components/NotePanel';
import { Vitals } from './components/Vitals';
import { PastVisits } from './components/PastVisits';
import { AddPatientModal } from './AddPatientModal';
import { EditPatientModal } from './EditPatientModal';
import { apiClient } from './config.js';
import { useRecorder } from './useRecorder';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReminderDashboard } from './components/ReminderDashboard';
import { PatientFilesGrid } from './components/PatientFilesGrid';
import { OnboardingModal } from './components/OnboardingModal';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { NOTE_TEMPLATES, getTemplateForSpecialization, getAllTemplateOptions } from './data/noteTemplates.js';
import { getPendingCount, syncPendingRecordings } from './utils/offlineQueue.js';

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse path manually because useParams() returns empty values when called outside of <Routes>
  const pathParts = location.pathname.split('/');
  let urlPatientId = null;
  let urlTab = 'record';
  if (pathParts[1] === 'transcribe') {
    if (pathParts[2]) urlPatientId = pathParts[2];
    if (pathParts[3]) urlTab = pathParts[3];
  }

  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [patients, setPatients] = useState([]);
  const [notesToday, setNotesToday] = useState(0);
  const [hoursSaved, setHoursSaved] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [noteSavedTrigger, setNoteSavedTrigger] = useState(0);

  // Layout states: resizing and mobile panel visibility
  const [showNotePanelMobile, setShowNotePanelMobile] = useState(false);
  const [notePanelWidth, setNotePanelWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (mouseDownEvent) => {
    setIsResizing(true);
    mouseDownEvent.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      // Calculate width from the right side of the screen
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 280 && newWidth < 600) {
        setNotePanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const activePatientId = urlPatientId;
  const activeTab = urlTab;

  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    const spec = currentUser?.profile?.specialization;
    return getTemplateForSpecialization(spec);
  });

  const recorder = useRecorder(activePatientId, {
    templateSections: selectedTemplate?.sections,
  });
  const activePatient = patients.find((p) => p._id === activePatientId);

  // Keep template in sync with currentUser specialization
  useEffect(() => {
    if (currentUser?.profile?.specialization) {
      const spec = currentUser.profile.specialization;
      setSelectedTemplate(getTemplateForSpecialization(spec));
    }
  }, [currentUser]);

  // Offline status & background sync
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);

  const updatePendingCount = async () => {
    const count = await getPendingCount();
    setPendingOfflineCount(count);
  };

  const handleSync = async () => {
    try {
      const result = await syncPendingRecordings(apiClient);
      if (result.synced > 0) {
        console.log(`Successfully synced ${result.synced} recordings!`);
        alert(`Synced ${result.synced} offline recording(s) successfully!`);
        setNoteSavedTrigger((prev) => prev + 1); // Refresh past visits list
      }
      await updatePendingCount();
    } catch (err) {
      console.error('Error syncing recordings:', err);
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      console.log('🌐 Browser online. Triggering sync...');
      await handleSync();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    updatePendingCount();

    // Listen to service worker postMessage events
    const handleMessage = async (e) => {
      if (e.data && e.data.type === 'SYNC_PENDING_RECORDINGS') {
        console.log('SW requested offline sync...');
        await handleSync();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Update pending count if a recording is saved offline
  useEffect(() => {
    if (recorder.offlineSaved) {
      updatePendingCount();
    }
  }, [recorder.offlineSaved]);

  // Voice Command Toast
  const [voiceCommandToast, setVoiceCommandToast] = useState(null);
  useEffect(() => {
    if (recorder.lastVoiceCommand) {
      setVoiceCommandToast(recorder.lastVoiceCommand);
      const timer = setTimeout(() => {
        setVoiceCommandToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [recorder.lastVoiceCommand]);

  // Listen to unauthorized events to force sign-in redirection
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      setPatients([]);
      navigate('/login');
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [navigate]);

  // Dropdown outside click handler
  useEffect(() => {
    if (!showProfileMenu) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.avatar-container')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showProfileMenu]);

  const checkAuth = async () => {
    setAuthChecking(true);
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setAuthChecking(false);
      return;
    }

    try {
      const response = await apiClient.get('/api/auth/me');
      const data = response.data;
      if (data.success && data.data) {
        setCurrentUser(data.data);
        if (data.data.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          await fetchPatients();
          // Dynamic redirection depending on onboarding completion
          if (!data.data.onboardingComplete) {
            navigate('/onboarding', { replace: true });
          } else if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
            navigate('/transcribe', { replace: true });
          }
        }
      } else {
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Auth verification failed:', err);
      localStorage.removeItem('token');
    } finally {
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/patients');
      const data = response.data;
      if (data.success && data.data) {
        setPatients(data.data);
      }
    } catch (err) {
      console.error('Error fetching patients:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to first patient if on /transcribe directly
  useEffect(() => {
    if (currentUser && currentUser.onboardingComplete && location.pathname === '/transcribe') {
      if (patients.length > 0) {
        navigate(`/transcribe/${patients[0]._id}/record`, { replace: true });
      }
    }
  }, [currentUser, patients, location.pathname, navigate]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setCurrentUser(null);
      setPatients([]);
      setShowProfileMenu(false);
      navigate('/');
    }
  };

  useEffect(() => {
    if (recorder.note && !recorder.loading) {
      setNotesToday((n) => n + 1);
      setHoursSaved((h) => h + 0.25);
      if (recorder.recordingId) {
        setCurrentSessionId(recorder.recordingId);
      }
    }
  }, [recorder.note, recorder.loading]);

  const handleNewPatient = () => setShowAddModal(true);

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setShowEditModal(true);
  };

  const handleDeletePatient = async (patientId) => {
    try {
      const response = await apiClient.delete(`/api/patients/${patientId}`);
      const data = response.data;
      if (data.success) {
        const remaining = patients.filter((p) => p._id !== patientId);
        setPatients(remaining);
        if (activePatientId === patientId) {
          if (remaining.length > 0) {
            navigate(`/transcribe/${remaining[0]._id}/${activeTab}`);
          } else {
            navigate('/transcribe');
          }
        }
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Error deleting patient:', err);
      alert('Error deleting patient: ' + err.message);
    }
  };

  const handleSavePatient = (newPatient) => {
    setPatients((prev) => [newPatient, ...prev]);
    navigate(`/transcribe/${newPatient._id}/${activeTab}`);
    setShowAddModal(false);
  };

  const handleUpdatePatient = (updatedPatient) => {
    setPatients((prev) =>
      prev.map((p) => (p._id === updatedPatient._id ? updatedPatient : p))
    );
  };

  const handleSaveNote = (savedRecording) => {
    if (savedRecording && savedRecording._id) {
      setCurrentSessionId(savedRecording._id);
      setNoteSavedTrigger((prev) => prev + 1);
      if (savedRecording.isFinalized) {
        // Clear active recording state in useRecorder so that the UI resets to empty
        recorder.setNote(null);
        recorder.setTranscript('');
        recorder.setRecordingId(null);
      } else {
        if (savedRecording.clinicalNote) {
          recorder.setNote(savedRecording.clinicalNote);
        }
        if (savedRecording.transcript?.labeledText) {
          recorder.setTranscript(savedRecording.transcript.labeledText);
        }
      }
    }
  };

  const handleCancelNote = () => {
    setCurrentSessionId(null);
  };

  const handleSelectPatient = (id) => {
    navigate(`/transcribe/${id}/${activeTab}`);
    setSidebarOpen(false);
    setShowNotePanelMobile(false);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      navigate('/admin');
    } else {
      fetchPatients();
      if (!user.onboardingComplete) {
        navigate('/onboarding');
      } else {
        navigate('/transcribe');
      }
    }
  };

  const handleOnboardingSuccess = (updatedUser) => {
    setCurrentUser(updatedUser);
    navigate('/transcribe');
  };

  if (authChecking) {
    return (
      <div className="flex h-screen w-full bg-warm-white justify-center items-center">
        <div className="flex flex-col gap-4 items-center">
          <span className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-teal"></span>
          <p className="text-sm text-gray-600 font-medium">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex flex-col h-screen w-full bg-warm-white justify-center items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Loading patients...
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen w-full bg-warm-white font-sans">
        {/* Topbar */}
        <header className="flex items-center justify-between px-5 h-14 bg-navy shrink-0 z-50">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden block bg-transparent border-none text-white p-1.5 cursor-pointer"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="font-serif text-[22px] text-white tracking-[0.5px] cursor-default select-none">
              Qa<span className="text-teal">lam</span>
            </span>
          </div>
          <div className="flex-1 flex justify-center items-center hidden md:flex">
            {currentUser && currentUser.profile && (
              <div className="text-white text-[13.5px] font-medium flex items-center gap-2">
                Dr. {currentUser.profile.name} <span className="font-mono text-[10.5px] bg-teal text-navy px-1.5 py-0.5 rounded font-bold">ID: {currentUser._id ? currentUser._id.slice(-6).toUpperCase() : 'N/A'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1 text-[11.5px] text-white">
              <span className="text-white/60">Notes</span>
              <span className="font-semibold">{notesToday}</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1 text-[11.5px] text-white">
              <span className="text-white/60">Saved</span>
              <span className="font-semibold">{hoursSaved.toFixed(1)}h</span>
            </div>
            <div className="avatar-container relative">
              <div className="w-8 h-8 rounded-full bg-teal text-navy flex items-center justify-center text-[13.5px] font-semibold select-none cursor-pointer" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                {(currentUser?.profile?.name?.[0] || 'D').toUpperCase()}
              </div>
              {showProfileMenu && (
                <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-xl w-60 shadow-lg z-[1000] transition-all duration-200">
                  <div className="p-4">
                    <div className="text-sm font-semibold text-navy">{currentUser?.profile?.name}</div>
                    <div className="text-[11.5px] text-gray-500 mt-0.5">{currentUser?.profile?.qualification || 'Clinician'} · {currentUser?.profile?.specialization || 'General'}</div>
                    {currentUser?.profile?.hospital && <div className="text-[11.5px] text-gray-600 mt-1 italic">{currentUser?.profile?.hospital}</div>}
                    {currentUser?.profile?.licenseNumber && <div className="text-[10.5px] font-mono text-gray-500 mt-1">Lic: {currentUser?.profile?.licenseNumber}</div>}
                    <div className="inline-block mt-2.5 text-[9.5px] font-mono px-2 py-0.5 rounded bg-teal-light text-teal-dark uppercase font-semibold">{currentUser?.subscriptionPlan || 'free'} plan</div>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <button className="w-full px-4 py-3 border-none bg-transparent text-[13.5px] font-medium text-left cursor-pointer flex items-center gap-2.5 text-red-brand rounded-b-xl hover:bg-red-brand-light transition-colors duration-150" onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Offline / Pending Sync Banner */}
        {(isOffline || pendingOfflineCount > 0) && (
          <div className={`px-5 py-2.5 flex items-center justify-between shrink-0 transition-all ${isOffline ? 'bg-red-brand text-white' : 'bg-amber-500 text-white'}`}>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>
                {isOffline 
                  ? `You are currently offline. Any recordings will be saved locally.` 
                  : `${pendingOfflineCount} recording(s) waiting to sync.`
                }
              </span>
            </div>
            {!isOffline && pendingOfflineCount > 0 && (
              <button 
                onClick={handleSync}
                className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg border-none text-[10px] uppercase font-bold cursor-pointer transition-colors"
              >
                Sync Now
              </button>
            )}
          </div>
        )}

        {/* Main Layout */}
        <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
          {/* Sidebar */}
          <Sidebar
            patients={patients}
            activePatientId={activePatientId}
            onSelectPatient={handleSelectPatient}
            onNewPatient={handleNewPatient}
            mobileOpen={sidebarOpen}
          />

          {/* Center Content */}
          <main className="flex-1 flex flex-col bg-warm-white p-5 overflow-y-auto min-h-0">
            {activePatient ? (
              <>
                <PatientBar
                  patient={activePatient}
                  onEditPatient={handleEditPatient}
                  onDeletePatient={handleDeletePatient}
                />

                <div className="flex gap-2 mb-5 border-b border-gray-200 pb-2 shrink-0">
                  <button
                    className={`bg-transparent border-none px-4 py-1.5 text-[13.5px] font-semibold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'record' ? 'text-teal-dark bg-teal-light' : 'text-gray-500 hover:text-navy hover:bg-gray-50'}`}
                    onClick={() => navigate(`/transcribe/${activePatientId}/record`)}
                  >
                    Record
                  </button>
                  <button
                    className={`bg-transparent border-none px-4 py-1.5 text-[13.5px] font-semibold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'visits' ? 'text-teal-dark bg-teal-light' : 'text-gray-500 hover:text-navy hover:bg-gray-50'}`}
                    onClick={() => navigate(`/transcribe/${activePatientId}/visits`)}
                  >
                    Past Visits
                  </button>
                  <button
                    className={`bg-transparent border-none px-4 py-1.5 text-[13.5px] font-semibold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'vitals' ? 'text-teal-dark bg-teal-light' : 'text-gray-500 hover:text-navy hover:bg-gray-50'}`}
                    onClick={() => navigate(`/transcribe/${activePatientId}/vitals`)}
                  >
                    Vitals
                  </button>
                  <button
                    className={`bg-transparent border-none px-4 py-1.5 text-[13.5px] font-semibold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'reminders' ? 'text-teal-dark bg-teal-light' : 'text-gray-500 hover:text-navy hover:bg-gray-50'}`}
                    onClick={() => navigate(`/transcribe/${activePatientId}/reminders`)}
                  >
                    Reminders
                  </button>
                  <button
                    className={`bg-transparent border-none px-4 py-1.5 text-[13.5px] font-semibold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'files' ? 'text-teal-dark bg-teal-light' : 'text-gray-500 hover:text-navy hover:bg-gray-50'}`}
                    onClick={() => navigate(`/transcribe/${activePatientId}/files`)}
                  >
                    Files
                  </button>
                </div>

                <div className="flex-1 flex flex-col gap-5 min-h-0">
                  {activeTab === 'record' && (
                    <>
                      {/* Specialty Note Template Selector */}
                      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs mb-3 text-left">
                        <div>
                          <div className="text-[13px] font-bold text-navy">Specialty Template</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">Select a template to auto-structure the clinical notes and AI extraction fields.</div>
                        </div>
                        <select
                          value={Object.keys(NOTE_TEMPLATES).find(key => NOTE_TEMPLATES[key].id === selectedTemplate.id) || 'General Practice'}
                          onChange={(e) => {
                            const tmpl = NOTE_TEMPLATES[e.target.value];
                            if (tmpl) setSelectedTemplate(tmpl);
                          }}
                          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal cursor-pointer"
                        >
                          {getAllTemplateOptions().map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <Recorder
                        recording={recorder.recording}
                        loading={recorder.loading}
                        timer={recorder.timer}
                        processingStep={recorder.processingStep}
                        onStart={recorder.start}
                        onStop={recorder.stop}
                        retryAvailable={recorder.retryAvailable}
                        transcriptionError={recorder.transcriptionError}
                        onRetry={recorder.retry}
                        onReRecord={recorder.reRecord}
                      />
                      <Transcript
                        transcript={recorder.transcript}
                        recording={recorder.recording}
                      />
                    </>
                  )}

                  {activeTab === 'visits' && (
                    <PastVisits
                      patientId={activePatientId}
                      currentSessionId={currentSessionId}
                      noteSavedTrigger={noteSavedTrigger}
                    />
                  )}

                  {activeTab === 'vitals' && (
                    <Vitals sessionId={currentSessionId} />
                  )}

                  {activeTab === 'reminders' && (
                    <ReminderDashboard patients={patients} doctor={currentUser} />
                  )}

                  {activeTab === 'files' && (
                    <PatientFilesGrid patient={activePatient} onPatientUpdate={handleUpdatePatient} />
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-4 text-gray-500 text-center p-10">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p>Select a patient or create a new one to start recording</p>
                <button className="inline-flex items-center gap-2 bg-teal hover:bg-teal-dark text-navy px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer border-none shadow-sm hover:shadow-md" onClick={handleNewPatient}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Patient
                </button>
              </div>
            )}
          </main>

          {/* Resize handle for NotePanel on desktop */}
          {currentUser && currentUser.role !== 'admin' && activePatient && (
            <div
              onMouseDown={startResizing}
              className="hidden md:block w-1 hover:w-1.5 bg-gray-200 hover:bg-teal/40 transition-all cursor-col-resize self-stretch shrink-0 z-30 relative"
              style={{ marginRight: '-2px', marginLeft: '-2px' }}
            />
          )}

          {/* Note Panel */}
          <NotePanel
            note={recorder.note}
            noteError={recorder.noteError}
            loading={recorder.loading}
            patient={activePatient || {}}
            doctor={currentUser}
            transcript={recorder.transcript}
            recordingId={recorder.recordingId}
            onSave={handleSaveNote}
            onCancel={handleCancelNote}
            isOpenMobile={showNotePanelMobile}
            onCloseMobile={() => setShowNotePanelMobile(false)}
            desktopWidth={notePanelWidth}
            template={selectedTemplate}
            lastVoiceCommand={recorder.lastVoiceCommand}
            setLastVoiceCommand={recorder.setLastVoiceCommand}
          />
        </div>

        {/* Mobile Floating Action Button to toggle Note Panel */}
        {currentUser && currentUser.role !== 'admin' && activePatient && (
          <button
            onClick={() => setShowNotePanelMobile(true)}
            className="md:hidden fixed bottom-6 right-6 z-40 bg-teal hover:bg-teal-dark text-navy px-4 py-3 rounded-full shadow-lg flex items-center justify-center cursor-pointer border-none"
            style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
            title="View Clinical Note"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span className="ml-2 text-xs font-bold uppercase tracking-wider">Clinical Note</span>
          </button>
        )}

        {/* Modals */}
        <AddPatientModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSavePatient}
        />

        <EditPatientModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdatePatient}
          patient={editingPatient}
        />
        {voiceCommandToast && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-navy text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-teal/20 z-[9999] transition-all animate-bounce">
            <span className="text-teal">🎙️</span>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Command Recognized: "{voiceCommandToast.command}" {voiceCommandToast.args ? `(${voiceCommandToast.args})` : ''}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/" element={
        currentUser ? (currentUser.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/transcribe" replace />) : <LandingPage onNavigate={(p) => navigate('/' + p)} />
      } />
      <Route path="/login" element={
        currentUser ? (currentUser.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/transcribe" replace />) : <LoginPage onNavigate={(p) => navigate('/' + p)} onLoginSuccess={handleLoginSuccess} />
      } />
      <Route path="/register" element={
        currentUser ? (currentUser.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/transcribe" replace />) : <RegisterPage onNavigate={(p) => navigate('/' + p)} onRegisterSuccess={handleLoginSuccess} />
      } />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/admin" element={
        !currentUser ? <Navigate to="/login" replace /> :
        currentUser.role === 'admin' ? <AdminDashboard onLogout={handleLogout} /> :
        <Navigate to="/transcribe" replace />
      } />
      <Route path="/onboarding" element={
        !currentUser ? <Navigate to="/login" replace /> :
        currentUser.role === 'admin' ? <Navigate to="/admin" replace /> :
        currentUser.onboardingComplete ? <Navigate to="/transcribe" replace /> :
        <div className="min-h-screen bg-warm-white flex items-center justify-center p-6">
          <OnboardingModal isOpen={true} user={currentUser} onOnboardingSuccess={handleOnboardingSuccess} isInline={true} />
        </div>
      } />
      <Route path="/transcribe" element={
        !currentUser ? <Navigate to="/login" replace /> :
        currentUser.role === 'admin' ? <Navigate to="/admin" replace /> :
        !currentUser.onboardingComplete ? <Navigate to="/onboarding" replace /> :
        renderDashboard()
      } />
      <Route path="/transcribe/:patientId" element={
        !currentUser ? <Navigate to="/login" replace /> :
        currentUser.role === 'admin' ? <Navigate to="/admin" replace /> :
        !currentUser.onboardingComplete ? <Navigate to="/onboarding" replace /> :
        renderDashboard()
      } />
      <Route path="/transcribe/:patientId/:tab" element={
        !currentUser ? <Navigate to="/login" replace /> :
        currentUser.role === 'admin' ? <Navigate to="/admin" replace /> :
        !currentUser.onboardingComplete ? <Navigate to="/onboarding" replace /> :
        renderDashboard()
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
