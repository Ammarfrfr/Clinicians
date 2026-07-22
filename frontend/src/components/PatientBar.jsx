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
      <div className="flex items-center gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 px-6 mb-6 shadow-xs shrink-0 select-none">
        <div className="w-11 h-11 rounded-xl bg-[#22252a] text-white flex items-center justify-center text-sm font-bold shadow-xs">
          {getInitials(patient.firstName, patient.lastName)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-base font-bold text-slate-900 cursor-pointer hover:text-slate-600 transition-colors truncate"
              onClick={() => setShowDetails(true)}
              title="Click to view full clinical details"
            >
              {patient.firstName} {patient.lastName}
            </span>
          </div>

          <div className="text-xs text-slate-500 font-sans flex items-center gap-2 mt-0.5">
            <span>{patient.age ? `${patient.age} y/o` : 'Age N/A'}</span>
            {patient.gender && (
              <>
                <span className="text-slate-300 font-bold">·</span>
                <span>{patient.gender}</span>
              </>
            )}
            {patient.contactInfo?.phone && (
              <>
                <span className="text-slate-300 font-bold">·</span>
                <span className="font-mono text-[11px]">{patient.contactInfo.phone}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5"
            onClick={() => onEditPatient(patient)}
            title="Edit patient profile"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
          
          <button
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all cursor-pointer flex items-center justify-center"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete patient record"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Patient Details Overlay */}
      {showDetails && (
        <>
          <div className="fixed inset-0 bg-slate-900/30 z-[1000] backdrop-blur-xs" onClick={() => setShowDetails(false)} />
          <div className="fixed top-20 left-4 right-4 md:left-auto md:right-6 md:w-[380px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-[1001] text-left flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-sans">Patient Clinical Card</h3>
              <button
                className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-1"
                onClick={() => setShowDetails(false)}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Demographics</span>
              <p className="text-xs text-slate-800 font-medium">
                {patient.firstName} {patient.lastName}
                {patient.age && ` · ${patient.age} years`}
                {patient.gender && ` · ${patient.gender}`}
              </p>
            </div>

            {patient.contactInfo?.phone && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Contact</span>
                <p className="text-xs text-slate-800 font-medium font-mono">
                  {patient.contactInfo.phone}
                  {patient.contactInfo?.email && ` · ${patient.contactInfo.email}`}
                </p>
              </div>
            )}

            {patient.medicalInfo?.medicalHistory && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Medical History</span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">{patient.medicalInfo.medicalHistory}</p>
              </div>
            )}

            {patient.medicalInfo?.allergies?.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Known Allergies</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.medicalInfo.allergies.map((allergy, idx) => (
                    <span key={idx} className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      ⚠️ {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 flex flex-col p-6 gap-4 text-left">
            <h3 className="text-base font-bold text-rose-600">Delete Patient Record?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete patient <strong>{patient.firstName} {patient.lastName}</strong>?
            </p>
            <p className="text-xs font-semibold text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 leading-relaxed">
              This will permanently remove all associated consult transcripts, SOAP notes, and prescription history.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border-none shadow-sm"
                onClick={() => {
                  onDeletePatient(patient._id);
                  setShowDeleteConfirm(false);
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
