import React, { useState } from 'react';

export function PatientBar({ patient, onEditPatient, onDeletePatient }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!patient) return null;

  const getInitials = (firstName, lastName) => {
    return ((firstName ? firstName[0] : '') + (lastName ? lastName[0] : '')).toUpperCase();
  };

  const handleEdit = () => {
    onEditPatient(patient);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (window.confirm(`Are you absolutely sure you want to delete ${patient.firstName} ${patient.lastName}? This action cannot be undone.`)) {
      onDeletePatient(patient._id);
      setShowDeleteConfirm(false);
    }
  };

  const handleNameClick = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="patient-bar">
      <div className="patient-avatar">
        {getInitials(patient.firstName, patient.lastName)}
      </div>
      <div className="patient-info">
        <div 
          className="patient-bar-name"
          onClick={handleNameClick}
          style={{ cursor: 'pointer' }}
          title="Click to view details"
        >
          {patient.firstName} {patient.lastName}
        </div>
        {!showDetails && (
          <div className="patient-bar-meta">
            {patient.age ? `${patient.age} y/o` : 'Age unknown'} 
            {patient.gender && ` • ${patient.gender}`}
            {patient.contactInfo?.phone && ` • ${patient.contactInfo.phone}`}
          </div>
        )}
        {showDetails && (
          <div className="patient-details-card">
            <button 
              className="card-close-btn"
              onClick={handleNameClick}
              title="Close"
            >
              X
            </button>
            {patient.medicalInfo?.medicalHistory && (
              <div className="card-section">
                <h4>Medical History</h4>
                <p>{patient.medicalInfo.medicalHistory}</p>
              </div>
            )}
            {patient.medicalInfo?.allergies?.length > 0 && (
              <div className="card-section">
                <h4>Allergies</h4>
                <div className="allergies-list">
                  {patient.medicalInfo.allergies.map((allergy, idx) => (
                    <span key={idx} className="allergy-item">{allergy}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="patient-bar-actions">
        <button 
          className="action-btn edit-btn"
          onClick={handleEdit}
          title="Edit patient"
        >
          ✏️
        </button>
        <button 
          className="action-btn delete-btn"
          onClick={handleDelete}
          title="Delete patient"
        >
          🗑️
        </button>
      </div>
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>Delete Patient?</h3>
            <p>Are you sure you want to delete <strong>{patient.firstName} {patient.lastName}</strong>?</p>
            <p className="warning-text">This action cannot be undone. All patient records and sessions will be permanently deleted.</p>
            <div className="delete-confirm-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-delete-confirm"
                onClick={handleConfirmDelete}
              >
                Delete Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
