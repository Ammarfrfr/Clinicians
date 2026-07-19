import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Stethoscope,
  Printer,
  Pill,
  MessageSquare,
  Camera,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  Volume2,
  FileText,
  ShieldAlert,
  Smartphone,
  Check,
  RefreshCw,
  Heart
} from 'lucide-react';

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

export function LandingPage({ onNavigate }) {
  const [activeOrbitAgent, setActiveOrbitAgent] = useState('receptionist');
  const [activeAgent, setActiveAgent] = useState('scribe');
  const [activeStep, setActiveStep] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0.2);
  const [showcaseProgress, setShowcaseProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [copiedText, setCopiedText] = useState(false);
  const transcriptRef = useRef(null);
  const [scrollRotation, setScrollRotation] = useState(0);
  const [clocks, setClocks] = useState({
    zurich: '00:00:00',
    newYork: '00:00:00',
    tokyo: '00:00:00',
    sydney: '00:00:00'
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const rotation = window.scrollY * 0.12;
      setScrollRotation(rotation);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const formatTime = (timeZone) => {
        try {
          return new Intl.DateTimeFormat('en-US', {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).format(new Date());
        } catch (e) {
          return new Date().toLocaleTimeString();
        }
      };

      setClocks({
        zurich: formatTime('Europe/Zurich'),
        newYork: formatTime('America/New_York'),
        tokyo: formatTime('Asia/Tokyo'),
        sydney: formatTime('Australia/Sydney')
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const containerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('transcribe');

  // Update activeTab and showcaseProgress based on scroll progress of the feature showcase container
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height;
      const offsetTop = -rect.top;
      const windowHeight = window.innerHeight;
      const totalScrollable = containerHeight - windowHeight;

      if (totalScrollable <= 0) return;

      const progress = Math.max(0, Math.min(1, offsetTop / totalScrollable));
      setShowcaseProgress(progress);

      if (progress < 0.33) {
        setActiveTab('transcribe');
      } else if (progress < 0.66) {
        setActiveTab('search');
      } else {
        setActiveTab('followup');
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileTrackScroll = () => {
    // Deprecated horizontal swipe scroll tracker as we now scroll vertically on mobile
  };

  const handleTabClick = (tabId) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const containerTop = rect.top + scrollTop;
    const totalScrollable = rect.height - window.innerHeight;

    let targetScroll = containerTop;
    if (tabId === 'search') {
      targetScroll = containerTop + totalScrollable * 0.5;
    } else if (tabId === 'followup') {
      targetScroll = containerTop + totalScrollable;
    }

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };

  // Auto-simulate scroll progress on first load to show active state, then let user interact
  useEffect(() => {
    let timer = setTimeout(() => {
      if (transcriptRef.current) {
        // Pre-scroll slightly to show initial notes compiled
        transcriptRef.current.scrollTop = 40;
        setScrollProgress(0.25);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleTranscriptScroll = () => {
    if (transcriptRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = transcriptRef.current;
      const totalScrollable = scrollHeight - clientHeight;
      if (totalScrollable > 0) {
        const progress = Math.min(Math.max(scrollTop / totalScrollable, 0), 1);
        setScrollProgress(progress);
      }
    }
  };

  // Dialogue script for the scroll demo
  const dialogueLines = [
    { speaker: 'Doctor', text: 'Namaste, aaiye baithiye. Kya takleef hai aapko?', highlightAt: 0 },
    { speaker: 'Patient', text: 'Doctor sahab, right knee mein bohot dard hai 2 din se. Soojan bhi aa gayi hai.', highlightAt: 0.12 },
    { speaker: 'Doctor', text: 'Achha. Seediya chhadne mein ya chalne mein dard badhta hai?', highlightAt: 0.25 },
    { speaker: 'Patient', text: 'Haan, jab seediya utarta hoon toh chubhan hoti hai aur lagta hai knee unstable hai.', highlightAt: 0.4 },
    { speaker: 'Doctor', text: 'Theek hai, let me check. McMurray test positive hai, aur medial joint line tenderness bhi hai.', highlightAt: 0.55 },
    { speaker: 'Doctor', text: 'Meniscus tear ho sakta hai. Abhi ke liye hum weight bearing activities reduce karenge aur cold compress apply karenge.', highlightAt: 0.7 },
    { speaker: 'Doctor', text: 'Main Tab Zerodol-SP prescribe kar raha hoon, din mein do baar khana hai. Aur heel slides exercise seekh lijiye.', highlightAt: 0.85 }
  ];

  // AI Generated Note sections revealed based on scroll progress
  const noteSections = [
    {
      title: 'Chief Complaint',
      content: 'Right knee pain accompanied by mild local swelling for 2 days.',
      showAt: 0.12
    },
    {
      title: 'History of Present Illness (HPI)',
      content: 'Exacerbated during weight-bearing activities, specifically when descending stairs. Subjective joint instability reported by the patient.',
      showAt: 0.4
    },
    {
      title: 'Physical Examination',
      content: 'Medial joint line tenderness. McMurray test is positive. Mild effusion observed over patellar borders.',
      showAt: 0.55
    },
    {
      title: 'Assessment & Plan',
      content: 'Suspected Medial Meniscus Tear. Advised conservative management, Tab Zerodol-SP BID post meals for 5 days, cold compress, and heel slides rehab routine.',
      showAt: 0.82
    }
  ];

  // AI Employees profiles
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

  const pricingTiers = [
    {
      name: 'Free Trial',
      price: '₹0',
      period: 'forever',
      description: 'Ideal for testing the superhuman AI team in your clinical practice.',
      features: [
        '15 consultations / month',
        'Groq Whisper large-v3 Transcription',
        'CDSCO Drug Directory database search',
        '500 MB Encrypted vault storage',
        'Standard PDF prescription exports',
      ],
      actionLabel: 'Deploy Free Assistant',
      popular: false,
    },
    {
      name: 'Pro Scribe Co-Pilot',
      price: '₹1,499',
      period: 'month',
      description: 'Supercharge your daily workflow with full AI agent integrations.',
      features: [
        '200 consultations / month',
        'Advanced Dual-Compartment Notes',
        'Physical Letterhead Printing Mode',
        'Direct WhatsApp sharing & notifications',
        '5 GB Secure cloud vault storage',
        'Priority AI model processing queues',
      ],
      actionLabel: 'Upgrade to Pro Scribe',
      popular: true,
    },
    {
      name: 'Clinic Scale',
      price: '₹3,999',
      period: 'month',
      description: 'Uncapped access for busy multi-bed clinics and practitioners.',
      features: [
        'Unlimited consultations / month',
        'Full PDF Branding & Letterheads',
        '25 GB Secure cloud vault storage',
        'Automated WhatsApp follow-up schedules',
        'Specialty clinical templates library',
        'Priority dedicated support line',
      ],
      actionLabel: 'Deploy Clinic Scale',
      popular: false,
    },
  ];

  const activeAgentData = orbitAgentData[activeOrbitAgent] || orbitAgentData.receptionist;

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col font-sans select-none overflow-x-clip text-slate-800 antialiased">

      {/* Navigation */}
      <div className="w-full bg-[#fafafc] border-b border-slate-100 sticky top-0 z-50 backdrop-blur-md bg-[#fafafc]/95">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center w-full">
          <div className="flex items-center select-none cursor-pointer" onClick={() => onNavigate('/')}>
            <span className=" font-sans text-2xl font-black tracking-tighter text-slate-900 uppercase">Scribologist</span>
          </div>

          <div className="flex items-center gap-8 max-[768px]:hidden text-xs font-bold uppercase tracking-wider text-slate-500">
            <a href="#product" className="hover:text-slate-900 transition-colors flex items-center gap-1">Product <span className="text-[8px]">▼</span></a>
            <a href="#integrations" className="hover:text-slate-900 transition-colors">Integrations</a>
            <a href="#case-studies" className="hover:text-slate-900 transition-colors">Case Studies</a>
            <a href="#about-us" className="hover:text-slate-900 transition-colors">About Us</a>
            <a href="#labs" className="hover:text-slate-900 transition-colors">Labs</a>
            <a href="#docs" className="hover:text-slate-900 transition-colors">Docs</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              onClick={() => onNavigate('login')}
            >
              Sign In <span className="text-[10px]">✦</span>
            </button>
            <button
              className="px-5 py-2 bg-[#22252a] hover:bg-[#1a1c20] text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer border-none"
              onClick={() => onNavigate('register')}
            >
              Book a demo <span className="text-[10px] text-slate-400">✦</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Hero Screen 1: Centered Header & Button */}
      <header className="relative w-full flex flex-col items-center justify-center text-center px-6 gap-8 z-10 max-w-4xl mx-auto snap-start snap-always" style={{ height: 'calc(100vh - 76px)' }}>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif text-[#22252a] leading-[1.05] tracking-tight text-center max-w-3xl">
          Notes. History, Follow ups. Handled by AI that works like your best staff member
        </h1>

        <button
          className="px-8 py-4 bg-[#22252a] hover:bg-[#1a1c20] text-white font-semibold text-base rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer border-none"
          onClick={() => onNavigate('register')}
        >
          Book a demo <span className="text-xs text-slate-400">✦</span>
        </button>
      </header>

      {/* Hero Screen 2: Centered Orbit Graphic */}
      <section className="relative w-full flex flex-col items-center justify-center px-6 z-10 overflow-hidden bg-[#fafafc] border-b border-slate-100 snap-start snap-always" style={{ height: '100vh' }}>
        <div className="relative w-[min(480px,90vw,70vh)] h-[min(480px,90vw,70vh)] scale-100 transition-all origin-center orbit-container">

          {/* SVG Orbit Tracks (Static) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-200/40 fill-none z-0" viewBox="0 0 100 100" strokeWidth="1">
            <circle cx="50" cy="50" r="38" />
            <circle cx="50" cy="50" r="48" />
          </svg>

          {/* Inner Orbit (Revolving + Scroll Rotation with smooth transition) */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              transform: `rotate(${scrollRotation}deg)`,
              transition: 'transform 0.45s cubic-bezier(0.1, 0.7, 0.25, 1)'
            }}
          >
            <div className="absolute inset-0 w-full h-full animate-orbit-inner pointer-events-none z-30">
              {orbitNodes.filter(node => node.radius === 38).map((node) => {
                const angleRad = (node.angle * Math.PI) / 180;
                const x = 50 + node.radius * Math.cos(angleRad);
                const y = 50 - node.radius * Math.sin(angleRad);
                const isActive = activeOrbitAgent === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => setActiveOrbitAgent(node.id)}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: `translate(-50%, -50%) rotate(${-scrollRotation}deg)`,
                      transition: 'transform 0.45s cubic-bezier(0.1, 0.7, 0.25, 1)'
                    }}
                  >
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border bg-white/95 backdrop-blur-xs cursor-pointer shadow-xs hover:shadow-md hover:scale-105 transition-all duration-300 select-none animate-orbit-inner-reverse ${isActive
                        ? 'border-slate-400 ring-2 ring-slate-400/10 scale-105'
                        : 'border-slate-200/60'
                        }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full shadow-inner transition-transform duration-300 animate-pulse"
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
          </div>

          {/* Outer Orbit (Revolving + Scroll Rotation with smooth transition) */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              transform: `rotate(${scrollRotation * 1.5}deg)`,
              transition: 'transform 0.45s cubic-bezier(0.1, 0.7, 0.25, 1)'
            }}
          >
            <div className="absolute inset-0 w-full h-full animate-orbit-outer pointer-events-none z-30">
              {/* SVG Connection Paths rotating in sync with outer nodes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-200/60 fill-none" viewBox="0 0 100 100" strokeWidth="1">
                {/* To AI Scribe (x: 22.47, y: 89.31) */}
                <path d="M 50 80 Q 35 83 22.47 89.31" className="stroke-slate-200/20" />
                {/* To AI Receptionist (x: 80.86, y: 86.78) */}
                <path d="M 50 80 Q 65 83 80.86 86.78" className="stroke-slate-200/20" />
                {/* To AI Researcher (x: 54.18, y: 97.81) */}
                <path d="M 50 80 Q 51 90 54.18 97.81" className="stroke-slate-200/20" />
                {/* To AI Interpreter (x: 37.58, y: 3.64) */}
                <path d="M 50 20 Q 44 12 37.58 3.64" className="stroke-slate-200/20" />
                {/* To AI Triage Nurse (x: 74.00, y: 8.44) */}
                <path d="M 50 20 Q 62 14 74.00 8.44" className="stroke-slate-200/20" />
              </svg>

              {orbitNodes.filter(node => node.radius === 48).map((node) => {
                const angleRad = (node.angle * Math.PI) / 180;
                const x = 50 + node.radius * Math.cos(angleRad);
                const y = 50 - node.radius * Math.sin(angleRad);
                const isActive = activeOrbitAgent === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => setActiveOrbitAgent(node.id)}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: `translate(-50%, -50%) rotate(${-scrollRotation * 1.5}deg)`,
                      transition: 'transform 0.45s cubic-bezier(0.1, 0.7, 0.25, 1)'
                    }}
                  >
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border bg-white/95 backdrop-blur-xs cursor-pointer shadow-xs hover:shadow-md hover:scale-105 transition-all duration-300 select-none animate-orbit-outer-reverse ${isActive
                        ? 'border-slate-400 ring-2 ring-slate-400/10 scale-105'
                        : 'border-slate-200/60'
                        }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full shadow-inner transition-transform duration-300 animate-pulse"
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
          </div>

          {/* Central Dashboard Card */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] md:w-[245px] bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-5 flex flex-col gap-4 text-left select-none transition-all duration-300">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full shadow-inner transition-all duration-500"
                style={{ background: sphereGradients[activeAgentData.color] }}
              />
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-tight">
                  {activeAgentData.name}
                </h3>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {activeAgentData.role}
                </span>
              </div>
            </div>

            {/* Checklist */}
            <div className="flex flex-col gap-2.5 my-1">
              {activeAgentData.tasks.map((task, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[11px] text-slate-600 leading-normal">
                  <div className="w-3.5 h-3.5 rounded-xs border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-800 text-[9px] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span>{task}</span>
                </div>
              ))}
            </div>

            {/* Collaborates With */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                Collaborates with
              </span>
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

            {/* CTA Button */}
            <button
              className="w-full py-2 bg-[#22252a] hover:bg-[#1a1c20] text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm mt-1 border-none cursor-pointer"
              onClick={() => onNavigate('register')}
            >
              {activeAgentData.exploreLabel}
            </button>
          </div>

        </div>
      </section>


      {/* Real-time Interactive Product Preview Showcase (Ammar Portfolio Style) */}
      <section ref={containerRef} className="relative w-full h-[250vh] z-10 bg-[#fafafc]">
        <div className="sticky top-[76px] h-[calc(100vh-76px)] flex flex-col justify-between py-6 lg:py-10 w-full overflow-hidden">

          {/* Top persistent info bar */}
          <div className="max-w-6xl mx-auto w-full px-6 flex justify-between items-center z-20">
            <span className="font-mono text-xs uppercase tracking-widest text-slate-400 font-bold select-none">
              // Selected Work Projects
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-slate-400 font-bold select-none">
              {activeTab === 'transcribe' ? '01' : activeTab === 'search' ? '02' : '03'} / 03 AGENTS
            </span>
          </div>

          {/* Screenshot Title Heading */}
          <div className="max-w-6xl mx-auto w-full px-6 text-left mt-2 lg:mt-3 z-20">
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-serif text-[#22252a] leading-[1.1] tracking-tight">
              Powering 100,000<br />clinicians using Tebra
            </h2>
          </div>

          {/* Horizontal Slide Track for both Desktop and Mobile */}
          <div
            id="horizontal-slide-track"
            className="flex flex-row w-[300vw] h-[58vh] items-center transition-transform duration-100 ease-out z-10 my-auto overflow-hidden scrollbar-none gap-0 px-0"
            style={{ transform: `translate3d(-${showcaseProgress * 200}vw, 0, 0)` }}
          >
            {[
              {
                id: 'transcribe',
                num: '01',
                title: 'AI Note Assist',
                desc: 'AI Note Assist turns real-time patient conversations into structured, HIPAA-compliant notes, helping clinicians finish SOAP and behavioral health documentation faster.',
                desc2: 'Fully integrated with Tebra\'s EHR, it eliminates after-hours charting and workflow switching.',
                giantText: 'AI SCRIBE',
                imagePath: '/images/transcribe-preview.png',
                borderColor: 'group-hover:border-rose-400/80',
                shadowColor: 'group-hover:shadow-rose-100/50'
              },
              {
                id: 'search',
                num: '02',
                title: 'Drug Fuzzy Search',
                desc: 'Drug Fuzzy Search matches and corrects typing errors against national CDSCO drug directories in seconds.',
                desc2: 'Fully integrated with EHR workflows, it saves time, checks drug interactions, and ensures clinicians select correct medications instantly.',
                giantText: 'AI RECEPTIONIST',
                imagePath: '/images/search-preview.png',
                borderColor: 'group-hover:border-sky-400/80',
                shadowColor: 'group-hover:shadow-sky-100/50'
              },
              {
                id: 'followup',
                num: '03',
                title: 'Patient Follow Ups',
                desc: 'Patient Follow Ups highlights care coordination tasks and schedules automated follow-up messages.',
                desc2: 'Fully integrated with EHR workflows, it increases treatment compliance and outpatient satisfaction by sending automated WhatsApp reminders.',
                giantText: 'AI NURSE',
                imagePath: '/images/followup-preview.png',
                borderColor: 'group-hover:border-amber-400/80',
                shadowColor: 'group-hover:shadow-amber-100/50'
              }
            ].map((tab) => {
              // Lazy-load images in different batches based on the active tab/progress
              const isImageNeeded = activeTab === tab.id ||
                (tab.id === 'transcribe') ||
                (tab.id === 'search' && showcaseProgress > 0.15) ||
                (tab.id === 'followup' && showcaseProgress > 0.5);

              return (
                <div
                  id={`slide-${tab.id}`}
                  key={tab.id}
                  className="w-screen shrink-0 h-full flex items-center justify-center relative px-6 md:px-12 lg:px-0"
                >
                  {/* Outlined Backdrop Text */}
                  <span
                    className="font-sans font-black text-[12vw] tracking-widest text-transparent uppercase select-none pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] z-0 transition-all duration-500 lg:inline-block hidden"
                    style={{ WebkitTextStroke: '2px #0f172a' }}
                  >
                    {tab.giantText}
                  </span>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-center w-full max-w-6xl z-10 relative">

                    {/* Left Column: Details */}
                    <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-5 text-left relative z-10 w-full px-4 lg:px-0 order-2 lg:order-1">
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-lg lg:text-xl font-medium text-slate-400">
                          {tab.num}
                        </span>
                        <h3 className="text-xl md:text-2xl lg:text-[28px] font-sans font-bold tracking-tight text-slate-900">
                          {tab.title}
                        </h3>
                      </div>

                      <div className="flex flex-col gap-3 lg:gap-4">
                        <p className="text-xs lg:text-[13.5px] text-slate-500 leading-relaxed font-sans font-medium">
                          {tab.desc}
                        </p>
                        <p className="text-xs lg:text-[13.5px] text-slate-500 leading-relaxed font-sans font-medium hidden sm:block">
                          {tab.desc2}
                        </p>
                      </div>

                      {/* Sully agent in action badge from screenshot */}
                      <div className="flex flex-col gap-2 mt-2">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold select-none">
                          SULLY AGENT IN ACTION
                        </span>
                        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.06)] self-start border border-slate-100/50">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-rose-400 via-pink-400 to-orange-300 animate-pulse shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">
                            {tab.id === 'transcribe' ? 'AI Scribe' : tab.id === 'search' ? 'AI Receptionist' : 'AI Nurse'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Mockup Card */}
                    <div className="lg:col-span-7 flex justify-center w-full order-1 lg:order-2">
                      <div className={`relative w-full aspect-[4/3] max-w-[320px] sm:max-w-[480px] lg:max-w-[640px] bg-slate-50 border border-slate-200/50 rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group ${tab.borderColor} ${tab.shadowColor}`}>

                        {/* Fallback frame */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/50 p-6 text-center select-none z-0">
                          <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-semibold text-slate-500">Feature Screen Preview</span>
                          <span className="text-[10px] font-mono text-slate-400 mt-1.5 bg-white px-2.5 py-1 rounded border border-slate-200">
                            IMAGE SIZE: 800 × 600 pixels (4:3)
                          </span>
                        </div>

                        {/* Main screenshot */}
                        {isImageNeeded && (
                          <img
                            src={tab.imagePath}
                            alt={`${tab.title} preview`}
                            width="800"
                            height="600"
                            className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300 opacity-0"
                            onLoad={(e) => e.target.classList.remove('opacity-0')}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}

                        {/* Hover Overlay Button */}
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                          <span className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                            Launch Agent Action ↗
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-4 z-20 mt-6 lg:mt-0">
            {['transcribe', 'search', 'followup'].map((tabId, idx) => (
              <button
                key={tabId}
                onClick={() => handleTabClick(tabId)}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeTab === tabId ? 'w-8 bg-slate-800' : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* AI Employees Bento Grid Directory */}
      <section id="agents" className="py-20 px-6 max-w-6xl mx-auto flex flex-col gap-12 border-t border-slate-100 w-full z-10">
        <div className="text-center flex flex-col gap-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-600">The Department Showcase</span>
          <h2 className="text-2xl md:text-3xl font-serif text-slate-900 font-bold">Meet Your Superhuman Team</h2>
          <p className="text-sm text-slate-500 leading-relaxed">Specialized AI agents working collaboratively to coordinate and streamline your outpatient clinic operations.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Employee Directory Panel */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {Object.entries(agents).map(([key, agent]) => (
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
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-900">{agent.name}</h4>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider">{key}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono font-semibold">{agent.role}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Active Employee Mock Monitor Screen */}
          <div className="lg:col-span-7 bg-white border border-slate-200/40 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xs">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-slate-100 rounded text-slate-500 uppercase tracking-wider">
                  {agents[activeAgent].department}
                </span>
                <span className="text-[9.5px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {agents[activeAgent].metric}
                </span>
              </div>

              <h3 className="text-2xl font-serif font-bold text-slate-900">
                Hi, I'm {agents[activeAgent].name} — {agents[activeAgent].role}
              </h3>

              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                {agents[activeAgent].desc}
              </p>

              {/* Dynamic Employee Output Preview */}
              <div className="mt-4 bg-slate-950 rounded-xl p-4 text-left font-mono text-[11px] leading-relaxed text-emerald-400 border border-slate-900 relative">
                <div className="absolute top-3.5 right-4 flex items-center gap-1.5 text-[9px] text-emerald-500 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ONLINE MONITOR</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-slate-400 font-sans text-xs font-bold border-b border-slate-900 pb-1.5 mb-1 block">
                    {agents[activeAgent].outputs.title}
                  </span>
                  {agents[activeAgent].outputs.lines.map((line, i) => (
                    <div key={i} className="flex gap-2 items-start pl-1">
                      <span className="text-slate-700">&gt;</span>
                      <p className="text-slate-200 font-sans text-xs">{line}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => onNavigate('register')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 group cursor-pointer"
              >
                <span>Deploy {agents[activeAgent].name} to clinic</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Journey Flow Timeline */}
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
      </section>

      {/* Security & Compliance Banner */}
      <section className="py-12 bg-emerald-950 text-white/95 border-t border-emerald-900 relative">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="flex gap-4">
            <div className="p-3 bg-emerald-900 rounded-xl text-emerald-400 self-start">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">HIPAA Compliant Vault</h4>
              <p className="text-xs text-white/60 leading-relaxed">End-to-end clinical audit logging, automatic session timeouts, and AES-256 cloud encryption.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-3 bg-emerald-900 rounded-xl text-emerald-400 self-start">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Zero Training Data</h4>
              <p className="text-xs text-white/60 leading-relaxed">We process consultations securely but never utilize clinical notes to train downstream models.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-3 bg-emerald-900 rounded-xl text-emerald-400 self-start">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Physician in the Loop</h4>
              <p className="text-xs text-white/60 leading-relaxed">AI acts as your draft assistant. The final clinical review and signature is always yours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section id="pricing" className="py-20 px-6 max-w-6xl mx-auto flex flex-col gap-12 border-t border-slate-100 w-full z-10">
        <div className="text-center flex flex-col gap-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-600">Pricing Plans</span>
          <h2 className="text-2xl md:text-3xl font-serif text-slate-900 font-bold">Volume Licensing For Your Clinic</h2>
          <p className="text-sm text-slate-500 leading-relaxed">Simple pricing scaled directly to your outpatient clinical volume. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, i) => (
            <div
              key={i}
              className={`relative p-8 bg-white border border-slate-200/50 rounded-3xl flex flex-col gap-5 shadow-xs hover:border-emerald-500/20 hover:shadow-sm transition-all text-left ${tier.popular ? 'border-emerald-500 ring-2 ring-emerald-500/5 shadow-md' : ''
                }`}
            >
              {tier.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-[9.5px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                  Recommended
                </span>
              )}
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl md:text-4xl font-bold text-emerald-950">{tier.price}</span>
                <span className="text-xs text-slate-400 font-medium">/{tier.period}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{tier.description}</p>

              <button
                className={`w-full mt-2 inline-flex items-center justify-center px-4 py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer border-none ${tier.popular ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50'
                  }`}
                onClick={() => onNavigate('register')}
              >
                {tier.actionLabel}
              </button>

              <ul className="flex flex-col gap-3 mt-2">
                {tier.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600 shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 md:py-20 px-6 bg-emerald-900 text-white text-center flex flex-col items-center gap-6 w-full relative overflow-hidden">
        <h2 className="text-2xl md:text-4xl font-serif font-bold">Deploy Your AI Clinical Department Today</h2>
        <p className="text-sm text-white/70 max-w-lg leading-relaxed">Save up to 2.8 hours per day of charting. Sign up now and claim 15 free consultations.</p>
        <button className="inline-flex items-center justify-center px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer border-none shadow-md hover:shadow-lg" onClick={() => onNavigate('register')}>
          Start Practice Pilot
        </button>
      </section>

      <footer className="bg-[#fafafc] border-t border-blue-900/10 pt-16 pb-0 flex flex-col gap-8 w-full text-slate-800 relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between items-start gap-8 md:gap-4 px-6 mb-4">

          {/* Left brand tagline */}
          <div className="text-left md:max-w-xs">
            <h3 className="text-2xl md:text-[28px] font-sans font-bold tracking-tight text-[#22252a] leading-tight">
              Experience Elevation
            </h3>
          </div>

          {/* Right link columns */}
          <div className="flex gap-16 md:gap-24 text-left">
            <div className="flex flex-col gap-3">
              <a href="#download" className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Download</a>
              <a href="#product" className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Product</a>
              <a href="#docs" className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Docs</a>
              <a href="#changelog" className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Changelog</a>
              <a href="#press" className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Press</a>
              <a href="#releases" className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Releases</a>
            </div>

            <div className="flex flex-col gap-3">
              <a href="#blog" className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Blog</a>
              <a href="#pricing" className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Pricing</a>
              <a href="#usecases" className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Use Cases</a>
            </div>
          </div>
        </div>

        {/* Giant footer brand text matching the screenshot */}
        <div className="w-full text-center relative select-none pointer-events-none mt-auto z-10">
          <h1 className="text-[12vw] font-sans font-black tracking-tighter text-[#1f2229] leading-none select-none">
            Scribologist
          </h1>
        </div>

        {/* Copyright & Meta (Moved below Scribologist) */}
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center pb-6 text-center gap-3 px-6 z-20">
          <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2.5 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono select-none">
            <span>© 2026 SCRIBOLOGIST</span>
            <span className="text-slate-200">•</span>
            <a href="mailto:hello@scribologist.ai" className="hover:text-slate-900 transition-colors no-underline">HELLO@SCRIBOLOGIST.AI</a>
            <span className="text-slate-200">•</span>
            <span>BUILT IN INDIA</span>
          </div>
          <p className="text-[9.5px] text-slate-400 leading-relaxed max-w-3xl mx-auto mt-2 text-center uppercase tracking-wide">
            Disclaimer: Scribologist is an AI-assisted documentation scribe. Registered clinicians retain sole responsibility to review and approve all prescriptions, treatment plans, and diagnostic notes prior to printing or sending.
          </p>
        </div>

        {/* Halftone / Dither Mountain Landscape (Blue theme matching new design) */}
        <div className="w-full mt-4 select-none pointer-events-none text-blue-600">
          <svg className="w-full h-auto max-h-[360px]" viewBox="0 0 1600 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dot-pattern-light" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.6" fill="#2563eb" opacity="0.22" />
              </pattern>
              <pattern id="dot-pattern-medium" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.1" fill="#2563eb" opacity="0.48" />
              </pattern>
              <pattern id="dot-pattern-dark" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.6" fill="#2563eb" opacity="0.82" />
              </pattern>
            </defs>

            {/* Sky Contour Waves */}
            <path d="M -50 40 Q 400 120 800 60 T 1650 80 L 1650 240 L -50 240 Z" fill="url(#dot-pattern-light)" opacity="0.25" />
            <path d="M -50 70 Q 400 140 800 90 T 1650 110 L 1650 240 L -50 240 Z" fill="url(#dot-pattern-light)" opacity="0.4" />

            {/* Flock of Birds (20 birds flying left-to-right spread over 1600 width) */}
            {(() => {
              const birds = [
                { x: 450, y: 112, s: 0.8 }, { x: 490, y: 100, s: 0.9 }, { x: 530, y: 125, s: 0.75 },
                { x: 550, y: 115, s: 1.1 }, { x: 590, y: 108, s: 1.0 }, { x: 630, y: 122, s: 0.95 },
                { x: 670, y: 95, s: 1.2 }, { x: 710, y: 78, s: 1.3 }, { x: 750, y: 105, s: 0.85 },
                { x: 790, y: 118, s: 1.1 }, { x: 830, y: 125, s: 1.05 }, { x: 690, y: 118, s: 0.8 },
                { x: 730, y: 128, s: 0.9 }, { x: 770, y: 132, s: 0.75 }, { x: 810, y: 142, s: 0.7 },
                { x: 650, y: 70, s: 1.15 }, { x: 690, y: 85, s: 1.0 }, { x: 820, y: 68, s: 1.25 },
                { x: 920, y: 80, s: 0.9 }, { x: 960, y: 95, s: 1.1 }
              ];
              return birds.map((b, i) => {
                const pathDown = `M ${b.x} ${b.y} Q ${b.x + 6 * b.s} ${b.y - 6 * b.s} ${b.x + 12 * b.s} ${b.y} Q ${b.x + 18 * b.s} ${b.y - 6 * b.s} ${b.x + 24 * b.s} ${b.y}`;
                const pathUp = `M ${b.x} ${b.y - 4 * b.s} Q ${b.x + 6 * b.s} ${b.y - 1 * b.s} ${b.x + 12 * b.s} ${b.y} Q ${b.x + 18 * b.s} ${b.y - 1 * b.s} ${b.x + 24 * b.s} ${b.y - 4 * b.s}`;
                return (
                  <path
                    key={i}
                    d={pathDown}
                    stroke="#2563eb"
                    strokeWidth="1.2"
                    fill="none"
                    opacity="0.55"
                  >
                    <animate
                      attributeName="d"
                      dur="0.6s"
                      repeatCount="indefinite"
                      values={`${pathDown}; ${pathUp}; ${pathDown}`}
                      begin={`${i * 0.08}s`}
                    />
                  </path>
                );
              });
            })()}

            {/* Back Mountains (Light dot pattern) */}
            <path d="M -50 240 L -50 145 Q 350 115 800 165 T 1450 140 Q 1550 150 1650 160 L 1650 240 Z" fill="url(#dot-pattern-light)" />

            {/* Small trees on back mountains */}
            {Array.from({ length: 40 }).map((_, idx) => {
              const x = idx * 42 + 20;
              const y = 145 + (x < 800 ? (x - 20) * -0.04 : (x - 800) * 0.035);
              const scale = 0.35;
              return (
                <polygon
                  key={`bg-t-${idx}`}
                  points={`${x},${y} ${x - 5 * scale},${y + 12 * scale} ${x + 5 * scale},${y + 12 * scale}`}
                  fill="url(#dot-pattern-light)"
                />
              );
            })}

            {/* Middle Mountains (Medium dot pattern) */}
            <path d="M -50 240 L -50 170 Q 300 135 800 180 T 1450 165 Q 1550 145 1650 165 L 1650 240 Z" fill="url(#dot-pattern-medium)" />

            {/* Flat-topped Acacia tree on the right midground hill */}
            <g opacity="0.65">
              <path d="M 1380 154 L 1380 132" stroke="#2563eb" strokeWidth="2.5" />
              <path d="M 1380 137 Q 1372 130 1368 130 M 1380 134 Q 1388 127 1392 127" stroke="#2563eb" strokeWidth="1.5" fill="none" />
              <ellipse cx="1380" cy="122" rx="22" ry="7" fill="url(#dot-pattern-medium)" />
              <ellipse cx="1372" cy="126" rx="14" ry="5" fill="url(#dot-pattern-medium)" />
              <ellipse cx="1388" cy="124" rx="16" ry="6" fill="url(#dot-pattern-medium)" />
            </g>

            {/* Front Mountains (Dark dot pattern) */}
            <path d="M -50 240 L -50 205 Q 250 185 800 215 T 1450 200 Q 1550 205 1650 215 L 1650 240 Z" fill="url(#dot-pattern-dark)" />

            {/* Bare tree winter branches in foreground */}
            {[320, 680, 1050, 1420].map((tx, idx) => (
              <g key={`bare-t-${idx}`} opacity="0.8">
                <path d={`M ${tx} 212 L ${tx} 175`} stroke="#2563eb" strokeWidth="2" />
                <path d={`M ${tx} 195 Q ${tx - 10} 185 ${tx - 16} 182`} stroke="#2563eb" strokeWidth="1.5" fill="none" />
                <path d={`M ${tx} 190 Q ${tx + 10} 180 ${tx + 18} 178`} stroke="#2563eb" strokeWidth="1.5" fill="none" />
                <path d={`M ${tx} 182 Q ${tx - 5} 170 ${tx - 8} 165`} stroke="#2563eb" strokeWidth="1" fill="none" />
                <path d={`M ${tx} 180 Q ${tx + 6} 172 ${tx + 8} 168`} stroke="#2563eb" strokeWidth="1" fill="none" />
              </g>
            ))}

            {/* Forest Foreground Pine Trees (using dark pattern) */}
            {Array.from({ length: 60 }).map((_, idx) => {
              const x = idx * 28 - 20;
              const scale = 0.72 + (Math.sin(idx) * 0.25);
              const y = 205 + (Math.cos(idx * 2) * 8);
              return (
                <polygon
                  key={`pine-t-${idx}`}
                  points={`${x},${y} ${x - 8 * scale},${y + 12 * scale} ${x - 4 * scale},${y + 12 * scale} ${x - 11 * scale},${y + 24 * scale} ${x - 6 * scale},${y + 24 * scale} ${x - 14 * scale},${y + 36 * scale} ${x + 14 * scale},${y + 36 * scale} ${x + 6 * scale},${y + 24 * scale} ${x + 11 * scale},${y + 24 * scale} ${x + 4 * scale},${y + 12 * scale} ${x + 8 * scale},${y + 12 * scale}`}
                  fill="url(#dot-pattern-dark)"
                />
              );
            })}
          </svg>
        </div>
      </footer>
    </div>
  );
}
