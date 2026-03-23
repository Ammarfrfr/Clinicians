import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PatientBar } from './components/PatientBar';
import { Recorder } from './components/Recorder';
import { Transcript } from './components/Transcript';
import { NotePanel } from './components/NotePanel';
import { Vitals } from './components/Vitals';
import { PastVisits } from './components/PastVisits';
import { AddPatientModal } from './AddPatientModal';
import { EditPatientModal } from './EditPatientModal';
import { useRecorder } from './useRecorder';
import './App.css';

function App() {
  const [patients, setPatients] = useState([]);
  const [activePatientId, setActivePatientId] = useState(null);
  const [notesToday, setNotesToday] = useState(0);
  const [hoursSaved, setHoursSaved] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('record'); // 'record', 'visits', 'vitals'
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true); // true = dark, false = light

  const recorder = useRecorder(activePatientId);
  const activePatient = patients.find((p) => p._id === activePatientId);

  // Apply theme on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.style.setProperty('--bg-primary', '#080808');
      root.style.setProperty('--bg-surface', '#0f0f0f');
      root.style.setProperty('--bg-border', '#1a1a1a');
      root.style.setProperty('--text-primary', '#e2e2e2');
      root.style.setProperty('--text-muted', '#555');
      root.style.setProperty('--text-placeholder', '#333');
    } else {
      root.style.setProperty('--bg-primary', '#faf9f6');
      root.style.setProperty('--bg-surface', '#ffffff');
      root.style.setProperty('--bg-border', '#e8e7e3');
      root.style.setProperty('--text-primary', '#1a1a1a');
      root.style.setProperty('--text-muted', '#666');
      root.style.setProperty('--text-placeholder', '#ccc');
    }
  }, [isDarkMode]);

  // Fetch patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:7001/api/patients');
      const data = await response.json();
      if (data.success && data.patients) {
        setPatients(data.patients);
        if (data.patients.length > 0 && !activePatientId) {
          setActivePatientId(data.patients[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Increment notes today when note is generated
  useEffect(() => {
    if (recorder.note && !recorder.loading) {
      setNotesToday((n) => n + 1);
      setHoursSaved((h) => h + 0.25);
      // Set current session ID when recording is completed
      if (recorder.recordingId) {
        setCurrentSessionId(recorder.recordingId);
      }
    }
  }, [recorder.note, recorder.loading]);

  const handleNewPatient = () => {
    setShowAddModal(true);
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setShowEditModal(true);
  };

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    
    try {
      const response = await fetch(`http://localhost:7001/api/patients/${patientId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setPatients(patients.filter((p) => p._id !== patientId));
        if (activePatientId === patientId) {
          setActivePatientId(patients.length > 1 ? patients[0]._id : null);
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
    setActivePatientId(newPatient._id);
  };

  const handleUpdatePatient = (updatedPatient) => {
    setPatients((prev) =>
      prev.map((p) => (p._id === updatedPatient._id ? updatedPatient : p))
    );
  };

  const handleSaveNote = (savedRecording) => {
    console.log('Note saved successfully:', savedRecording);
    // Note is already saved, just show confirmation
  };

  const handleCancelNote = () => {
    // Clear the current recording
    setCurrentSessionId(null);
    // Reset the recorder state (if needed, could add a reset function to useRecorder)
  };

  if (loading) {
    return <div className="app-container"><div className="loading">Loading patients...</div></div>;
  }

  return (
    <div className="app-container">
      {/* Topbar */}
      <header className="topbar">
        <div className="logo">
          Qalam<span className="logo-dot">.</span>
        </div>
        <div className="topbar-center">
          <h2>Dr. Sharma's Clinic</h2>
        </div>
        <div className="topbar-right">
          <div className="chip">
            <span className="chip-label">Notes Today</span>
            <span className="chip-value">{notesToday}</span>
          </div>
          <div className="chip">
            <span className="chip-label">Hours Saved</span>
            <span className="chip-value">{hoursSaved.toFixed(2)}h</span>
          </div>
          <button 
            className="theme-toggle-btn"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? 'Light' : 'Dark'}
          </button>
          <div className="avatar">A</div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Sidebar */}
        <Sidebar
          patients={patients}
          activePatientId={activePatientId}
          onSelectPatient={setActivePatientId}
          onNewPatient={handleNewPatient}
          onEditPatient={handleEditPatient}
          onDeletePatient={handleDeletePatient}
          recording={recorder.recording}
          noteGenerated={!!recorder.note}
        />

        {/* Center Content */}
        <main className="center-content">
          {activePatient ? (
            <>
              <PatientBar 
                patient={activePatient}
                onEditPatient={handleEditPatient}
                onDeletePatient={handleDeletePatient}
              />
              
              <div className="tabs">
                <button 
                  className={`tab-btn ${activeTab === 'record' ? 'active' : ''}`}
                  onClick={() => setActiveTab('record')}
                >
                  Record
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'visits' ? 'active' : ''}`}
                  onClick={() => setActiveTab('visits')}
                >
                  Past visits
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'vitals' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vitals')}
                >
                  Vitals
                </button>
              </div>

              {activeTab === 'record' && (
                <>
                  <Recorder
                    recording={recorder.recording}
                    loading={recorder.loading}
                    timer={recorder.timer}
                    processingStep={recorder.processingStep}
                    onStart={recorder.start}
                    onStop={recorder.stop}
                  />

                  <Transcript transcript={recorder.transcript} />
                </>
              )}

              {activeTab === 'visits' && (
                <PastVisits 
                  patientId={activePatientId}
                  currentSessionId={currentSessionId}
                />
              )}

              {activeTab === 'vitals' && (
                <Vitals 
                  sessionId={currentSessionId}
                />
              )}
            </>
          ) : (
            <div className="no-patient-selected">
              <p>Select a patient or create a new one to start recording</p>
              <button className="btn-primary" onClick={handleNewPatient}>+ Add Patient</button>
            </div>
          )}
        </main>

        {/* Note Panel */}
        <NotePanel 
          note={recorder.note} 
          noteError={recorder.noteError}
          loading={recorder.loading}
          patient={activePatient || {}}
          transcript={recorder.transcript}
          recordingId={recorder.recordingId}
          onSave={handleSaveNote}
          onCancel={handleCancelNote}
        />
      </div>

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
    </div>
  );
}

export default App;
