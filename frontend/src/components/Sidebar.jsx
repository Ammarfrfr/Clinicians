import { useState, useEffect } from 'react';

export function Sidebar({
  patients,
  activePatientId,
  onSelectPatient,
  onNewPatient,
  activeSidebarTab,
  setActiveSidebarTab,
  mobileOpen,
  currentUser,
  notesToday,
  hoursSaved,
  handleLogout
}) {
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

  const isExpanded = activeSidebarTab === 'patients';

  return (
    <div className="flex h-full shrink-0 select-none relative z-40">
      {/* 1. Far Left Narrow Icon Rail (64px) - Heidi Style Light Warm Theme */}
      <aside className="w-[64px] bg-[#F9F6F1] flex flex-col items-center py-5 justify-between h-full shrink-0 border-r border-[#D3D4C0]">
        
        {/* Top Section */}
        <div className="flex flex-col gap-5 items-center w-full">
          {/* Logo Brand Icon */}
          <div className="w-10 h-10 rounded-2xl bg-white text-[#0A2947] flex items-center justify-center font-serif text-xl font-black italic shadow-xs border border-[#D3D4C0]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A2947" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v10M7 12h10" />
            </svg>
          </div>

          {/* Plus Create Action */}
          <button
            onClick={onNewPatient}
            className="w-10 h-10 rounded-xl bg-[#8B5E3C] hover:bg-[#6e482d] text-white flex items-center justify-center cursor-pointer border-none shadow-xs transition-all hover:scale-105"
            title="Create Encounter"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Navigation icons matching Heidi mockup */}
          <div className="flex flex-col gap-3.5 w-full items-center">
            {/* Scribe icon */}
            <button
              onClick={() => setActiveSidebarTab(activeSidebarTab === 'patients' ? null : 'patients')}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center cursor-pointer border-none transition-all ${
                activeSidebarTab === 'patients'
                  ? 'bg-[#F3E4C9] text-[#8B5E3C] border border-[#8B5E3C]/30 shadow-xs'
                  : 'bg-transparent text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-white/60'
              }`}
              title="Sessions / Encounters"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5v14M22 9v6M7 8v8M2 10v4" />
              </svg>
              <span className="text-[9px] font-medium mt-0.5">Scribe</span>
            </button>

            {/* AI Chats icon */}
            <button
              onClick={() => setActiveSidebarTab(activeSidebarTab === 'chats' ? null : 'chats')}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center cursor-pointer border-none transition-all ${
                activeSidebarTab === 'chats'
                  ? 'bg-[#F3E4C9] text-[#8B5E3C] border border-[#8B5E3C]/30 shadow-xs'
                  : 'bg-transparent text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-white/60'
              }`}
              title="AI Assist Chats"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-[9px] font-medium mt-0.5">Chats</span>
            </button>

            {/* Tasks & Todo icon */}
            <button
              onClick={() => setActiveSidebarTab(activeSidebarTab === 'tasks' ? null : 'tasks')}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center cursor-pointer border-none transition-all ${
                activeSidebarTab === 'tasks'
                  ? 'bg-[#F3E4C9] text-[#8B5E3C] border border-[#8B5E3C]/30 shadow-xs'
                  : 'bg-transparent text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-white/60'
              }`}
              title="Tasks"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span className="text-[9px] font-medium mt-0.5">Tasks</span>
            </button>

            {/* WhatsApp Appointment Queue icon */}
            <button
              onClick={() => setActiveSidebarTab(activeSidebarTab === 'appointments' ? null : 'appointments')}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center cursor-pointer border-none transition-all ${
                activeSidebarTab === 'appointments'
                  ? 'bg-[#F3E4C9] text-[#8B5E3C] border border-[#8B5E3C]/30 shadow-xs'
                  : 'bg-transparent text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-white/60'
              }`}
              title="WhatsApp Pre-Consult & Appointment Queue"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="text-[9px] font-medium mt-0.5">Queue</span>
            </button>

            {/* Schedule icon */}
            <button
              onClick={() => setActiveSidebarTab(activeSidebarTab === 'schedule' ? null : 'schedule')}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center cursor-pointer border-none transition-all ${
                activeSidebarTab === 'schedule'
                  ? 'bg-[#F3E4C9] text-[#8B5E3C] border border-[#8B5E3C]/30 shadow-xs'
                  : 'bg-transparent text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-white/60'
              }`}
              title="Doctor Practice Schedule"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-[9px] font-medium mt-0.5">Schedule</span>
            </button>

            {/* Escalation Rules icon */}
            <button
              onClick={() => setActiveSidebarTab(activeSidebarTab === 'escalation' ? null : 'escalation')}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center cursor-pointer border-none transition-all ${
                activeSidebarTab === 'escalation'
                  ? 'bg-[#F3E4C9] text-[#8B5E3C] border border-[#8B5E3C]/30 shadow-xs'
                  : 'bg-transparent text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-white/60'
              }`}
              title="Escalation Red-Flag Rules"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-[9px] font-medium mt-0.5">Rules</span>
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4 items-center w-full">
          {/* User profile avatar (Heidi style) */}
          <div className="relative">
            <button
              onClick={() => setActiveSidebarTab(activeSidebarTab === 'profile' ? null : 'profile')}
              className={`w-9 h-9 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center text-xs font-bold cursor-pointer select-none border border-[#D3D4C0] hover:bg-[#6e482d] transition-all ${
                activeSidebarTab === 'profile' ? 'ring-2 ring-[#8B5E3C]' : ''
              }`}
              title="Clinician Profile"
            >
              {currentUser?.profile?.name?.[0] || 'A'}
            </button>

            {activeSidebarTab === 'profile' && (
              <div className="absolute bottom-2 left-14 bg-white border border-[#D3D4C0] text-[#0A2947] rounded-2xl w-60 p-4 shadow-xl z-50 flex flex-col gap-3 text-left">
                <div>
                  <div className="text-sm font-bold font-187">Dr. {currentUser?.profile?.name || 'Clinician'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{currentUser?.profile?.qualification || 'Clinician'} · {currentUser?.profile?.specialization || 'General'}</div>
                </div>
                <div className="h-px bg-[#D3D4C0]/50" />
                <div className="flex flex-col gap-1 text-[11px] text-[#0A2947]/70 font-mono">
                  <div>Notes Today: <strong className="text-[#0A2947]">{notesToday || 0}</strong></div>
                  <div>Time Saved: <strong className="text-[#0A2947]">{(hoursSaved || 0).toFixed(1)}h</strong></div>
                </div>
                <div className="h-px bg-[#D3D4C0]/50" />
                <button className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-rose-200 flex items-center justify-center gap-2" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Sessions Drawer Panel (Heidi Style White Canvas Card) */}
      <aside
        className={`bg-[#F9F6F1] border-r border-[#D3D4C0] flex flex-col shrink-0 transition-all duration-300 overflow-hidden ${
          isExpanded ? 'w-[280px]' : 'w-0 border-r-0'
        }`}
      >
        <div className="w-[280px] flex flex-col h-full bg-[#F9F6F1]">
          {/* Header Row */}
          <div className="p-4 pb-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0A2947] font-187 tracking-tight">Sessions</h2>
            </div>

            {/* Filter pills & Action buttons matching Heidi screenshot */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="bg-[#F3E4C9] border border-[#D3D4C0] px-3 py-1 rounded-full text-xs font-medium text-[#0A2947] font-sans">
                My sessions
              </span>
              <div className="flex items-center gap-1">
                <button onClick={onNewPatient} className="bg-[#8B5E3C] hover:bg-[#6e482d] text-white p-1.5 rounded-lg flex items-center justify-center cursor-pointer border-none shadow-xs" title="New Session">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
            </div>

            {/* Search Input bar */}
            <div className="relative flex items-center mt-1">
              <svg className="absolute left-3 text-[#0A2947]/40" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="w-full bg-white border border-[#D3D4C0] rounded-xl py-1.5 pl-8 pr-3 text-[#0A2947] text-xs focus:outline-none placeholder:text-[#0A2947]/40 font-sans"
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List grouped by date categories */}
          <div
            className="flex-1 overflow-y-auto px-3 pb-6 flex flex-col gap-4 no-scrollbar mt-1"
            onScroll={(e) => {
              const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
              if (scrollTop + clientHeight >= scrollHeight - 20) {
                setVisibleCount((prev) => Math.min(prev + 15, filteredPatients.length));
              }
            }}
          >
            {filteredPatients.length === 0 ? (
              <div className="text-center text-[#0A2947]/50 text-xs py-10 px-3 font-sans">
                No matching sessions found.
              </div>
            ) : (
              <div>
                <div className="text-[11px] font-bold text-[#0A2947]/60 font-187 px-1 mb-2 flex items-center gap-1">
                  <span>Today</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {filteredPatients.slice(0, visibleCount).map((patient) => {
                    const isActive = activePatientId === patient._id;
                    const dateStr = patient.createdAt ? new Date(patient.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:50pm';
                    const dayStr = patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '25 Jul';

                    return (
                      <div
                        key={patient._id}
                        className={`flex items-start gap-2.5 p-3 rounded-2xl cursor-pointer transition-all text-left ${
                          isActive
                            ? 'bg-white border border-[#D3D4C0] shadow-xs'
                            : 'hover:bg-white/60 text-[#0A2947]/70 border border-transparent'
                        }`}
                        onClick={() => onSelectPatient(patient._id)}
                      >
                        {/* Dashed initial circle matching Heidi screenshot */}
                        <div className="w-8 h-8 rounded-full border border-dashed border-[#0A2947]/30 bg-[#F9F6F1] text-[#0A2947] flex items-center justify-center text-[10px] font-semibold shrink-0">
                          {getInitials(patient)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[#0A2947] truncate font-sans">
                            {patient.firstName ? `${patient.firstName} ${patient.lastName}` : 'Add patient identifier'}
                          </div>
                          <div className="text-[10px] text-[#0A2947]/50 mt-0.5 truncate">
                            {patient.chiefComplaint || 'Untitled session'}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-medium text-[#0A2947]">{dateStr}</div>
                          <div className="text-[9px] text-[#0A2947]/40 mt-0.5">{dayStr}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
