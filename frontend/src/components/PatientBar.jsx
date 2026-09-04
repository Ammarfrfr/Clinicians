import { useState } from 'react';

export function PatientBar({
  patient,
  onEditPatient,
  onDeletePatient,
  timer = 0,
  onShare
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!patient) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <>
      <div className="flex items-center justify-between pb-2 border-b border-[#D3D4C0]/60 mb-2 shrink-0 select-none">
        {/* Left: Patient Identifier, Edit/Delete icons, Date Tag in single inline row */}
        <div className="flex items-center gap-2.5 text-left flex-wrap">
          {/* Sync icon / Avatar circle */}
          <div 
            className="w-7 h-7 rounded-full border border-[#D3D4C0] bg-white text-[#0A2947] flex items-center justify-center text-xs font-semibold cursor-pointer hover:bg-[#F3E4C9]/40 transition-colors shadow-xs" 
            onClick={() => setShowDetails(true)} 
            title="View clinical details"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>
          </div>

          <span
            className="text-lg font-extrabold text-[#0A2947] font-187 cursor-pointer hover:text-[#8B5E3C] transition-colors tracking-tight"
            onClick={() => setShowDetails(true)}
          >
            {patient.firstName ? `${patient.firstName} ${patient.lastName}` : 'Add patient identifier'}
          </span>

          {/* Edit Icon */}
          <button
            className="bg-transparent border-none text-[#0A2947]/40 hover:text-[#8B5E3C] cursor-pointer p-0.5 transition-colors"
            onClick={() => onEditPatient(patient)}
            title="Edit Patient Profile"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          {/* Delete Icon */}
          <button
            className="bg-transparent border-none text-[#0A2947]/30 hover:text-rose-600 cursor-pointer p-0.5 transition-colors"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete Patient Record"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>

          {/* Date Tag */}
          <span className="inline-flex items-center gap-1 text-xs text-[#0A2947]/70 bg-white border border-[#D3D4C0] px-2 py-0.5 rounded-lg font-sans ml-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Today 10:50 PM
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onShare && (
            <button
              onClick={onShare}
              className="bg-white border border-[#D3D4C0] text-[#0A2947] hover:bg-[#F3E4C9]/40 cursor-pointer p-1.5 transition-all flex items-center justify-center rounded-xl shadow-xs"
              title="Share Clinical Report"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Patient Details Modal */}
      {showDetails && (
        <>
          <div className="fixed inset-0 bg-slate-950/20 z-[1000] backdrop-blur-xs" onClick={() => setShowDetails(false)} />
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-[1001] text-left flex flex-col gap-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-855">Patient Clinical Card</h3>
              <button
                className="text-slate-400 hover:text-slate-650 bg-transparent border-none cursor-pointer p-1 font-bold"
                onClick={() => setShowDetails(false)}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Demographics</span>
              <p className="text-xs text-slate-850 font-semibold">
                {patient.firstName} {patient.lastName}
                {patient.age && ` · ${patient.age} years`}
                {patient.gender && ` · ${patient.gender}`}
              </p>
            </div>

            {patient.contactInfo?.phone && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Contact</span>
                <p className="text-xs text-slate-850 font-semibold font-mono">
                  {patient.contactInfo.phone}
                  {patient.contactInfo?.email && ` · ${patient.contactInfo.email}`}
                </p>
              </div>
            )}

            {patient.medicalInfo?.medicalHistory && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Medical History</span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{patient.medicalInfo.medicalHistory}</p>
              </div>
            )}

            {patient.medicalInfo?.allergies?.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Known Allergies</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.medicalInfo.allergies.map((allergy, idx) => (
                    <span key={idx} className="bg-rose-50 text-rose-700 border border-rose-250/60 text-[9px] font-bold px-2 py-0.5 rounded-md">
                      {allergy}
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
        <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 flex flex-col p-6 gap-4 text-left">
            <h3 className="text-sm font-extrabold text-rose-600">Delete Patient Record?</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
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
