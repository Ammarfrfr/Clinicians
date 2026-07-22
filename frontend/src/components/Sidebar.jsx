import { useState, useEffect } from 'react';

export function Sidebar({ patients, activePatientId, onSelectPatient, onNewPatient, mobileOpen }) {
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    setVisibleCount(15);
  }, [search]);

  const filteredPatients = patients.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const phone = (p.contactInfo?.phone || '').toLowerCase();
    const email = (p.contactInfo?.email || '').toLowerCase();
    return fullName.includes(q) || phone.includes(q) || email.includes(q);
  });

  const getInitials = (p) => {
    return ((p.firstName?.[0] || '') + (p.lastName?.[0] || '')).toUpperCase();
  };

  return (
    <aside
      className={`w-[290px] bg-[#1e2126] border-r border-slate-800/80 flex flex-col shrink-0 transition-all duration-300 select-none max-[768px]:w-full max-[768px]:border-none max-[768px]:overflow-hidden ${
        mobileOpen ? 'max-[768px]:max-h-[60vh] max-[768px]:overflow-y-auto' : 'max-[768px]:max-h-0'
      }`}
    >
      {/* Sidebar Search & New Patient Section */}
      <div className="p-5 pb-3 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-widest font-bold">
            Patient Directory
          </span>
        </div>

        {/* Search Field */}
        <div className="relative flex items-center">
          <svg className="absolute left-3 text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-slate-100 text-xs transition-all duration-200 focus:bg-slate-800 focus:border-slate-500 focus:outline-none placeholder:text-slate-500 font-sans"
            placeholder="Search name, phone, or MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Add Patient Button */}
        <button
          className="w-full bg-white hover:bg-slate-100 text-slate-900 border-none rounded-xl py-2.5 px-3.5 text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-all shadow-sm"
          onClick={onNewPatient}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New Patient
        </button>
      </div>

      {/* Patient List */}
      <div 
        className="flex-1 overflow-y-auto px-2 pb-6 flex flex-col gap-1 scrollbar-none"
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          if (scrollTop + clientHeight >= scrollHeight - 20) {
            setVisibleCount((prev) => Math.min(prev + 15, filteredPatients.length));
          }
        }}
      >
        {filteredPatients.length === 0 && (
          <div className="text-center text-slate-500 text-xs py-10 px-3 font-sans">
            {search ? 'No patients match your search query' : 'No patient records found.'}
          </div>
        )}

        {filteredPatients.slice(0, visibleCount).map((patient) => {
          const isActive = activePatientId === patient._id;

          return (
            <div
              key={patient._id}
              className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl cursor-pointer transition-all text-left ${
                isActive
                  ? 'bg-slate-800/90 border border-slate-700/80 text-white shadow-xs'
                  : 'hover:bg-slate-800/40 text-slate-300 border border-transparent'
              }`}
              onClick={() => onSelectPatient(patient._id)}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                  isActive ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {getInitials(patient)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate tracking-tight">
                  {patient.firstName} {patient.lastName}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                  {patient.contactInfo?.phone || (patient.age ? `${patient.age} y/o` : 'General')}
                  {patient.gender && ` · ${patient.gender}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
