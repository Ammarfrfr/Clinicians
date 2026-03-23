import React from 'react';

export function Sidebar({ patients, activePatientId, onSelectPatient, onNewPatient, recording, noteGenerated }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Today's sessions</h3>
        <button className="new-patient-btn" onClick={onNewPatient}>+ New patient</button>
      </div>
      
      <div className="patients-list">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className={`patient-item ${activePatientId === patient.id ? 'active' : ''}`}
            onClick={() => onSelectPatient(patient.id)}
          >
            <div className="patient-item-content">
              <div className="patient-name">{patient.name}</div>
              <div className="patient-complaint">{patient.chiefComplaint}</div>
            </div>
            <div className={`patient-badge ${
              recording && activePatientId === patient.id ? 'live' :
              noteGenerated && activePatientId === patient.id ? 'done' :
              'idle'
            }`}>
              {recording && activePatientId === patient.id ? 'Live' :
               noteGenerated && activePatientId === patient.id ? 'Done' :
               'Idle'}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
