import { useState, useEffect, useRef, lazy, Suspense } from 'react';
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
import { ExportModal } from './components/ExportModal.jsx';
import { apiClient } from './config.js';
import { useRecorder } from './useRecorder';
import { ReminderDashboard } from './components/ReminderDashboard';
import { ChatHistoryDashboard } from './components/ChatHistoryDashboard';
import { PatientFilesGrid } from './components/PatientFilesGrid';
import { OnboardingModal } from './components/OnboardingModal';
import { AppointmentQueue } from './components/AppointmentQueue';
import { ScheduleEditor } from './components/ScheduleEditor';
import { EscalationRulesEditor } from './components/EscalationRulesEditor';
import { NOTE_TEMPLATES, getTemplateForSpecialization, getAllTemplateOptions } from './data/noteTemplates.js';
import { getPendingCount, syncPendingRecordings } from './utils/offlineQueue.js';
import { copyNoteToClipboard } from './utils/exportPDF.js';

// Lazy loaded page chunks
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const BookDemoPage = lazy(() => import('./pages/BookDemoPage').then(m => ({ default: m.BookDemoPage })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const PressPage = lazy(() => import('./pages/PressPage').then(m => ({ default: m.PressPage })));


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

  // Auto scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
  const activePatientId = urlPatientId;
  const activePatient = patients.find((p) => p._id === activePatientId);
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

  // Redesign Layout & Tab States
  const [activeSidebarTab, setActiveSidebarTab] = useState('patients');
  const [activeEditorTab, setActiveEditorTab] = useState('transcription');
  const [customTabs, setCustomTabs] = useState([]);
  const [showPlusDropdown, setShowPlusDropdown] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [rightSidebar, setRightSidebar] = useState(null);
  const [typedContext, setTypedContext] = useState('');
  const contextEditorRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const checkFormats = () => {
      try {
        const activeEl = document.activeElement;
        const isEditable = activeEl && (activeEl.contentEditable === 'true' || activeEl.closest('[contenteditable="true"]'));
        if (isEditable) {
          setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough') || document.queryCommandState('strikethrough'),
          });
        } else {
          setActiveFormats({ bold: false, italic: false, underline: false, strikethrough: false });
        }
        setCanUndo(document.queryCommandEnabled('undo'));
        setCanRedo(document.queryCommandEnabled('redo'));
      } catch (e) {}
    };

    document.addEventListener('selectionchange', checkFormats);
    return () => document.removeEventListener('selectionchange', checkFormats);
  }, []);

  const addTableRow = () => {
    let table = null;
    let targetTr = null;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      const cell = node ? (node.nodeType === 1 ? node.closest('td, th') : node.parentElement?.closest('td, th')) : null;
      targetTr = cell ? cell.closest('tr') : null;
      table = targetTr ? targetTr.closest('table') : null;
    }

    if (!table && contextEditorRef.current) {
      table = contextEditorRef.current.querySelector('table');
      if (table) {
        const rows = table.querySelectorAll('tr');
        targetTr = rows[rows.length - 1];
      }
    }

    if (table && targetTr) {
      const colCount = targetTr.children.length;
      const newTr = document.createElement('tr');
      newTr.className = "border-b border-slate-200";
      for (let i = 0; i < colCount; i++) {
        const td = document.createElement('td');
        td.className = "border border-slate-300 px-3 py-1.5 text-slate-700";
        td.innerHTML = `Cell ${i + 1}`;
        newTr.appendChild(td);
      }
      targetTr.after(newTr);
      if (contextEditorRef.current) {
        setTypedContext(contextEditorRef.current.innerHTML);
      }
    } else {
      alert('Please click inside a table or insert a table first.');
    }
  };

  const addTableColumn = () => {
    let table = null;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      const cell = node ? (node.nodeType === 1 ? node.closest('td, th') : node.parentElement?.closest('td, th')) : null;
      table = cell ? cell.closest('table') : null;
    }

    if (!table && contextEditorRef.current) {
      table = contextEditorRef.current.querySelector('table');
    }

    if (table) {
      const rows = table.querySelectorAll('tr');
      rows.forEach((tr) => {
        const isHeader = tr.parentElement && tr.parentElement.tagName === 'THEAD';
        const cell = document.createElement(isHeader ? 'th' : 'td');
        cell.className = isHeader
          ? "border border-slate-300 px-3 py-1.5 text-left font-bold text-slate-800"
          : "border border-slate-300 px-3 py-1.5 text-slate-700";
        cell.innerHTML = isHeader ? `Header ${tr.children.length + 1}` : `Cell ${tr.children.length + 1}`;
        tr.appendChild(cell);
      });
      if (contextEditorRef.current) {
        setTypedContext(contextEditorRef.current.innerHTML);
      }
    } else {
      alert('Please click inside a table or insert a table first.');
    }
  };

  const [toggledFormats, setToggledFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const tableDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableDropdownRef.current && !tableDropdownRef.current.contains(e.target)) {
        setShowTableDropdown(false);
      }
    };
    if (showTableDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTableDropdown]);

  const toggleFormatting = (format) => {
    applyFormatting(format);
    setToggledFormats((prev) => ({
      ...prev,
      [format]: !prev[format],
    }));
  };

  const deleteTableRow = () => {
    let table = null;
    let targetTr = null;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      const cell = node ? (node.nodeType === 1 ? node.closest('td, th') : node.parentElement?.closest('td, th')) : null;
      targetTr = cell ? cell.closest('tr') : null;
      table = targetTr ? targetTr.closest('table') : null;
    }

    if (!table && contextEditorRef.current) {
      table = contextEditorRef.current.querySelector('table');
      if (table) {
        const rows = table.querySelectorAll('tr');
        targetTr = rows[rows.length - 1];
      }
    }

    if (table && targetTr) {
      targetTr.remove();
      if (!table.querySelector('tr')) {
        table.remove();
      }
      if (contextEditorRef.current) {
        setTypedContext(contextEditorRef.current.innerHTML);
      }
    } else {
      alert('Please click inside a table row to delete.');
    }
  };

  const deleteTableColumn = () => {
    let table = null;
    let colIndex = -1;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      const cell = node ? (node.nodeType === 1 ? node.closest('td, th') : node.parentElement?.closest('td, th')) : null;
      if (cell) {
        table = cell.closest('table');
        colIndex = Array.from(cell.parentElement.children).indexOf(cell);
      }
    }

    if (!table && contextEditorRef.current) {
      table = contextEditorRef.current.querySelector('table');
      colIndex = 0;
    }

    if (table && colIndex >= 0) {
      const rows = table.querySelectorAll('tr');
      rows.forEach((tr) => {
        if (tr.children[colIndex]) {
          tr.children[colIndex].remove();
        }
      });
      if (contextEditorRef.current) {
        setTypedContext(contextEditorRef.current.innerHTML);
      }
    } else {
      alert('Please click inside a table column to delete.');
    }
  };

  const deleteTable = () => {
    let table = null;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      const cell = node ? (node.nodeType === 1 ? node.closest('td, th') : node.parentElement?.closest('td, th')) : null;
      table = cell ? cell.closest('table') : null;
    }

    if (!table && contextEditorRef.current) {
      table = contextEditorRef.current.querySelector('table');
    }

    if (table) {
      table.remove();
      if (contextEditorRef.current) {
        setTypedContext(contextEditorRef.current.innerHTML);
      }
    } else {
      alert('No table found to delete.');
    }
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || doc.body.innerText || '';
  };
  const [recorderCardTab, setRecorderCardTab] = useState('transcript');
  const [showCardTemplateDropdown, setShowCardTemplateDropdown] = useState(false);
  const [isRecorderCardCollapsed, setIsRecorderCardCollapsed] = useState(true);
  const [bottomChatText, setBottomChatText] = useState('');
  const [chatQuery, setChatQuery] = useState('');

  const handleSendBottomChat = () => {
    if (!bottomChatText.trim()) return;
    setChatQuery(bottomChatText);
    setRightSidebar('learn');
    setBottomChatText('');
  };

  const [customNotes, setCustomNotes] = useState({
    sick_note: '',
    consult_note: ''
  });

  useEffect(() => {
    if (currentUser) {
      const patientName = activePatient ? `${activePatient.firstName} ${activePatient.lastName}` : '[Patient Name]';
      const patientAge = activePatient?.age || activePatient?.dateOfBirth ? (activePatient.age || new Date().getFullYear() - new Date(activePatient.dateOfBirth).getFullYear()) : '__';
      const patientGender = activePatient?.gender || '__';
      const docName = currentUser?.profile?.name || '';
      const docQual = currentUser?.profile?.qualification || '';
      const docLicense = currentUser?.profile?.licenseNumber || '';
      const docHospital = currentUser?.profile?.hospital || '';
      const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      setCustomNotes({
        sick_note: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SICK LEAVE / MEDICAL CERTIFICATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date: ${todayStr}

Clinic: ${docHospital}
Doctor: Dr. ${docName}
Qualification: ${docQual}
License No: ${docLicense}

──────────────────────────────

TO WHOM IT MAY CONCERN

This is to certify that the patient:

  Name: ${patientName}
  Age: ${patientAge}   Gender: ${patientGender}

is under my professional care and has been examined on ${todayStr}.

The patient is advised sick leave / complete rest for a period of _____ days, effective from ____________ to ____________.

Diagnosis / Clinical Impression:
  ________________________________________
  ________________________________________

Remarks:
  ________________________________________

──────────────────────────────

Dr. ${docName}
${docQual}
Lic: ${docLicense}

Signature: ________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        consult_note: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CLINICAL CONSULTATION NOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date: ${todayStr}

Clinic: ${docHospital}
Doctor: Dr. ${docName}
Qualification: ${docQual}

──────────────────────────────
PATIENT DETAILS
──────────────────────────────
  Name:    ${patientName}
  Age:     ${patientAge}
  Gender:  ${patientGender}

──────────────────────────────
CLINICAL FINDINGS & DISCUSSION
──────────────────────────────

Symptoms & Duration:
  ________________________________________

Diagnostic Impression:
  ________________________________________

Treatment Plan & Recommendations:
  ________________________________________

Referral / Further Investigations:
  ________________________________________

──────────────────────────────

Dr. ${docName}
${docQual}
Lic: ${docLicense}

Signature: ________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      });
    }
  }, [currentUser, activePatient]);



  // Layout states: resizing and mobile panel visibility
  const [showNotePanelMobile, setShowNotePanelMobile] = useState(false);
  const [notePanelWidth, setNotePanelWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (mouseDownEvent) => {
    setIsResizing(true);
    mouseDownEvent.preventDefault();
  };

  const applyFormatting = (format) => {
    const activeEl = document.activeElement;
    if (!activeEl) return;

    // Check if the active element is a contenteditable, or inside one
    if (activeEl.contentEditable === 'true' || activeEl.closest('[contenteditable="true"]')) {
      const execMap = {
        bold: 'bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'strikeThrough'
      };
      const cmd = execMap[format];
      if (cmd) {
        document.execCommand(cmd, false);
      }
      return;
    }

    // Fallback for plain text inputs and textareas
    if (activeEl.tagName !== 'TEXTAREA' && activeEl.tagName !== 'INPUT') return;

    const start = activeEl.selectionStart;
    const end = activeEl.selectionEnd;
    const val = activeEl.value;

    let before = val.substring(0, start);
    let selection = val.substring(start, end);
    let after = val.substring(end);

    let prefix = '';
    let suffix = '';

    if (format === 'bold') {
      prefix = '**';
      suffix = '**';
    } else if (format === 'italic') {
      prefix = '*';
      suffix = '*';
    } else if (format === 'underline') {
      prefix = '__';
      suffix = '__';
    } else if (format === 'strikethrough') {
      prefix = '~~';
      suffix = '~~';
    }

    const newVal = before + prefix + selection + suffix + after;

    // Use the native setter to bypass React's internal value tracker,
    // so the dispatched 'input' event actually triggers React's onChange.
    const nativeSetter = Object.getOwnPropertyDescriptor(
      activeEl.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeSetter) {
      nativeSetter.call(activeEl, newVal);
    } else {
      activeEl.value = newVal;
    }

    const event = new Event('input', { bubbles: true });
    activeEl.dispatchEvent(event);

    activeEl.focus();
    activeEl.setSelectionRange(start + prefix.length, start + prefix.length + selection.length);
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

  const activeTab = urlTab;

  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    const spec = currentUser?.profile?.specialization;
    return getTemplateForSpecialization(spec);
  });

  const [patientDataCache, setPatientDataCache] = useState({});

  const activeTemplate = Object.values(NOTE_TEMPLATES).find(t => t.id === activeEditorTab) || selectedTemplate;

  const recorder = useRecorder(activePatientId, {
    templateId: activeTemplate?.id || activeEditorTab,
    templateSections: activeTemplate?.sections,
    typedContext: typedContext,
  });

  // Keep template in sync with currentUser specialization
  useEffect(() => {
    if (currentUser?.profile?.specialization) {
      const spec = currentUser.profile.specialization;
      setSelectedTemplate(getTemplateForSpecialization(spec));
    }
  }, [currentUser]);

  // Close + Create Note dropdown when clicking outside
  useEffect(() => {
    if (!showPlusDropdown) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.z-50')) {
        setShowPlusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showPlusDropdown]);

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

  // 1. Sync typedContext & transcript into per-patient cache
  useEffect(() => {
    if (!activePatientId) return;
    setPatientDataCache(prev => {
      const existing = prev[activePatientId] || { typedContext: '', transcript: '', notes: {} };
      const isTypedChanged = existing.typedContext !== (typedContext || '');
      const isTranscriptChanged = existing.transcript !== (recorder.transcript || '');

      if (!isTypedChanged && !isTranscriptChanged) return prev;

      const hadPreviousContext = Boolean(existing.typedContext || existing.transcript);
      const shouldInvalidateNotes = hadPreviousContext && (isTypedChanged || isTranscriptChanged);

      return {
        ...prev,
        [activePatientId]: {
          ...existing,
          typedContext: typedContext || '',
          transcript: recorder.transcript || '',
          notes: shouldInvalidateNotes ? {} : existing.notes
        }
      };
    });
  }, [typedContext, recorder.transcript, activePatientId]);

  // 2. Restore cached context & transcript when switching active patient
  useEffect(() => {
    setCustomTabs([]);
    setActiveEditorTab('transcription');
    if (!activePatientId) return;
    
    const cached = patientDataCache[activePatientId];
    if (cached) {
      setTypedContext(cached.typedContext || '');
      if (recorder.setTranscript && cached.transcript) {
        recorder.setTranscript(cached.transcript);
      }
    } else {
      setTypedContext('');
    }
  }, [activePatientId]);

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

  // 3. Cache generated notes per patient and per template tab
  useEffect(() => {
    if (recorder.note && !recorder.loading && activePatientId) {
      setNotesToday((n) => n + 1);
      setHoursSaved((h) => h + 0.25);
      if (recorder.recordingId) {
        setCurrentSessionId(recorder.recordingId);
      }
      const targetTmpl = activeTemplate || selectedTemplate;
      const tmplId = targetTmpl?.id || (activeEditorTab !== 'transcription' ? activeEditorTab : 'soap');
      const tmplLabel = targetTmpl?.label || tmplId;
      if (tmplId !== 'soap' && !customTabs.some(t => t.id === tmplId)) {
        setCustomTabs(prev => [...prev, { id: tmplId, label: tmplLabel }]);
      }
      
      setPatientDataCache(prev => {
        const existing = prev[activePatientId] || { typedContext: '', transcript: '', notes: {} };
        const currentNotes = { ...(existing.notes || {}) };
        currentNotes[tmplId] = recorder.note;
        return {
          ...prev,
          [activePatientId]: {
            ...existing,
            notes: currentNotes
          }
        };
      });
    }
  }, [recorder.note, recorder.loading, activePatientId]);

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

  const handleNoteChange = (updatedNote) => {
    if (!updatedNote || !activePatientId) return;
    recorder.setNote(updatedNote);
    const activeTmplId = activeEditorTab !== 'transcription' ? activeEditorTab : 'soap';
    
    setPatientDataCache(prev => {
      const existing = prev[activePatientId] || { typedContext: '', transcript: '', notes: {} };
      const currentNotes = { ...(existing.notes || {}) };
      currentNotes[activeTmplId] = updatedNote;
      
      Object.keys(currentNotes).forEach(key => {
        if (currentNotes[key] && typeof currentNotes[key] === 'object') {
          currentNotes[key] = {
            ...currentNotes[key],
            prescription: updatedNote.prescription || currentNotes[key].prescription,
            medications: updatedNote.medications || updatedNote.prescription || currentNotes[key].medications,
            exercises: updatedNote.exercises || currentNotes[key].exercises,
            exercises_text: updatedNote.exercises_text || currentNotes[key].exercises_text,
          };
        }
      });
      
      return {
        ...prev,
        [activePatientId]: {
          ...existing,
          notes: currentNotes
        }
      };
    });
  };

  const handleCancelNote = () => {
    setCurrentSessionId(null);
  };

  const handleCopyActiveNote = async () => {
    if (activeEditorTab === 'transcription') {
      if (!recorder.transcript.trim()) {
        alert('Transcript is empty!');
        return;
      }
      await navigator.clipboard.writeText(recorder.transcript);
      alert('Transcript copied to clipboard!');
      return;
    }
    if (activeEditorTab === 'sick_note') {
      await navigator.clipboard.writeText(customNotes.sick_note);
      alert('Sick note copied to clipboard!');
      return;
    }
    
    // Check if it's one of the templates
    const activeTmpl = Object.values(NOTE_TEMPLATES).find(t => t.id === activeEditorTab);
    if (activeTmpl) {
      let copyText = `## ${activeTmpl.label}\n\n`;
      activeTmpl.sections.forEach(sec => {
        const val = recorder.note?.[sec.key] || '';
        if (val) {
          copyText += `**${sec.label}**\n${val}\n\n`;
        }
      });
      // Add prescription if present
      if (Array.isArray(recorder.note?.prescription) && recorder.note.prescription.length > 0) {
        copyText += `**Prescription**\n`;
        recorder.note.prescription.forEach((med, i) => {
          const drug = typeof med === 'object' ? med.drug : String(med);
          const dose = typeof med === 'object' ? med.dose || '' : '';
          const freq = typeof med === 'object' ? med.frequency || '' : '';
          copyText += `- ${drug} ${dose} ${freq}\n`;
        });
        copyText += `\n`;
      }
      if (recorder.note?.followup) {
        copyText += `**Follow-up**\n${recorder.note.followup}\n\n`;
      }
      await navigator.clipboard.writeText(copyText);
      alert(`${activeTmpl.label} copied to clipboard!`);
    }
  };

  const handleQuickGenerate = async (targetTemplateId) => {
    if (recorder.recording) {
      recorder.stop();
      return;
    }

    const matchedTmpl = Object.values(NOTE_TEMPLATES).find(t => t.id === targetTemplateId);
    if (!matchedTmpl) return;

    const plainContext = stripHtml(typedContext).trim();
    const audioTranscript = (recorder.transcript || '').trim();

    let rawContextText = '';
    if (plainContext || audioTranscript) {
      rawContextText = [plainContext, audioTranscript].filter(Boolean).join('\n\n');
    } else if (contextEditorRef.current && contextEditorRef.current.innerText) {
      rawContextText = contextEditorRef.current.innerText.trim();
    }

    if (!rawContextText) {
      const emptyNote = { prescription: [], followup: '' };
      if (matchedTmpl && matchedTmpl.sections) {
        matchedTmpl.sections.forEach(s => { emptyNote[s.key] = ''; });
      } else {
        emptyNote.subjective = '';
        emptyNote.objective = '';
        emptyNote.assessment = '';
        emptyNote.plan = '';
      }
      recorder.setNote(emptyNote);
      setActiveEditorTab(matchedTmpl.id);
      setSelectedTemplate(matchedTmpl);
      return;
    }

    try {
      if (recorder.setLoading) recorder.setLoading(true);
      recorder.setNote(null);

      const response = await apiClient.post('/api/analyze/text', {
        transcript: audioTranscript,
        typedContext: plainContext,
        templateId: matchedTmpl.id,
        templateSections: matchedTmpl.sections,
        patientId: activePatientId
      });

      const data = response.data;
      if (data.success && data.data) {
        if (data.data.transcript) {
          recorder.setTranscript(data.data.transcript);
        }
        if (data.data.recordingId) {
          recorder.setRecordingId(data.data.recordingId);
        }
        recorder.setNote(data.data.note);

        if (!customTabs.some(t => t.id === matchedTmpl.id)) {
          setCustomTabs(prev => [...prev, { id: matchedTmpl.id, label: matchedTmpl.label }]);
        }
        setActiveEditorTab(matchedTmpl.id);
        setSelectedTemplate(matchedTmpl);
      } else {
        alert(data.message || 'Failed to generate note.');
      }
    } catch (err) {
      console.error('Note creation failed:', err);
      alert('Note creation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      if (recorder.setLoading) recorder.setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        const key = e.key.toLowerCase();
        if (key === 'r') {
          e.preventDefault();
          recorder.recording ? recorder.stop() : recorder.start();
        } else if (key === 's') {
          e.preventDefault();
          handleQuickGenerate('soap');
        } else if (key === 'h') {
          e.preventDefault();
          handleQuickGenerate('patient_handout');
        } else if (key === 'c') {
          e.preventDefault();
          handleCopyActiveNote();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recorder.recording, typedContext, recorder.transcript, activePatientId, activeEditorTab]);

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
      <div className="flex h-screen w-full bg-[#fafafc] justify-center items-center">
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
        <div className="flex flex-col h-screen w-full bg-[#fafafc] justify-center items-center font-sans">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="animate-spin text-teal" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Loading patients...
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen w-full flex bg-[#F3E4C9] font-sans select-none overflow-hidden relative">
        
        {/* Collapsible Sidebar */}
        <Sidebar
          patients={patients}
          activePatientId={activePatientId}
          onSelectPatient={handleSelectPatient}
          onNewPatient={handleNewPatient}
          activeSidebarTab={activeSidebarTab}
          setActiveSidebarTab={setActiveSidebarTab}
          mobileOpen={sidebarOpen}
          currentUser={currentUser}
          notesToday={notesToday}
          hoursSaved={hoursSaved}
          handleLogout={handleLogout}
        />

        {/* Center Pane */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto min-h-0 min-w-0 relative bg-[#F3E4C9]">
          {/* Offline sync banner if present */}
          {(isOffline || pendingOfflineCount > 0) && (
            <div className={`px-4 py-2 mb-4 flex items-center justify-between rounded-xl shrink-0 transition-all ${isOffline ? 'bg-red-brand text-white' : 'bg-amber-500 text-white'}`}>
              <span className="text-[11px] font-bold">
                {isOffline ? 'Offline Mode (saving locally)' : `${pendingOfflineCount} offline note(s) pending`}
              </span>
              {!isOffline && pendingOfflineCount > 0 && (
                <button onClick={handleSync} className="bg-white/20 text-white border-none px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold">
                  Sync
                </button>
              )}
            </div>
          )}

          {activeSidebarTab === 'tasks' ? (
            <ReminderDashboard patients={patients} doctor={currentUser} />
          ) : activeSidebarTab === 'chats' ? (
            <ChatHistoryDashboard doctor={currentUser} patients={patients} />
          ) : activeSidebarTab === 'appointments' ? (
            <AppointmentQueue onSelectPatient={handleSelectPatient} />
          ) : activeSidebarTab === 'schedule' ? (
            <ScheduleEditor />
          ) : activeSidebarTab === 'escalation' ? (
            <EscalationRulesEditor />
          ) : activePatient ? (
            <div className="flex-1 flex flex-col min-h-0 relative">
              {/* Patient details toolbar */}
              <PatientBar
                patient={activePatient}
                onEditPatient={handleEditPatient}
                onDeletePatient={handleDeletePatient}
                timer={recorder.timer}
                recording={recorder.recording}
                onShare={() => {
                  const mockShareEvent = new CustomEvent('trigger-share-pdf');
                  window.dispatchEvent(mockShareEvent);
                }}
              />

                {/* Tab headers (Modern browser-document tabs matching mockup) */}
                <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-4 py-0 justify-between shrink-0 select-none relative z-30">
                  <div className="flex items-center gap-1 min-w-0">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink">
                      {/* Context Tab */}
                      <button
                        onClick={() => setActiveEditorTab('transcription')}
                        className={`py-2 px-3 text-xs font-semibold border-t border-l border-r transition-all cursor-pointer ${
                          activeEditorTab === 'transcription'
                            ? 'border-slate-200 bg-white text-slate-800 rounded-t-lg -mb-px relative z-10 font-bold'
                            : 'border-transparent bg-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Context
                      </button>

                      {/* Permanent SOAP Note Tab */}
                      <button
                        onClick={() => {
                          const tmpl = NOTE_TEMPLATES['SOAP'];
                          setSelectedTemplate(tmpl);
                          
                          const isSameTab = activeEditorTab === 'soap';
                          const isNoteEmpty = !recorder.note;
                          setActiveEditorTab('soap');

                          const cachedNotes = patientDataCache[activePatientId]?.notes || {};
                          if (!isSameTab && !isNoteEmpty && cachedNotes['soap']) {
                            recorder.setNote(cachedNotes['soap']);
                          } else if (stripHtml(typedContext)?.trim() || recorder.transcript?.trim()) {
                            // Re-generate fresh SOAP note from context
                            setPatientDataCache(prev => {
                              const existing = prev[activePatientId] || { typedContext: '', transcript: '', notes: {} };
                              const currentNotes = { ...(existing.notes || {}) };
                              delete currentNotes['soap'];
                              return {
                                ...prev,
                                [activePatientId]: { ...existing, notes: currentNotes }
                              };
                            });
                            recorder.generateNoteFromContext('soap', tmpl.sections);
                          }
                        }}
                        className={`py-2 px-3 text-xs font-semibold border-t border-l border-r transition-all cursor-pointer ${
                          activeEditorTab === 'soap'
                            ? 'border-[#D3D4C0] bg-white text-[#0A2947] rounded-t-xl -mb-px relative z-10 font-bold'
                            : 'border-transparent bg-transparent text-[#0A2947]/60 hover:text-[#0A2947]'
                        }`}
                      >
                        SOAP
                      </button>

                      {/* Additional custom note template tabs */}
                      {customTabs.filter(t => t.id !== 'soap').map(tab => (
                        <div
                          key={tab.id}
                          onClick={() => {
                            const tmpl = Object.values(NOTE_TEMPLATES).find(t => t.id === tab.id);
                            if (tmpl) setSelectedTemplate(tmpl);
                            
                            const isSameTab = activeEditorTab === tab.id;
                            const isNoteEmpty = !recorder.note;
                            setActiveEditorTab(tab.id);

                            const cachedNotes = patientDataCache[activePatientId]?.notes || {};
                            if (!isSameTab && !isNoteEmpty && cachedNotes[tab.id]) {
                              recorder.setNote(cachedNotes[tab.id]);
                            } else if (tmpl && (stripHtml(typedContext)?.trim() || recorder.transcript?.trim())) {
                              // Re-generate fresh note from context
                              setPatientDataCache(prev => {
                                const existing = prev[activePatientId] || { typedContext: '', transcript: '', notes: {} };
                                const currentNotes = { ...(existing.notes || {}) };
                                delete currentNotes[tab.id];
                                return {
                                  ...prev,
                                  [activePatientId]: { ...existing, notes: currentNotes }
                                };
                              });
                              recorder.generateNoteFromContext(tmpl.id, tmpl.sections);
                            }
                          }}
                          className={`py-2 px-3 text-xs font-semibold border-t border-l border-r transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                            activeEditorTab === tab.id
                              ? 'border-[#D3D4C0] bg-white text-[#0A2947] rounded-t-xl -mb-px relative z-10 font-bold'
                              : 'border-transparent bg-transparent text-[#0A2947]/60 hover:text-[#0A2947]'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomTabs(prev => prev.filter(t => t.id !== tab.id));
                              if (activeEditorTab === tab.id) setActiveEditorTab('transcription');
                            }}
                            className="text-[#0A2947]/40 hover:text-rose-600 cursor-pointer text-[10px] font-bold p-0.5 rounded-full hover:bg-slate-100 leading-none"
                            title="Close tab"
                          >
                            ✕
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="w-px h-4 bg-slate-200 mx-1 shrink-0" />

                    {/* Plus / Create Note Dropdown */}
                    <div className="relative shrink-0 z-50">
                      <button
                        onClick={() => setShowPlusDropdown(prev => !prev)}
                        className="py-2 px-2 text-xs font-semibold text-teal-dark hover:text-teal bg-transparent border-none cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <span className="text-sm font-bold">+</span> Create Note
                      </button>

                      {/* Dropdown Menu (Search templates) */}
                      {showPlusDropdown && (
                        <div className="absolute top-9 left-0 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-2 w-64 text-left animate-fadeIn">
                          {/* Search box inside dropdown */}
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </span>
                            <input
                              type="text"
                              placeholder="Search templates"
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal/50 font-sans"
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const val = e.target.value.toLowerCase();
                                const items = document.querySelectorAll('.template-item');
                                items.forEach(item => {
                                  const text = item.textContent.toLowerCase();
                                  if (text.includes(val)) {
                                    item.style.display = 'flex';
                                  } else {
                                    item.style.display = 'none';
                                  }
                                });
                              }}
                            />
                          </div>

                          <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1 mt-1 select-none">Vero Templates</div>
                          <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto no-scrollbar">
                            {(() => {
                              const createdIds = new Set([
                                'soap',
                                ...customTabs.map(t => t.id),
                                activeEditorTab,
                                ...Object.keys(patientDataCache[activePatientId]?.notes || {})
                              ]);

                              const availableTemplates = Object.values(NOTE_TEMPLATES).filter(
                                tmpl => !createdIds.has(tmpl.id)
                              );

                              if (availableTemplates.length === 0) {
                                return (
                                  <div className="p-3 text-[11px] text-slate-400 text-center font-sans font-medium italic">
                                    All note templates created for this session
                                  </div>
                                );
                              }

                              return availableTemplates.map(tmpl => (
                                <button
                                  key={tmpl.id}
                                  onClick={() => {
                                    if (!customTabs.some(t => t.id === tmpl.id)) {
                                      setCustomTabs(prev => [...prev, { id: tmpl.id, label: tmpl.label }]);
                                    }
                                    setSelectedTemplate(tmpl);
                                    setActiveEditorTab(tmpl.id);
                                    setShowPlusDropdown(false);
                                    const cachedNotes = patientDataCache[activePatientId]?.notes || {};
                                    if (cachedNotes[tmpl.id]) {
                                      recorder.setNote(cachedNotes[tmpl.id]);
                                    } else if (stripHtml(typedContext)?.trim() || recorder.transcript?.trim()) {
                                      recorder.generateNoteFromContext(tmpl.id, tmpl.sections);
                                    }
                                  }}
                                  className="template-item text-left w-full hover:bg-slate-50 p-2 text-xs rounded-xl text-slate-700 hover:text-slate-900 bg-transparent border-none cursor-pointer font-sans font-medium flex items-center justify-between transition-colors"
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="text-sm">{tmpl.icon}</span>
                                    <span>{tmpl.label}</span>
                                  </span>
                                  {tmpl.id === 'meeting_minutes' && (
                                    <span className="text-slate-400 text-xs">☆</span>
                                  )}
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right-aligned actions (Insights, Learn) */}
                  <div className="flex items-center gap-1.5 py-1">
                    <button
                      onClick={() => setRightSidebar(prev => prev === 'insights' ? null : 'insights')}
                      className={`p-1.5 rounded-xl transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold ${
                        rightSidebar === 'insights' ? 'bg-[#F3E4C9] text-[#8B5E3C] font-bold border border-[#8B5E3C]/30' : 'bg-transparent text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Insights & Diagnostics"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                      </svg>
                      Insights
                    </button>

                    <button
                      onClick={() => setRightSidebar(prev => prev === 'learn' ? null : 'learn')}
                      className={`py-1 px-2 text-xs font-semibold transition-all rounded-xl border-none cursor-pointer flex items-center gap-1 ${
                        rightSidebar === 'learn' ? 'bg-[#F3E4C9] text-[#8B5E3C] font-bold border border-[#8B5E3C]/30' : 'bg-transparent text-slate-600 hover:bg-slate-100'
                      }`}
                      title="AI Learn & Assistant"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                      </svg>
                      Learn
                      <svg className="w-2.5 h-2.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </div>

                {/* Formatting Toolbar */}
                <div className="flex items-center gap-1 px-3 py-0.5 bg-transparent justify-start select-none shrink-0">
                  <button
                    onClick={() => {
                      document.execCommand('undo');
                      setCanUndo(document.queryCommandEnabled('undo'));
                      setCanRedo(document.queryCommandEnabled('redo'));
                    }}
                    disabled={!canUndo}
                    className={`p-1 border-none cursor-pointer rounded flex items-center justify-center transition-all ${
                      canUndo
                        ? 'text-slate-900 font-bold opacity-100 hover:bg-slate-200'
                        : 'text-slate-300 opacity-40 cursor-not-allowed'
                    }`}
                    title="Undo"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={canUndo ? "3" : "2"}>
                      <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      document.execCommand('redo');
                      setCanUndo(document.queryCommandEnabled('undo'));
                      setCanRedo(document.queryCommandEnabled('redo'));
                    }}
                    disabled={!canRedo}
                    className={`p-1 border-none cursor-pointer rounded flex items-center justify-center transition-all ${
                      canRedo
                        ? 'text-slate-900 font-bold opacity-100 hover:bg-slate-200'
                        : 'text-slate-300 opacity-40 cursor-not-allowed'
                    }`}
                    title="Redo"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={canRedo ? "3" : "2"}>
                      <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                    </svg>
                  </button>
                  
                  <div className="w-px h-3.5 bg-slate-200 mx-1" />
                  
                  <button
                    onMouseDown={(e) => { e.preventDefault(); applyFormatting('bold'); }}
                    className={`w-6 h-6 text-xs font-black rounded flex items-center justify-center cursor-pointer transition-all ${
                      activeFormats.bold
                        ? 'bg-[#fdf0eb] border border-[#c4785c] text-[#c4785c] font-black shadow-2xs'
                        : 'bg-transparent border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                    }`}
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); applyFormatting('italic'); }}
                    className={`w-6 h-6 text-xs italic font-serif rounded flex items-center justify-center cursor-pointer transition-all ${
                      activeFormats.italic
                        ? 'bg-[#fdf0eb] border border-[#c4785c] text-[#c4785c] font-black shadow-2xs'
                        : 'bg-transparent border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                    }`}
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); applyFormatting('underline'); }}
                    className={`w-6 h-6 text-xs underline rounded flex items-center justify-center cursor-pointer transition-all ${
                      activeFormats.underline
                        ? 'bg-[#fdf0eb] border border-[#c4785c] text-[#c4785c] font-black shadow-2xs'
                        : 'bg-transparent border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                    }`}
                    title="Underline"
                  >
                    U
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); applyFormatting('strikethrough'); }}
                    className={`w-6 h-6 text-xs line-through rounded flex items-center justify-center cursor-pointer transition-all ${
                      activeFormats.strikethrough
                        ? 'bg-[#fdf0eb] border border-[#c4785c] text-[#c4785c] font-black shadow-2xs'
                        : 'bg-transparent border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                    }`}
                    title="Strikethrough"
                  >
                    S
                  </button>
                  
                  <div className="w-px h-3.5 bg-slate-200 mx-1" />

                  {/* Table Dropdown Menu */}
                  <div className="relative" ref={tableDropdownRef}>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowTableDropdown((prev) => !prev);
                      }}
                      className={`px-2 py-1 border rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                        showTableDropdown
                          ? 'bg-[#fdf0eb] border-[#c4785c] text-[#c4785c]'
                          : 'bg-slate-100/80 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                      title="Table Controls"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
                      <span>Table</span>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>

                    {showTableDropdown && (
                      <div className="absolute top-8 left-0 bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 w-48 text-left font-sans animate-fadeIn">
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setShowTableDropdown(false);
                            const activeEl = document.activeElement;
                            if (activeEl && (activeEl.contentEditable === 'true' || activeEl.closest('[contenteditable="true"]'))) {
                              const tableHtml = `
                                <table class="w-full border-collapse border border-slate-300 my-3 text-xs font-sans">
                                  <thead>
                                    <tr class="bg-slate-50 border-b border-slate-300">
                                      <th class="border border-slate-300 px-3 py-1.5 text-left font-bold text-slate-800">Header 1</th>
                                      <th class="border border-slate-300 px-3 py-1.5 text-left font-bold text-slate-800">Header 2</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr class="border-b border-slate-200">
                                      <td class="border border-slate-300 px-3 py-1.5 text-slate-700">Cell 1</td>
                                      <td class="border border-slate-300 px-3 py-1.5 text-slate-700">Cell 2</td>
                                    </tr>
                                  </tbody>
                                </table>
                                <p><br></p>
                              `;
                              document.execCommand('insertHTML', false, tableHtml);
                            }
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#fdf0eb] hover:text-[#c4785c] rounded-lg border-none bg-transparent cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          Insert New Table
                        </button>

                        <div className="h-px bg-slate-100 my-0.5" />

                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addTableRow();
                            setShowTableDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#fdf0eb] hover:text-[#c4785c] rounded-lg border-none bg-transparent cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
                          Add Row (+ Y)
                        </button>

                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addTableColumn();
                            setShowTableDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#fdf0eb] hover:text-[#c4785c] rounded-lg border-none bg-transparent cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                          Add Column (+ X)
                        </button>

                        <div className="h-px bg-slate-100 my-0.5" />

                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            deleteTableRow();
                            setShowTableDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg border-none bg-transparent cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          Delete Row
                        </button>

                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            deleteTableColumn();
                            setShowTableDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg border-none bg-transparent cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          Delete Column
                        </button>

                        <div className="h-px bg-slate-100 my-0.5" />

                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            deleteTable();
                            setShowTableDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg border-none bg-transparent cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          Delete Entire Table
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Waveform/Record Audio button */}
                  <button
                    onClick={recorder.recording ? recorder.stop : recorder.start}
                    className={`p-1 text-slate-500 hover:text-slate-850 bg-transparent border-none cursor-pointer rounded hover:bg-slate-200 flex items-center justify-center ${
                      recorder.recording ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : ''
                    }`}
                    title={recorder.recording ? "Stop Ambient Recording" : "Start Ambient Recording"}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
                    </svg>
                  </button>

                  {/* Copy Note Button */}
                  <button
                    onClick={() => copyNoteToClipboard(recorder.note, null, activePatient, currentUser)}
                    className="ml-auto bg-white border border-[#D3D4C0] hover:bg-[#F3E4C9]/40 text-[#0A2947] px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer font-sans shadow-xs transition-all"
                    title="Copy Clinical Note"
                  >
                    <span>Copy</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>
                {/* Card Content Canvas (Veroscribe Full-Width Document Workspace) */}
                <div className="flex-1 flex flex-col min-h-0 bg-white relative animate-fadeIn pb-16">
                  {activeEditorTab === 'transcription' && (
                    <div className="p-6 md:p-8 flex-1 flex flex-col min-h-0 bg-white">
                      <div className="flex-1 flex flex-col min-h-0 text-left bg-white font-sans relative">
                        {/* Main background typing canvas with instructions placeholder */}
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          className="w-full h-full bg-transparent border-none text-slate-800 text-base focus:outline-none font-sans overflow-y-auto text-left leading-relaxed outline-none min-h-[300px] context-rich-editor relative z-10"
                          data-placeholder=""
                          onInput={(e) => setTypedContext(e.currentTarget.innerHTML)}
                          ref={(el) => {
                            contextEditorRef.current = el;
                            if (el && !el.innerHTML && typedContext) {
                              el.innerHTML = typedContext;
                            }
                          }}
                        />
                        {!typedContext.trim() && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center gap-2 z-0">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-1">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                              </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight font-serif" style={{ fontFamily: "'Kalice', serif" }}>Let's get going</h3>
                            <p className="text-xs text-slate-400 max-w-[280px]">Type context or record audio to draft your encounter note.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SOAP Note & Dynamic template notes */}
                  {(() => {
                    const matchedTmpl = Object.values(NOTE_TEMPLATES).find(t => t.id === activeEditorTab);
                    if (matchedTmpl) {
                      return (
                        <div className="flex-1 overflow-y-auto bg-white h-full w-full max-w-none text-left">
                          <NotePanel
                            note={recorder.note}
                            noteError={recorder.noteError}
                            loading={recorder.loading}
                            patient={activePatient}
                            doctor={currentUser}
                            transcript={recorder.transcript}
                            recordingId={recorder.recordingId}
                            onSave={handleSaveNote}
                            onNoteChange={recorder.setNote}
                            onCancel={() => setActiveEditorTab('transcription')}
                            embedded={true}
                            showOnlyHandout={false}
                            template={matchedTmpl}
                            onRegenerate={() => recorder.generateNoteFromContext(matchedTmpl.id, matchedTmpl.sections)}
                            lastVoiceCommand={recorder.lastVoiceCommand}
                            setLastVoiceCommand={recorder.setLastVoiceCommand}
                          />
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {activeEditorTab === 'vitals' && (
                    <div className="flex-1 overflow-y-auto p-4 pb-24 bg-white">
                      <Vitals sessionId={currentSessionId} />
                    </div>
                  )}

                  {activeEditorTab === 'files' && (
                    <div className="flex-1 overflow-y-auto p-4 pb-24 bg-white">
                      <PatientFilesGrid patient={activePatient} onPatientUpdate={handleUpdatePatient} />
                    </div>
                  )}

                  {/* Wireframe-style Bottom Bar */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white border border-[#D3D4C0] shadow-md rounded-2xl p-3 flex items-center justify-between gap-4 z-40 transition-all font-sans select-none">
                    {/* Left: Recorder Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {recorder.recording ? (
                        <>
                          {/* Cancel / Discard (Wrong Button) */}
                          <button
                            onClick={() => {
                              recorder.cancel();
                              recorder.setNote(null);
                              const activeTmplId = activeEditorTab !== 'transcription' ? activeEditorTab : 'soap';
                              setPatientDataCache(prev => {
                                if (!activePatientId) return prev;
                                const existing = prev[activePatientId] || { typedContext: '', transcript: '', notes: {} };
                                const currentNotes = { ...(existing.notes || {}) };
                                delete currentNotes[activeTmplId];
                                return {
                                  ...prev,
                                  [activePatientId]: { ...existing, notes: currentNotes }
                                };
                              });
                            }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 border border-slate-200 cursor-pointer transition-all flex items-center justify-center shadow-xs shrink-0"
                            title="Discard Recording"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>

                          {/* Pause / Resume Button */}
                          {recorder.isPaused ? (
                            <button
                              onClick={recorder.resume}
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wide rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border-none shadow-md"
                              title="Resume Recording"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                              Resume
                            </button>
                          ) : (
                            <button
                              onClick={recorder.pause}
                              className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wide rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border-none shadow-md"
                              title="Pause Recording"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                              </svg>
                              Pause
                            </button>
                          )}

                          {/* Stop & Compile Note */}
                          <button
                            onClick={recorder.stop}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wide rounded-xl cursor-pointer transition-all flex items-center gap-2 border-none shadow-md font-sans"
                          >
                            <span className="w-2 h-2 rounded-full bg-white block" />
                            Stop & Compile Note
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={recorder.start}
                          className="px-4 py-2 bg-[#0A2947] hover:bg-[#163f66] text-white font-bold text-xs uppercase tracking-wide rounded-xl cursor-pointer transition-all flex items-center gap-2 border-none shadow-md font-sans"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#8B5E3C]">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                          </svg>
                          Record Audio
                        </button>
                      )}

                      {recorder.loading && (
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0A2947] font-mono">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#D3D4C0] border-t-[#8B5E3C] animate-spin" />
                          <span>Compiling Note...</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Chat input (Ask Here) */}
                    <div className="flex-1 max-w-[280px] md:max-w-[440px] flex items-center gap-2 bg-[#F9F6F1] border border-[#D3D4C0] hover:border-[#8B5E3C]/40 rounded-xl px-3.5 py-1.5 focus-within:border-[#8B5E3C] focus-within:bg-white transition-all shadow-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#8B5E3C] shrink-0" />
                      <input
                        type="text"
                        placeholder="Ask a question or edit your note..."
                        value={bottomChatText}
                        onChange={(e) => setBottomChatText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSendBottomChat();
                          }
                        }}
                        className="flex-1 bg-transparent border-none text-xs text-[#0A2947] focus:outline-none placeholder:text-[#0A2947]/40 font-sans"
                      />
                      <button
                        onClick={handleSendBottomChat}
                        className="p-1 hover:bg-[#F3E4C9]/50 rounded text-[#8B5E3C] bg-transparent border-none cursor-pointer flex items-center justify-center transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-gray-500 text-center p-10">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-305">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="text-xs text-slate-450 font-semibold">Select a patient session or create a new encounter to start</p>
              <button className="inline-flex items-center gap-1.5 bg-[#c4785c] hover:bg-[#a3604a] text-white px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none shadow-sm" onClick={handleNewPatient}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Encounter
              </button>
            </div>
          )}
        </main>

        {/* Interactive Sidebars: Insights (Vitals/Files) or Learn (ChatAssistant) */}
        {activePatient && !['tasks', 'chats', 'appointments', 'schedule', 'escalation'].includes(activeSidebarTab) && rightSidebar && (
          <aside className="w-[380px] bg-white border-l border-slate-200 flex flex-col shrink-0 text-slate-805 h-full relative z-40 animate-fadeIn">
            {rightSidebar === 'learn' && (
              <ChatAssistant
                patient={activePatient}
                currentNote={recorder.note}
                transcript={recorder.transcript}
                typedContext={typedContext}
                onUpdateNote={(newNote) => recorder.setNote(newNote)}
                onClose={() => setRightSidebar(null)}
                initialQuery={chatQuery}
                onClearInitialQuery={() => setChatQuery('')}
              />
            )}
            {rightSidebar === 'insights' && (
              <div className="flex-1 flex flex-col min-h-0 bg-white text-left">
                {/* Insights Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-sans">
                    <svg className="w-4 h-4 text-[#c4785c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Insights & Diagnostics
                  </span>
                  <button onClick={() => setRightSidebar(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400 bg-transparent border-none cursor-pointer text-xs font-bold">✕</button>
                </div>
                {/* Insights Content */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5 font-sans">
                      Patient Vitals
                    </h3>
                    <Vitals sessionId={currentSessionId} />
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5 font-sans">
                      Clinical Files
                    </h3>
                    <PatientFilesGrid patient={activePatient} onPatientUpdate={handleUpdatePatient} />
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Modals & Toasts */}
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
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          note={recorder.note}
          patient={activePatient}
          doctor={currentUser}
        />
        {voiceCommandToast && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#22252a] text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-stone-850 z-[9999] transition-all animate-bounce">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Command: "{voiceCommandToast.command}" {voiceCommandToast.args ? `(${voiceCommandToast.args})` : ''}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafc] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Scribologist...</span>
        </div>
      </div>
    }>
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
        <Route path="/privacy" element={<PrivacyPage onNavigate={(p) => navigate('/' + p)} />} />
        <Route path="/terms" element={<TermsPage onNavigate={(p) => navigate('/' + p)} />} />
        <Route path="/about" element={<AboutPage onNavigate={(p) => navigate('/' + p)} />} />
        <Route path="/press" element={<PressPage onNavigate={(p) => navigate('/' + p)} />} />
        <Route path="/book-demo" element={<BookDemoPage onNavigate={(p) => navigate('/' + p)} />} />
        <Route path="/admin" element={
          !currentUser ? <Navigate to="/login" replace /> :
            currentUser.role === 'admin' ? <AdminDashboard onLogout={handleLogout} /> :
              <Navigate to="/transcribe" replace />
        } />
        <Route path="/onboarding" element={
          !currentUser ? <Navigate to="/login" replace /> :
            currentUser.role === 'admin' ? <Navigate to="/admin" replace /> :
              currentUser.onboardingComplete ? <Navigate to="/transcribe" replace /> :
                <div className="min-h-screen bg-[#fafafc] flex items-center justify-center p-6">
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
    </Suspense>
  );
}

export default App;
