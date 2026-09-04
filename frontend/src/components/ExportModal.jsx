import { useState, useEffect } from 'react';
import { Printer, CheckCircle, Send, Mail } from 'lucide-react';
import { generateClinicalNotePDF, downloadPDFFromHTML } from '../utils/generatePDFHTML.js';
import { shareOnWhatsApp, generatePrescriptionMessage } from '../utils/whatsappHelper.js';

const SECTION_OPTIONS = [
  { key: 'notes', label: 'Clinical Summary' },
  { key: 'chief_complaint', label: 'Chief Complaint' },
  { key: 'history', label: 'Clinical History' },
  { key: 'examination', label: 'Physical Examination' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'prescription', label: 'Rx Medications' },
  { key: 'followup', label: 'Follow-up & Advice' },
  { key: 'vitals', label: 'Patient Vitals' },
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
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [phone, setPhone] = useState(patient?.contactInfo?.phone || '');
  const [email, setEmail] = useState(patient?.contactInfo?.email || '');
  const [dispatchStatus, setDispatchStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPdfGenerated(false);
      setDispatchStatus('');
      setPhone(patient?.contactInfo?.phone || '');
      setEmail(patient?.contactInfo?.email || '');
    }
  }, [isOpen, patient]);

  if (!isOpen) return null;

  const toggleSection = (key) => {
    if (physicalLetterhead) return;
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLetterheadToggle = (e) => {
    const isChecked = e.target.checked;
    setPhysicalLetterhead(isChecked);
    if (isChecked) {
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
    downloadPDFFromHTML(html, `Scribologist_Handout_${patient?.firstName || 'Patient'}.pdf`);
    setPdfGenerated(true);
  };

  const handleWhatsAppSend = () => {
    const msg = generatePrescriptionMessage(patient, doctor, note);
    shareOnWhatsApp(phone, msg);
    setDispatchStatus('WhatsApp notification sent!');
    setTimeout(() => setDispatchStatus(''), 4000);
  };

  const handleEmailSend = () => {
    setDispatchStatus('Handout queued for email delivery!');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-xs select-none" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200/90 flex flex-col p-7 text-left animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {pdfGenerated ? (
          /* POST PDF GENERATION SHARE STEP */
          <div className="flex flex-col gap-4 text-left">
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-xs font-bold font-sans">PDF Generated & Downloaded!</h3>
                <p className="text-[11px] text-emerald-700 font-sans">Would you like to send it to the patient now?</p>
              </div>
            </div>

            {dispatchStatus && (
              <div className="p-2.5 bg-teal-light/30 border border-teal/30 text-teal-dark rounded-xl text-xs font-bold text-center">
                {dispatchStatus}
              </div>
            )}

            {/* Option 1: Send via WhatsApp */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[10px] font-bold">W</span>
                Send Handout via WhatsApp
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Enter phone number..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-teal font-mono bg-white"
                />
                <button
                  onClick={handleWhatsAppSend}
                  className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Send width="12" height="12" />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Option 2: Send via Email */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0A2947]" />
                Send Handout via Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter patient email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-teal font-sans bg-white"
                />
                <button
                  onClick={handleEmailSend}
                  className="px-4 py-2 bg-[#0A2947] hover:bg-[#0A2947]/90 text-white text-xs font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Mail width="12" height="12" />
                  Send Email
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-[#0A2947] text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-[#0A2947]/90 border-none transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD PDF SECTION SELECTION STEP */
          <>
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h2
                className="text-2xl font-normal text-[#22252a] tracking-tight mb-1"
                style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}
              >
                Export Clinical Handout
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Configure section inclusion for the patient PDF document.
              </p>
            </div>

            {/* Physical Letterhead Toggle */}
            <div className="mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left">
              <label className="flex items-center gap-3 cursor-pointer font-bold text-xs text-slate-900 uppercase tracking-wider font-mono">
                <input
                  type="checkbox"
                  checked={physicalLetterhead}
                  onChange={handleLetterheadToggle}
                  className="cursor-pointer w-4 h-4 accent-slate-900"
                />
                <Printer className="w-4 h-4 text-slate-700" /> Print on Physical Clinic Letterhead
              </label>
              <div className="text-[11px] text-slate-500 mt-1.5 ml-7 font-sans">
                Leaves 180px top margin for pre-printed letterheads. Hides internal assessment sections.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6 text-left">
              {SECTION_OPTIONS.map(({ key, label }) => (
                <label 
                  key={key} 
                  className={`flex items-center gap-3 p-3 px-3.5 rounded-xl border transition-all select-none ${
                    sections[key]
                      ? 'border-slate-800 bg-slate-900/5'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50'
                  } ${physicalLetterhead ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={sections[key]}
                    onChange={() => toggleSection(key)}
                    disabled={physicalLetterhead}
                    className="w-4 h-4 accent-slate-900 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-xs font-bold text-slate-900">{label}</span>
                  {!hasData(key) && (
                    <span className="ml-auto text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">Empty</span>
                  )}
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 bg-[#22252a] hover:bg-[#1a1c20] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md border-none flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleExport}
                disabled={enabledCount === 0}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Generate PDF ({enabledCount} Sections)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
