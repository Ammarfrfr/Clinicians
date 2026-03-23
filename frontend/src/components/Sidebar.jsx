import React, { useState, useEffect } from 'react';

export function Sidebar({ patients, activePatientId, onSelectPatient, onNewPatient, recording, noteGenerated, onEditPatient, onDeletePatient }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Patients</h3>
        <button className="new-patient-btn" onClick={onNewPatient}>+ New patient</button>
      </div>
      
      <div className="patients-list">
        {patients.map((patient) => (
          <div
            key={patient._id}
            className={`patient-item ${activePatientId === patient._id ? 'active' : ''}`}
          >
            <div 
              className="patient-item-content"
              onClick={() => onSelectPatient(patient._id)}
            >
              <div className="patient-name">{patient.firstName} {patient.lastName}</div>
              <div className="patient-info">
                {patient.age && <span>Age: {patient.age}</span>}
                {patient.gender && <span>{patient.gender}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
