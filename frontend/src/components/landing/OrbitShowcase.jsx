import React from 'react';

const sphereGradients = {
  blue: 'radial-gradient(circle at 35% 35%, #e0f2fe, #3b82f6 50%, #1d4ed8 85%, #1e3a8a)',
  orange: 'radial-gradient(circle at 35% 35%, #ffedd5, #f97316 50%, #c2410c 85%, #7c2d12)',
  green: 'radial-gradient(circle at 35% 35%, #dcfce7, #22c55e 50%, #15803d 85%, #14532d)',
  purple: 'radial-gradient(circle at 35% 35%, #f3e8ff, #a855f7 50%, #7e22ce 85%, #581c87)',
  magenta: 'radial-gradient(circle at 35% 35%, #fce7f3, #ec4899 50%, #be185d 85%, #701a75)',
  pink: 'radial-gradient(circle at 35% 35%, #ffe4e6, #f43f5e 50%, #be123c 85%, #4c0519)',
  bronze: 'radial-gradient(circle at 35% 35%, #fef3c7, #d97706 50%, #b45309 85%, #78350f)',
  indigo: 'radial-gradient(circle at 35% 35%, #e0e7ff, #6366f1 50%, #4338ca 85%, #312e81)',
  emerald: 'radial-gradient(circle at 35% 35%, #ecfdf5, #10b981 50%, #047857 85%, #064e3b)'
};

const orbitNodes = [
  { id: 'interpreter', name: 'AI Interpreter', color: 'orange', angle: 105, radius: 48 },
  { id: 'triage', name: 'AI Triage Nurse', color: 'green', angle: 60, radius: 48 },
  { id: 'coder', name: 'AI Medical Coder', color: 'purple', angle: 15, radius: 38 },
  { id: 'pharmacist', name: 'AI Pharmacist', color: 'emerald', angle: -20, radius: 38 },
  { id: 'receptionist', name: 'AI Receptionist', color: 'blue', angle: -50, radius: 48 },
  { id: 'researcher', name: 'AI Researcher', color: 'magenta', angle: -85, radius: 48 },
  { id: 'scribe', name: 'AI Scribe', color: 'pink', angle: -125, radius: 48 },
  { id: 'nurse', name: 'AI Nurse', color: 'bronze', angle: -160, radius: 38 },
  { id: 'consultant', name: 'AI Consultant', color: 'indigo', angle: 160, radius: 38 },
];

const orbitAgentData = {
  receptionist: {
    name: 'AI Receptionist',
    color: 'blue',
    role: 'FRONT DESK & SCHEDULING',
    tasks: ['Appointment scheduling', 'Patient check-in', 'Front desk support'],
    collaborates: ['AI Triage Nurse', 'AI Interpreter'],
    exploreLabel: 'Explore AI Receptionist ✦',
  },
  interpreter: {
    name: 'AI Interpreter',
    color: 'orange',
    role: 'CLINICAL TRANSLATION',
    tasks: ['Real-time language translation', 'Multilingual transcription', 'Cultural context adaptation'],
    collaborates: ['AI Scribe', 'AI Receptionist'],
    exploreLabel: 'Explore AI Interpreter ✦',
  },
  triage: {
    name: 'AI Triage Nurse',
    color: 'green',
    role: 'PATIENT INTAKE & TRIAGE',
    tasks: ['Symptom assessment', 'Urgency prioritization', 'Vitals registration assistance'],
    collaborates: ['AI Receptionist', 'AI Nurse'],
    exploreLabel: 'Explore AI Triage Nurse ✦',
  },
  consultant: {
    name: 'AI Consultant',
    color: 'indigo',
    role: 'CLINICAL DECISION SUPPORT',
    tasks: ['Differential diagnosis support', 'Treatment guideline matching', 'Medical literature search'],
    collaborates: ['AI Scribe', 'AI Researcher'],
    exploreLabel: 'Explore AI Consultant ✦',
  },
  coder: {
    name: 'AI Medical Coder',
    color: 'purple',
    role: 'BILLING & COMPLIANCE',
    tasks: ['ICD-10 & CPT code extraction', 'Insurance pre-authorization prep', 'Chart audit check'],
    collaborates: ['AI Scribe', 'AI Pharmacist'],
    exploreLabel: 'Explore AI Coder ✦',
  },
  pharmacist: {
    name: 'AI Pharmacist',
    color: 'emerald',
    role: 'MEDICATION SAFETY',
    tasks: ['Drug-drug interaction check', 'Prescription accuracy audit', 'CDSCO drug index verification'],
    collaborates: ['AI Medical Coder', 'AI Nurse'],
    exploreLabel: 'Explore AI Pharmacist ✦',
  },
  nurse: {
    name: 'AI Nurse',
    color: 'bronze',
    role: 'CARE COORDINATION',
    tasks: ['Patient instructions briefing', 'Vitals tracking reminders', 'Post-op care follow-up'],
    collaborates: ['AI Triage Nurse', 'AI Scribe'],
    exploreLabel: 'Explore AI Nurse ✦',
  },
  researcher: {
    name: 'AI Researcher',
    color: 'magenta',
    role: 'RESEARCH & CLINICAL TRIALS',
    tasks: ['Clinical trial screening', 'Medical paper synthesis', 'Outcome analytics'],
    collaborates: ['AI Consultant', 'AI Nurse'],
    exploreLabel: 'Explore AI Researcher ✦',
  },
  scribe: {
    name: 'AI Scribe',
    color: 'pink',
    role: 'AMBIENT DOCUMENTATION',
    tasks: ['Conversational charting', 'SOAP note formatting', 'EHR data entry drafting'],
    collaborates: ['AI Consultant', 'AI Medical Coder'],
    exploreLabel: 'Explore AI Scribe ✦',
  },
};

