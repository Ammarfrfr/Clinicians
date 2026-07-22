import React from 'react';

const agents = {
  scribe: {
    name: 'Ammar',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    role: 'Lead Scribe Agent',
    department: 'Documentation Department',
    metric: '98.8% transcription accuracy',
    status: 'Active',
    desc: 'Listens to ambient clinical conversations in Hinglish/English. Instantly translates and structures notes into SOAP/specialist categories.',
    outputs: {
      title: 'Drafted Clinical Note',
      lines: [
        'Subjective: Medial knee pain for 2 days, worse on stairs.',
        'Objective: Positive McMurray, medial joint tenderness.',
        'Assessment: Medial meniscus tear suspected.',
        'Plan: Tab Zerodol-SP BID x 5 days, cold compress, slide rehab.'
      ]
    }
  },
  nurse: {
    name: 'Sarah',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80',
    role: 'Triage Specialist',
    department: 'Intake Operations',
    metric: '4.2 min saved per patient intake',
    status: 'Online',
    desc: 'Collects pre-visit patient history, screens chief complaints, and updates patient vitals alerts prior to consultation.',
    outputs: {
      title: 'Intake Report',
      lines: [
        'Vitals: BP 128/84, HR 72 bpm, Temp 98.6°F',
        'Chief Complaint: Acute knee swelling post-exercise',
        'Allergy Check: NKDA (No Known Drug Allergies)',
        'Pre-visit summary linked to electronic file.'
      ]
    }
  },
  coder: {
    name: 'Rohan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    role: 'Compliance Officer',
    department: 'Safety & Directories',
    metric: 'Zero-mistake safety guarantee',
    status: 'Active',
    desc: 'Scans prescriptions against the CDSCO approved drug directory. Auto-detects dosage formats and flags potential patient allergies.',
    outputs: {
      title: 'Compliance Log',
      lines: [
        'CDSCO Check: Zerodol-SP (Aceclofenac/Paracetamol/Serratiopeptidase) - Approved.',
        'Dosage Check: BID (Twice daily) - Normal limits.',
        'Allergy Scan: Aceclofenac cross-checked with patient history - Cleared.'
      ]
    }
  },
  manager: {
    name: 'Priya',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80',
    role: 'Patient Care Manager',
    department: 'Dispatch & Follow-ups',
    metric: '40% reduction in clinic no-shows',
    status: 'Online',
    desc: 'Formats and prints notes directly onto physical doctor letterheads with pre-calculated margins. Instantly shares summaries via WhatsApp.',
    outputs: {
      title: 'Operations Report',
      lines: [
        'Letterhead Print: Prescribed handout formatted.',
        'WhatsApp: Dispatch queued to +91 98765 43210.',
        'Follow-up: Knee slides routine visual links added.',
        'Daily reminder scheduled for 9:00 AM.'
      ]
    }
  }
};

export function AgentDetails({ activeAgent, setActiveAgent, onNavigate }) {
  return (
    <section id="product" className="py-20 px-6 max-w-6xl mx-auto flex flex-col gap-12 border-t border-slate-100 w-full z-10">
      <div className="text-center flex flex-col gap-2 max-w-xl mx-auto">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-600">Superhuman Team members</span>
        <h2 className="text-2xl md:text-3xl font-serif text-[#22252a] font-bold">Your AI Clinical Department</h2>
        <p className="text-sm text-slate-500 leading-relaxed">Meet the specialized assistants cooperating in real time to run your clinic administrative tasks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full">
        {/* Left Side: Selectors */}
        <div className="lg:col-span-5 flex flex-col gap-4 w-full">
          {Object.keys(agents).map((key) => {
            const agent = agents[key];
            return (
              <button
                key={key}
                onClick={() => setActiveAgent(key)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${activeAgent === key
                  ? 'bg-white border-emerald-500/80 shadow-xs ring-1 ring-emerald-500/10'
                  : 'bg-transparent border-slate-200/50 hover:bg-slate-50 hover:border-slate-300/80'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 tracking-tight leading-tight">{agent.name}</span>
                    <span className="text-[9px] font-semibold text-slate-400 mt-0.5">{agent.role}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Showcase Display */}
        <div className="lg:col-span-7 w-full">
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 md:p-8 shadow-xs text-left flex flex-col gap-6 w-full">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <img src={agents[activeAgent].avatar} alt={agents[activeAgent].name} className="w-12 h-12 rounded-full object-cover border border-slate-100" />
                <div className="flex flex-col">
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-tight">
                    {agents[activeAgent].name}
                  </h4>
                  <span className="text-[9.5px] font-semibold text-slate-400 mt-0.5">
                    {agents[activeAgent].department}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {agents[activeAgent].status}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {agents[activeAgent].metric}
                </span>
              </div>
            </div>

            <h3 className="text-2xl font-serif font-bold text-slate-900">
              Hi, I'm {agents[activeAgent].name} — {agents[activeAgent].role}
            </h3>

            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              {agents[activeAgent].desc}
            </p>

            {/* Generated Output Preview Section */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 md:p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  {agents[activeAgent].outputs.title}
                </span>
                <span className="text-[9px] text-slate-300 font-mono font-bold">100% SECURE</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {agents[activeAgent].outputs.lines.map((line, idx) => (
                  <div key={idx} className="text-xs text-slate-600 font-mono flex items-start gap-2">
                    <span className="text-slate-300 select-none">{idx + 1}.</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => onNavigate('register')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 group cursor-pointer border-none bg-transparent"
              >
                Hire this Agent in your practice
                <span className="group-hover:translate-x-1 transition-transform">➔</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
