import { useState } from 'react';

export function PatientBar({ patient, onEditPatient, onDeletePatient }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!patient) return null;

  const getInitials = (firstName, lastName) => {
    return ((firstName ? firstName[0] : '') + (lastName ? lastName[0] : '')).toUpperCase();
  };

  return (
    <>
      <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-3.5 px-5 mb-5 shrink-0">
        <div className="w-10 h-10 rounded-full bg-teal-light text-teal-dark flex items-center justify-center text-sm font-semibold">
          {getInitials(patient.firstName, patient.lastName)}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[15px] font-semibold text-navy cursor-pointer inline-block hover:text-teal hover:underline truncate"
            onClick={() => setShowDetails(true)}
            title="Click to view details"
          >
            {patient.firstName} {patient.lastName}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
            <span>{patient.age ? `${patient.age} y/o` : 'Age unknown'}</span>
            {patient.gender && (
              <>
                <span className="text-gray-300 font-bold">·</span>
                <span>{patient.gender}</span>
              </>
            )}
            {patient.contactInfo?.phone && (
              <>
                <span className="text-gray-300 font-bold">·</span>
                <span>{patient.contactInfo.phone}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:border-teal hover:text-teal-dark hover:bg-teal-light"
            onClick={() => onEditPatient(patient)}
            title="Edit patient"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:border-red-brand hover:text-red-brand hover:bg-red-brand-light"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete patient"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Patient Details Overlay */}
      {showDetails && (
        <>
          <div className="fixed inset-0 bg-black/20 z-[1000]" onClick={() => setShowDetails(false)} />
          <div className="absolute top-[132px] right-5 w-[360px] bg-white border border-gray-200 rounded-xl p-5 shadow-lg z-[1001] animate-in fade-in slide-in-from-right-4 duration-200">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-1" onClick={() => setShowDetails(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="mb-4 last:mb-0">
              <h4 className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-1.5">Patient Info</h4>
              <p className="text-[13.5px] text-gray-800 leading-normal">
                {patient.firstName} {patient.lastName}
                {patient.age && ` · ${patient.age} years`}
                {patient.gender && ` · ${patient.gender}`}
              </p>
            </div>

            {patient.contactInfo?.phone && (
              <div className="mb-4 last:mb-0">
                <h4 className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-1.5">Contact</h4>
                <p className="text-[13.5px] text-gray-800 leading-normal">
                  {patient.contactInfo.phone}
                  {patient.contactInfo?.email && ` · ${patient.contactInfo.email}`}
                </p>
              </div>
            )}

            {patient.medicalInfo?.medicalHistory && (
              <div className="mb-4 last:mb-0">
                <h4 className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-1.5">Medical History</h4>
                <p className="text-[13.5px] text-gray-800 leading-normal">{patient.medicalInfo.medicalHistory}</p>
              </div>
            )}

            {patient.medicalInfo?.allergies?.length > 0 && (
              <div className="mb-4 last:mb-0">
                <h4 className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-1.5">Allergies</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.medicalInfo.allergies.map((allergy, idx) => (
                    <span key={idx} className="bg-red-brand-light text-red-brand border border-red-brand/10 text-[11px] font-medium px-2 py-0.5 rounded-full">{allergy}</span>
                  ))}
                </div>
              </div>
            )}

            {patient.notes && (
              <div className="mb-4 last:mb-0">
                <h4 className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-1.5">Notes</h4>
                <p className="text-[13.5px] text-gray-800 leading-normal">{patient.notes}</p>
              </div>
            )}
          </div>
        </>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200 gap-3 text-left">
            <h3 className="text-base font-bold text-red-brand">Delete Patient?</h3>
            <p className="text-sm text-gray-600">Are you sure you want to delete patient <strong>{patient.firstName} {patient.lastName}</strong>?</p>
            <p className="text-xs font-medium text-red-brand bg-red-brand-light p-3 rounded-lg border border-red-brand/10">This will permanently delete this patient record and all their associated visit transcripts and clinical notes. This cannot be undone.</p>
            <div className="flex justify-end gap-2.5 mt-2">
              <button 
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="inline-flex items-center justify-center px-4 py-2 bg-red-brand text-white hover:bg-red-brand/90 font-semibold text-sm rounded-xl transition-all cursor-pointer border-none"
                onClick={() => {
                  onDeletePatient(patient._id);
                  setShowDeleteConfirm(false);
                }}
              >
                Delete Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
