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
    <aside className={`w-[300px] bg-navy border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 max-[768px]:w-full max-[768px]:border-none max-[768px]:overflow-hidden ${
      mobileOpen ? 'max-[768px]:max-h-[60vh] max-[768px]:overflow-y-auto' : 'max-[768px]:max-h-0'
    }`}>
      <div className="p-5 pb-2.5 flex flex-col gap-3">
        <div className="text-[11px] font-mono uppercase text-white/40 tracking-wider font-medium">Search</div>
        <div className="relative flex items-center">
          <svg className="absolute left-3 text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="w-full bg-white/4 border border-white/10 rounded-lg py-2.5 pl-[34px] pr-3 text-white text-[13.5px] transition-all duration-200 focus:bg-white/8 focus:border-teal focus:outline-none placeholder:text-white/30"
            placeholder="Name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="bg-teal text-navy border-none rounded-lg py-2.5 px-3.5 text-[13.5px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 hover:bg-teal-dark hover:-translate-y-[1px]" onClick={onNewPatient}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Patient
        </button>
      </div>

      <div style={{ padding: '0 14px 8px' }}>
        <div className="text-[11px] font-mono uppercase text-white/40 tracking-wider font-medium">Patients</div>
      </div>

      <div 
        className="flex-1 overflow-y-auto px-1.5 pb-5"
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          if (scrollTop + clientHeight >= scrollHeight - 20) {
            setVisibleCount((prev) => Math.min(prev + 15, filteredPatients.length));
          }
        }}
      >
        {filteredPatients.length === 0 && (
          <div className="text-center text-white/30 text-sm py-7 px-2.5">
            {search ? 'No patients match your search' : 'No patients yet'}
          </div>
        )}
        {filteredPatients.slice(0, visibleCount).map((patient) => (
          <div
            key={patient._id}
            className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl cursor-pointer transition-all duration-150 mb-0.5 hover:bg-white/[0.03] ${activePatientId === patient._id ? 'bg-white/[0.06]' : ''}`}
            onClick={() => onSelectPatient(patient._id)}
          >
            <div className="w-8 h-8 rounded-full bg-white/[0.06] text-white/80 flex items-center justify-center text-[11px] font-semibold">{getInitials(patient)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-medium text-white truncate">{patient.firstName} {patient.lastName}</div>
              <div className="text-[11px] text-white/40 mt-0.25 truncate">
                {patient.contactInfo?.phone && patient.contactInfo.phone}
                {!patient.contactInfo?.phone && patient.age && `Age ${patient.age}`}
                {patient.gender && ` · ${patient.gender}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