export function OrbitShowcase({
  scrollRotation,
  activeOrbitAgent,
  setActiveOrbitAgent,
  onNavigate
}) {
  const activeAgentData = orbitAgentData[activeOrbitAgent] || orbitAgentData.receptionist;
  const [autoRotation, setAutoRotation] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    let animationId;
    const animate = () => {
      if (!isHovered) {
        setAutoRotation((prev) => (prev + 0.15) % 360);
      }
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isHovered]);

  return (
    <section className="relative w-full flex flex-col items-center justify-center px-6 z-10 overflow-hidden bg-[#fafafc] border-b border-slate-100 snap-start snap-always" style={{ height: '100vh' }}>
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-[min(480px,90vw,70vh)] h-[min(480px,90vw,70vh)] scale-100 transition-all origin-center orbit-container"
      >

        {/* SVG Orbit Tracks (Static) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-200/40 fill-none z-0" viewBox="0 0 100 100" strokeWidth="1">
          <circle cx="50" cy="50" r="38" />
          <circle cx="50" cy="50" r="48" />
        </svg>

        {/* Orbiting Nodes (Position calculated directly along circular path, keeping text pill 100% upright) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-30">
          {orbitNodes.map((node) => {
            // Calculate orbital position based on node radius, scroll rotation, and auto-rotation
            const speedMultiplier = node.radius === 48 ? 1.4 : 1.0;
            const currentAngle = node.angle + (scrollRotation + autoRotation) * speedMultiplier;
            const angleRad = (currentAngle * Math.PI) / 180;

            const x = 50 + node.radius * Math.cos(angleRad);
            const y = 50 - node.radius * Math.sin(angleRad);
            const isActive = activeOrbitAgent === node.id;

            return (
              <div
                key={node.id}
                onClick={() => setActiveOrbitAgent(node.id)}
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Node Pill stays 100% horizontal & upright at all times */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border bg-white/95 backdrop-blur-xs cursor-pointer shadow-xs hover:shadow-md hover:scale-105 transition-all duration-200 select-none ${isActive
                      ? 'border-slate-400 ring-2 ring-slate-400/10 scale-105'
                      : 'border-slate-200/60'
                    }`}
                >
                  <div
                    className="w-4 h-4 rounded-full shadow-inner transition-transform duration-300 animate-pulse shrink-0"
                    style={{ background: sphereGradients[node.color] }}
                  />
                  <span className="text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                    {node.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Central Agent Controller Information Card */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] md:w-[245px] bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-5 flex flex-col gap-4 text-left select-none transition-all duration-300">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full shadow-inner transition-all duration-500"
              style={{ background: sphereGradients[activeAgentData.color] }}
            />
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-tight">
                {activeAgentData.name}
              </h3>
              <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                {activeAgentData.role}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Duties</span>
            <ul className="flex flex-col gap-1 pl-0 list-none m-0">
              {activeAgentData.tasks.map((task, i) => (
                <li key={i} className="text-[10px] text-slate-500 flex items-start gap-1">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Collaborators</span>
            <div className="flex flex-wrap gap-1.5">
              {activeAgentData.collaborates.map((collab, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-semibold text-slate-600 border border-slate-200/30"
                >
                  {collab}
                </span>
              ))}
            </div>
          </div>

          <button
            className="w-full py-2 bg-[#22252a] hover:bg-[#1a1c20] text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm mt-1 border-none cursor-pointer"
            onClick={() => onNavigate('register')}
          >
            {activeAgentData.exploreLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
