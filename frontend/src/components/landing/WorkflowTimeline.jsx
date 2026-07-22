import React from 'react';

const workflowSteps = [
  {
    title: 'AI Intake Screening',
    time: '01',
    details: 'Patient completes digital check-in. The AI Triage Nurse extracts demographics, updates baseline vitals, and flags drug allergies.',
    tag: 'Pre-Visit Intake'
  },
  {
    title: 'Ambient Voice Scribing',
    time: '02',
    details: 'Speak freely with your patient in Hinglish/English. The AI Scribe translates, transcribes speaker turns, and constructs drafts.',
    tag: 'Real-time Documentation'
  },
  {
    title: 'Compliance Verification',
    time: '03',
    details: 'The AI Coder scans notes, links ICD codes, and double-checks prescription matches against the CDSCO directory database.',
    tag: 'Safety Guardrails'
  },
  {
    title: 'One-Tap Patient Dispatch',
    time: '04',
    details: 'Print on physical letterhead (hiding diagnostics) and send treatment plans and looping exercise animations directly via WhatsApp.',
    tag: 'Post-Visit Care'
  }
];

export function WorkflowTimeline({ activeStep, setActiveStep }) {
  return (
    <section id="workflow" className="py-20 px-6 max-w-6xl mx-auto flex flex-col gap-12 border-t border-slate-100 w-full z-10">
      <div className="text-center flex flex-col gap-2 max-w-2xl mx-auto">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-600">The Operations Timeline</span>
        <h2 className="text-2xl md:text-3xl font-serif text-slate-900 font-bold">Consultation Journey Integration</h2>
        <p className="text-sm text-slate-500 leading-relaxed">Observe how Scribologist delegates administrative tasks across each step of the patient visit.</p>
      </div>

      {/* Responsive Steps Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {workflowSteps.map((step, i) => (
          <div
            key={i}
            onClick={() => setActiveStep(i)}
            className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${activeStep === i
              ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/10'
              : 'bg-transparent border-slate-200/50 hover:bg-slate-50'
              }`}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-bold font-serif text-emerald-600/30">{step.time}</span>
              <span className={`px-2 py-0.5 text-[9px] font-mono rounded ${activeStep === i ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>{step.tag}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">{step.title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{step.details}</p>
          </div>
        ))}
      </div>

      {/* Selected Step Deep Dive Panel */}
      <div className="w-full bg-slate-50/50 border border-slate-150 rounded-3xl p-6 md:p-8 text-left flex flex-col md:flex-row items-center gap-8 shadow-xs">
        <div className="flex-1 flex flex-col gap-4">
          <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100/50 self-start">
            Step Details — {workflowSteps[activeStep].tag}
          </span>
          <h3 className="text-2xl font-serif font-bold text-slate-900">
            {workflowSteps[activeStep].title}
          </h3>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-xl">
            {workflowSteps[activeStep].details}
          </p>
        </div>

        <div className="w-full md:w-auto shrink-0 flex items-center justify-center p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs relative overflow-hidden min-w-[200px]">
          <span className="text-8xl font-serif font-black text-slate-100 select-none">
            {workflowSteps[activeStep].time}
          </span>
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
