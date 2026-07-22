import React from 'react';

const slides = [
  {
    id: 'transcribe',
    num: '01',
    giantText: 'SCRIBE',
    title: 'Ambient AI Clinical Transcription',
    desc: 'Scribologist ambiently records and transcribes doctor-patient conversations in real time with high clinical accuracy across multiple Indian languages.',
    desc2: 'Supports English, Gujarati, Hindi, Marathi, and regional code-switching with zero raw audio saved on disk for DPDP compliance.',
  },
  {
    id: 'search',
    num: '02',
    giantText: 'SOAP',
    title: 'Instant SOAP Note Generation',
    desc: 'Auto-extracts Subjective complaints, Objective vitals, Assessment diagnoses, and Plan prescriptions into clean clinical templates in seconds.',
    desc2: 'Includes automatic CDSCO drug index validation to check dosages and flag potential patient allergy contraindications.',
  },
  {
    id: 'followup',
    num: '03',
    giantText: 'HER',
    title: 'Seamless EHR & Prescription Export',
    desc: 'Export structured summaries, print patient handouts, or sync encounter history directly into your clinic workflow or hospital management system.',
    desc2: 'Maintains strict doctor-in-the-loop control for rapid one-click review and signature before finalizing records.',
  },
];

export function ProductShowcase({ containerRef, activeTab, showcaseProgress, handleTabClick, onNavigate }) {
  return (
    <section ref={containerRef} className="relative w-full h-[250vh] z-10 bg-[#fafafc]">
      <div className="sticky top-[76px] h-[calc(100vh-76px)] flex flex-col justify-between py-6 lg:py-10 w-full overflow-hidden">

        {/* Screenshot Title Heading - Aligned with "Autonomous" on the left */}
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 text-left mt-2 lg:mt-3 z-20">
          <h2 className="text-3xl sm:text-4xl lg:text-7xl font-serif text-[#22252a] leading-[1.1] tracking-tight mb-6 sm:mb-10">
            Scribologist Overview
          </h2>
        </div>

        {/* Horizontal Slide Track for both Desktop and Mobile */}
        <div
          id="horizontal-slide-track"
          className="flex flex-row w-[300vw] h-[58vh] items-center transition-transform duration-100 ease-out z-10 my-auto overflow-hidden scrollbar-none gap-0 px-0"
          style={{ transform: `translate3d(-${showcaseProgress * 200}vw, 0, 0)` }}
        >
          {slides.map((tab) => {
            return (
              <div
                id={`slide-${tab.id}`}
                key={tab.id}
                className="w-screen shrink-0 h-full flex items-center justify-center relative px-6 md:px-10"
              >
                {/* Outlined Backdrop Text */}
                <span
                  className="font-sans font-black text-[12vw] tracking-widest text-transparent uppercase select-none pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] z-0 transition-all duration-500 lg:inline-block hidden"
                  style={{ WebkitTextStroke: '2px #0f172a' }}
                >
                  {tab.giantText}
                </span>

                {/* Content Grid - Aligned with max-w-7xl */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-center w-full max-w-7xl z-10 relative">

                  {/* Left Column: Details */}
                  <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-5 text-left relative z-10 w-full order-2 lg:order-1">
                    <div className="flex items-center gap-3">
                      <span className="font-sans text-lg lg:text-5xl font-medium text-slate-400">
                        {tab.num}
                      </span>
                      <h3 className="text-xl md:text-2xl lg:text-[28px] font-sans font-bold tracking-tight text-slate-900">
                        {tab.title}
                      </h3>
                    </div>

                    <div className="flex flex-col gap-3 lg:gap-4">
                      <p className="text-xs lg:text-[14px] text-slate-600 leading-relaxed font-sans font-medium">
                        {tab.desc}
                      </p>
                      <p className="text-xs lg:text-[14px] text-slate-500 leading-relaxed font-sans font-medium hidden sm:block">
                        {tab.desc2}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Clean White HTML UI Mockup representing our real UI/UX */}
                  <div className="lg:col-span-7 flex justify-center w-full order-1 lg:order-2">
                    <div className="relative w-full aspect-[16/10] max-w-[320px] sm:max-w-[520px] lg:max-w-[680px] bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 p-0 flex flex-col justify-start">
                      
                      {/* Top Browser Bar */}
                      <div className="w-full h-8 bg-slate-950 border-b border-slate-800 flex items-center px-4 gap-2">
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                        </div>
                        <div className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono rounded px-3 py-0.5 mx-auto w-64 text-center select-none truncate">
                          {tab.id === 'transcribe' ? 'scribologist.ai/transcribe' : tab.id === 'search' ? 'scribologist.ai/clinical-notes' : 'scribologist.ai/handout/export'}
                        </div>
                      </div>

                      {/* Mockup Content Box */}
                      <div className="flex-1 w-full bg-[#fafafc] flex overflow-hidden text-left text-slate-800 font-sans relative">
                        
                        {/* Slide 1: Transcription Recorder Dashboard */}
                        {tab.id === 'transcribe' && (
                          <div className="flex w-full h-full">
                            {/* Mini Sidebar */}
                            <div className="w-1/4 bg-white border-r border-slate-200/90 p-3 hidden sm:flex flex-col gap-2">
                              <span className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">Patients</span>
                              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-900 truncate">Ammar Shaikh</span>
                                <span className="text-[8px] font-mono text-slate-400">21 yrs · Male</span>
                              </div>
                              <div className="opacity-50 flex flex-col gap-2 mt-1">
                                <div className="h-6 bg-slate-100 rounded-md" />
                                <div className="h-6 bg-slate-100 rounded-md" />
                              </div>
                            </div>

                            {/* Main Active Recorder view */}
                            <div className="flex-1 p-4 flex flex-col justify-between">
                              <div className="flex justify-between items-center">
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Live Transcription
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">00:48 / 10:00</span>
                              </div>

                              {/* Pulser Mic waveform */}
                              <div className="flex items-center justify-center my-4 relative">
                                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center animate-ping absolute" />
                                <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-md z-10">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                                  </svg>
                                </div>
                              </div>

                              {/* Live Audio Transcript stream scroll */}
                              <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex flex-col gap-2 shadow-xs">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[9px] font-bold text-slate-800">Dr. Ammar (00:28)</span>
                                  <span className="text-[10.5px] text-slate-600 leading-relaxed">Let me examine your right knee. Raise your leg straight off the table for me...</span>
                                </div>
                                <div className="flex flex-col gap-0.5 border-t border-slate-100 pt-1.5">
                                  <span className="text-[9px] font-bold text-slate-800">Patient (00:34)</span>
                                  <span className="text-[10.5px] text-slate-600 leading-relaxed">Sure, let me try. Ah, it starts aching right around the knee cap when I do that...</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Slide 2: SOAP Editor Panel */}
                        {tab.id === 'search' && (
                          <div className="flex w-full h-full">
                            {/* Main SOAP Sheet container */}
                            <div className="flex-1 p-4 flex flex-col gap-3">
                              {/* Clinical Note header tabs */}
                              <div className="flex border-b border-slate-200">
                                <button className="border-b-2 border-slate-900 pb-1.5 text-[10.5px] font-bold text-slate-900 px-3 bg-transparent border-none">Clinical SOAP Note</button>
                                <button className="pb-1.5 text-[10.5px] font-medium text-slate-400 px-3 bg-transparent border-none">Medication Rx</button>
                                <button className="pb-1.5 text-[10.5px] font-medium text-slate-400 px-3 bg-transparent border-none">Handout</button>
                              </div>

                              {/* Rich Form Textareas */}
                              <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-1">
                                <div className="flex flex-col gap-1 text-left">
                                  <div className="flex items-center gap-1">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                                      <path d="M12 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15a6 6 0 0 0 12 0v-3" />
                                      <circle cx="20" cy="10" r="2" />
                                    </svg>
                                    <span className="text-[9px] font-mono font-bold uppercase text-slate-500 tracking-wider">Subjective History</span>
                                  </div>
                                  <div className="bg-white border border-slate-200/90 rounded-lg p-2.5 text-[10px] text-slate-700 leading-relaxed font-sans shadow-xs">
                                    21-year-old male presenting with right patellofemoral pain. Pain is localized to the anterior kneecap, aggravated by stairs and sitting.
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1 text-left">
                                  <span className="text-[9px] font-mono font-bold uppercase text-slate-500 tracking-wider">Assessment / Diagnosis</span>
                                  <div className="bg-white border border-slate-200/90 rounded-lg p-2.5 text-[10px] text-slate-700 leading-relaxed font-sans shadow-xs border-l-3 border-l-emerald-500">
                                    <strong>Primary:</strong> Right Patellofemoral Pain Syndrome (Runner's Knee). Mild muscle imbalances noted.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Slide 3: Handout & Prescription PDF Printout */}
                        {tab.id === 'followup' && (
                          <div className="flex w-full h-full items-center justify-center p-4">
                            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-md max-w-sm w-full flex flex-col gap-3 text-left">
                              {/* Letterhead */}
                              <div className="border-b border-slate-100 pb-2 flex justify-between items-start">
                                <div>
                                  <h4 className="text-[11px] font-bold text-slate-900 uppercase">Scribologist Clinic</h4>
                                  <span className="text-[8px] text-slate-400">Dr. Ammar Shaikh · Consultant Orthopedic</span>
                                </div>
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-bold rounded-md uppercase tracking-wider">✓ Compiled</span>
                              </div>

                              {/* Prescribed Medications */}
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-mono font-bold uppercase text-slate-400 tracking-wider">Prescribed Meds</span>
                                <div className="border border-slate-100 rounded-lg overflow-hidden text-[9px] font-sans">
                                  <div className="bg-slate-50 px-2 py-1 border-b border-slate-100 font-bold flex justify-between">
                                    <span>Drug Name</span>
                                    <span>Schedule</span>
                                  </div>
                                  <div className="px-2 py-1.5 border-b border-slate-100 flex justify-between">
                                    <strong>Tab. Ibuprofen 400mg</strong>
                                    <span>1-0-1 (Post Meals)</span>
                                  </div>
                                </div>
                              </div>

                              {/* Exercise Handout Attachment */}
                              <div className="bg-[#fafafc] border border-slate-200/90 rounded-lg p-2.5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                                      <rect x="3" y="3" width="18" height="18" rx="2" />
                                      <rect x="7" y="7" width="3" height="3" fill="#ffffff" />
                                      <rect x="14" y="7" width="3" height="3" fill="#ffffff" />
                                      <rect x="7" y="14" width="3" height="3" fill="#ffffff" />
                                    </svg>
                                  </div>
                                  <div className="flex flex-col text-left">
                                    <span className="text-[9.5px] font-bold text-slate-900">Rehabilitation Routine</span>
                                    <span className="text-[8px] text-slate-400">Short Arc Quads & Straight Leg Raises</span>
                                  </div>
                                </div>
                                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Shared via WhatsApp</span>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Horizontal Tab Indicators */}
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 flex justify-between items-center z-20">
          <div className="flex items-center gap-2 sm:gap-3">
            {slides.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-[#22252a] text-white border-[#22252a] shadow-md'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {tab.num} {tab.giantText}
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
