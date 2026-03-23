import React from 'react';

export function PatientBar({ patient }) {
  if (!patient) return null;

  return (
    <div className="patient-bar">
      <div className="patient-avatar">
        {patient.initials}
      </div>
      <div className="patient-info">
        <div className="patient-bar-name">{patient.name}</div>
        <div className="patient-bar-meta">{patient.age} y/o • MRN: {patient.mrn}</div>
      </div>
      <div className="condition-tags">
        {patient.conditions?.map((condition, idx) => (
          <span key={idx} className="tag">{condition}</span>
        ))}
      </div>
    </div>
  );
}
