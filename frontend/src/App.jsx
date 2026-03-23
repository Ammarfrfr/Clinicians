import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PatientBar } from './components/PatientBar';
import { Recorder } from './components/Recorder';
import { Transcript } from './components/Transcript';
import { NotePanel } from './components/NotePanel';
import { useRecorder } from './useRecorder';
import './App.css';

function App() {
  const [patients, setPatients] = useState([
    {
      id: 1,
      name: 'Rajesh Kumar',
      initials: 'RK',
      chiefComplaint: 'Fever & cough',
      age: 45,
      mrn: '10234',
      conditions: ['Fever', 'Respiratory'],
    },
    {
      id: 2,
      name: 'Priya Singh',
      initials: 'PS',
      chiefComplaint: 'Headache',
      age: 32,
      mrn: '10235',
      conditions: ['Migraine'],
    },
  ]);

  const [activePatientId, setActivePatientId] = useState(1);
  const [notesToday, setNotesToday] = useState(0);
  const [hoursSaved, setHoursSaved] = useState(0);

  const recorder = useRecorder();
  const activePatient = patients.find((p) => p.id === activePatientId);

  // Increment notes today when note is generated
  useEffect(() => {
    if (recorder.note && !recorder.loading) {
      setNotesToday((n) => n + 1);
      setHoursSaved((h) => h + 0.25); // Assume each note saves 15 minutes
    }
  }, [recorder.note, recorder.loading]);

  const handleNewPatient = () => {
    const newPatient = {
      id: Math.max(...patients.map((p) => p.id), 0) + 1,
      name: 'New Patient',
      initials: 'NP',
      chiefComplaint: 'Enter chief complaint',
      age: 0,
      mrn: 'XXXXX',
      conditions: [],
    };
    setPatients([...patients, newPatient]);
    setActivePatientId(newPatient.id);
  };

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
          recording={recorder.recording}
          noteGenerated={!!recorder.note}
        />

        {/* Center Content */}
        <main className="center-content">
          <PatientBar patient={activePatient} />
          
          <div className="tabs">
            <button className="tab-btn active">Record</button>
            <button className="tab-btn">Past visits</button>
            <button className="tab-btn">Vitals</button>
          </div>

          <Recorder
            recording={recorder.recording}
            loading={recorder.loading}
            timer={recorder.timer}
            processingStep={recorder.processingStep}
            onStart={recorder.start}
            onStop={recorder.stop}
          />

          <Transcript transcript={recorder.transcript} />
        </main>

        {/* Note Panel */}
        <NotePanel note={recorder.note} loading={recorder.loading} />
      </div>
    </div>
  );
}

export default App;
