import { useState } from 'react';
import { Printer } from 'lucide-react';
import { generateClinicalNotePDF, downloadPDFFromHTML } from '../utils/generatePDFHTML.js';

const SECTION_OPTIONS = [
  { key: 'notes', label: 'Clinical Note / Summary' },
  { key: 'chief_complaint', label: 'Chief Complaint' },
  { key: 'history', label: 'History' },
  { key: 'examination', label: 'Examination' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'prescription', label: 'Prescription' },
  { key: 'followup', label: 'Follow-up' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'exercises', label: 'Rehabilitation' },
];

export function ExportModal({ isOpen, onClose, note, patient, doctor }) {
  const hasData = (key) => {
    if (key === 'vitals') {
      return !!(note?.vitals && Object.keys(note.vitals).length > 0);
    }
    if (key === 'prescription') {
      return !!(Array.isArray(note?.prescription) && note.prescription.length > 0);
    }
    if (key === 'exercises') {
      return !!(Array.isArray(note?.exercises) && note.exercises.length > 0);
    }
    return !!note?.[key];
  };

  const [sections, setSections] = useState(() =>
    Object.fromEntries(SECTION_OPTIONS.map((s) => [s.key, hasData(s.key)]))
  );
  const [physicalLetterhead, setPhysicalLetterhead] = useState(false);

  if (!isOpen) return null;

  const toggleSection = (key) => {
    if (physicalLetterhead) return;
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLetterheadToggle = (e) => {
    const isChecked = e.target.checked;
    setPhysicalLetterhead(isChecked);
    if (isChecked) {
      // Force uncheck clinical fields, check only Rx and follow-up/notes
      setSections({
        notes: true,
        chief_complaint: false,
        history: false,
        examination: false,
        diagnosis: false,
        prescription: true,
        followup: true,
        vitals: false,
        exercises: true,
      });
    } else {
      // Reset back to checking all that have data
      setSections(Object.fromEntries(SECTION_OPTIONS.map((s) => [s.key, hasData(s.key)])));
    }
  };

  const enabledCount = Object.values(sections).filter(Boolean).length;

  const handleExport = () => {
    const html = generateClinicalNotePDF(
      note,
      patient,
      doctor || { profile: { name: 'Dr. Clinician' } },
      sections,
      { physicalLetterhead }
    );
    downloadPDFFromHTML(html, `${physicalLetterhead ? 'Prescription' : 'Clinical_Note'}_${patient?.firstName || 'Patient'}.pdf`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-xs" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-navy mb-1 text-left">Export PDF</h2>
        <p className="text-xs text-gray-500 mb-4 text-left">
          Select which sections to include in the report
        </p>

        {/* Physical Letterhead Toggle */}
        <div className="mb-5 p-3.5 bg-teal-light/50 rounded-xl border border-teal/20 text-left">
          <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-sm text-teal-dark">
            <input
              type="checkbox"
              checked={physicalLetterhead}
              onChange={handleLetterheadToggle}
              className="cursor-pointer w-4 h-4 accent-teal"
            />
            <Printer className="w-4 h-4" /> Print on Physical Letterhead
          </label>
          <div className="text-[11px] text-gray-500 mt-1 ml-6.5">
            Leaves 180px top clearance for physical letterhead. Hides internal assessment.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-left">
          {SECTION_OPTIONS.map(({ key, label }) => (
            <label 
              key={key} 
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all select-none ${sections[key] ? 'border-teal/35 bg-teal-light/10' : 'border-gray-150 bg-white hover:bg-gray-50'} ${physicalLetterhead ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input
                type="checkbox"
                checked={sections[key]}
                onChange={() => toggleSection(key)}
                disabled={physicalLetterhead}
                className="w-4 h-4 accent-teal cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-sm font-semibold text-navy">{label}</span>
              {!hasData(key) && (
                <span className="ml-auto text-[9.5px] font-bold text-red-brand bg-red-brand-light px-1.5 py-0.5 rounded uppercase">No data</span>
              )}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
          <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal hover:bg-teal-dark text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleExport} disabled={enabledCount === 0}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Export {enabledCount} Section{enabledCount !== 1 ? 's' : ''}
          </button>
          <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
