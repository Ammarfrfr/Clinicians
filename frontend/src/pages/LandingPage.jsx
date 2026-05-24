import React from 'react';
import { Mic, Stethoscope, Printer, Pill, MessageSquare, Camera } from 'lucide-react';

export function LandingPage({ onNavigate }) {
  const features = [
    {
      icon: Mic,
      title: 'AI Medical Scribe',
      description: 'Record consultations in Hinglish/English. Whisper large-v3 translates and transcribe speaker turns automatically.',
    },
    {
      icon: Stethoscope,
      title: 'Dual-Compartment Notes',
      description: 'Separate Clinical Assessment (internal diagnostic details) from Patient Handout (prescription, advice) instantly.',
    },
    {
      icon: Printer,
      title: 'Letterhead Print Mode',
      description: 'Print prescriptions directly on physical doctor letterheads with pre-calculated margins. Hides internal diagnostics.',
    },
    {
      icon: Pill,
      title: 'CDSCO Drug Directory',
      description: 'Search thousands of approved medicines in India with auto-completions as you type prescriptions.',
    },
    {
      icon: MessageSquare,
      title: 'Zero-Config WhatsApp',
      description: 'Send treatment plans and follow-up reminders to patients instantly via your own WhatsApp with one tap.',
    },
    {
      icon: Camera,
      title: 'Cloudinary File Vault',
      description: 'Capture and link patient photos, MRI scans, X-rays, or surgery pictures directly to their clinical record.',
    },
  ];

  const pricingTiers = [
    {
      name: 'Free Starter',
      price: '₹0',
      period: 'forever',
      description: 'Ideal for testing and small clinical practices.',
      features: [
        '15 consultations / month',
        'Groq Whisper large-v3 Transcription',
        'CDSCO Drug Directory search',
        '500 MB Cloud File Storage',
        'Basic PDF prescription exports',
      ],
      actionLabel: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro Scribe',
      price: '₹1,499',
      period: 'month',
      description: 'Perfect for individual doctors and busy clinics.',
      features: [
        '200 consultations / month',
        'Advanced Dual-Compartment Notes',
        'Physical Letterhead Printing',
        'Direct WhatsApp sharing',
        '5 GB Premium Cloud Storage',
        'Priority AI Processing',
      ],
      actionLabel: 'Upgrade to Pro',
      popular: true,
    },
    {
      name: 'Clinic Scale',
      price: '₹3,999',
      period: 'month',
      description: 'Uncapped access for full-time practitioners.',
      features: [
        'Unlimited consultations / month',
        'Full PDF Customization & Branding',
        '25 GB Cloud File Storage',
        'Automated Patient Reminders',
        'Specialist AI templates',
        'Dedicated WhatsApp templates',
      ],
      actionLabel: 'Go Unlimited',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-warm-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 bg-warm-white/80 backdrop-blur-md z-50 border-b border-gray-200/40 px-6 py-4 flex justify-between items-center w-full">
        <div className="font-serif text-[26px] text-navy tracking-[0.5px] font-bold">
          Qa<span className="text-teal">lam</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-xs font-semibold text-gray-500 hover:text-navy transition-colors max-[600px]:hidden">Features</a>
          <a href="#pricing" className="text-xs font-semibold text-gray-500 hover:text-navy transition-colors max-[600px]:hidden">Pricing</a>
          <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-xs rounded-xl transition-all cursor-pointer bg-white" onClick={() => onNavigate('login')}>
            Sign In
          </button>
          <button className="inline-flex items-center justify-center px-4 py-2 bg-teal hover:bg-teal-dark text-navy font-semibold text-xs rounded-xl transition-all cursor-pointer border-none shadow-xs" onClick={() => onNavigate('register')}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-20 md:py-28 px-6 text-center max-w-4xl mx-auto flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-4xl md:text-6xl font-serif text-navy font-bold leading-tight">
            Your AI Medical Scribe.<br />
            <span className="bg-gradient-to-r from-teal to-teal-dark bg-clip-text text-transparent">Write notes at the speed of conversation.</span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 max-w-2xl leading-relaxed">
            Transcribe bilingual Hinglish doctor-patient chats, generate dual-compartment clinical notes, search CDSCO drug directories, and print clean prescriptions directly onto physical letterheads.
          </p>
          <div className="flex gap-4 mt-2 max-[480px]:flex-col max-[480px]:w-full max-[480px]:px-6">
            <button className="inline-flex items-center justify-center px-6 py-3 bg-teal hover:bg-teal-dark text-navy font-bold text-sm rounded-xl transition-all cursor-pointer border-none shadow-md hover:shadow-lg" onClick={() => onNavigate('register')}>
              Start Free Trial
            </button>
            <a href="#features" className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs">
              Explore Features &darr;
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 w-full max-w-3xl">
            <div className="p-5 bg-white border border-gray-200/50 rounded-2xl flex flex-col items-center gap-1 shadow-xs">
              <h3 className="text-xl md:text-2xl font-bold text-navy">7 min &rarr; 3 sec</h3>
              <p className="text-xs text-gray-400 font-medium">Average transcription speed</p>
            </div>
            <div className="p-5 bg-white border border-gray-200/50 rounded-2xl flex flex-col items-center gap-1 shadow-xs">
              <h3 className="text-xl md:text-2xl font-bold text-navy">2+ Hours</h3>
              <p className="text-xs text-gray-400 font-medium">Saved daily per doctor</p>
            </div>
            <div className="p-5 bg-white border border-gray-200/50 rounded-2xl flex flex-col items-center gap-1 shadow-xs">
              <h3 className="text-xl md:text-2xl font-bold text-navy">₹0</h3>
              <p className="text-xs text-gray-400 font-medium">WhatsApp setup fees required</p>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto flex flex-col gap-12 border-t border-gray-150 w-full">
        <div className="text-center flex flex-col gap-2 max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-navy font-bold">Streamlined Clinical Workflows</h2>
          <p className="text-sm text-gray-500 leading-relaxed">Everything you need to focus more on patient care and less on administrative typing.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div className="p-6 bg-white border border-gray-200/60 rounded-2xl flex flex-col items-start text-left gap-3 shadow-xs hover:border-teal/30 hover:shadow-sm transition-all" key={i}>
              <div className="p-2.5 bg-teal-light/45 rounded-xl text-teal">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-6xl mx-auto flex flex-col gap-12 border-t border-gray-150 w-full">
        <div className="text-center flex flex-col gap-2 max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-navy font-bold">Transparent, Quota-Based Pricing</h2>
          <p className="text-sm text-gray-500 leading-relaxed">Choose the volume that matches your clinical practice. Pay only for the resources you consume.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, i) => (
            <div className={`relative p-8 bg-white border border-gray-200/60 rounded-2xl flex flex-col gap-5 shadow-xs hover:border-teal/20 hover:shadow-sm transition-all text-left ${tier.popular ? 'border-teal shadow-md ring-2 ring-teal/10' : ''}`} key={i}>
              {tier.popular && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-teal text-navy text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">Most Popular</span>}
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl md:text-4xl font-bold text-navy">{tier.price}</span>
                <span className="text-xs text-gray-400 font-medium">/{tier.period}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{tier.description}</p>
              <button
                className={`w-full mt-2 inline-flex items-center justify-center px-4 py-2.5 font-semibold text-sm rounded-xl transition-all cursor-pointer border-none ${tier.popular ? 'bg-teal hover:bg-teal-dark text-navy' : 'bg-white border border-gray-200 hover:bg-gray-50 text-navy'}`}
                onClick={() => onNavigate('register')}
              >
                {tier.actionLabel}
              </button>
              <ul className="flex flex-col gap-3 mt-2">
                {tier.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-teal shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 md:py-20 px-6 bg-navy text-white text-center flex flex-col items-center gap-6 w-full">
        <h2 className="text-2xl md:text-4xl font-serif font-bold">Ready to upgrade your practice?</h2>
        <p className="text-sm text-white/70 max-w-lg leading-relaxed">Join doctors across India using Qalam to reclaim their time and provide clear patient notes.</p>
        <button className="inline-flex items-center justify-center px-6 py-3 bg-teal hover:bg-teal-dark text-navy font-bold text-sm rounded-xl transition-all cursor-pointer border-none shadow-md hover:shadow-lg" onClick={() => onNavigate('register')}>
          Get Started for Free
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-navy border-t border-white/10 px-6 py-12 flex flex-col gap-8 w-full font-sans text-white">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Brand Column */}
          <div className="flex flex-col gap-2.5">
            <div className="font-serif text-[22px] text-white tracking-[0.5px] font-bold">
              Qa<span className="text-teal">lam</span>
            </div>
            <p className="text-xs text-white/60 font-normal leading-relaxed max-w-xs">
              Empowering clinicians with custom, secure artificial intelligence scribes and Indian-compliant prescription formatting.
            </p>
          </div>

          {/* Navigation Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Navigation</h4>
            <div className="flex flex-col gap-2">
              <a href="#features" className="text-xs font-semibold text-white/60 hover:text-teal transition-colors no-underline">Product Features</a>
              <a href="#pricing" className="text-xs font-semibold text-white/60 hover:text-teal transition-colors no-underline">Pricing Plans</a>
              <span className="text-xs font-semibold text-white/60 hover:text-teal cursor-pointer transition-colors" onClick={() => onNavigate('login')}>Sign In</span>
              <span className="text-xs font-semibold text-white/60 hover:text-teal cursor-pointer transition-colors" onClick={() => onNavigate('register')}>Register</span>
            </div>
          </div>

          {/* Legal & Support Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Legal & Support</h4>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-white/60 hover:text-teal cursor-pointer transition-colors" onClick={() => onNavigate('privacy')}>Privacy Policy</span>
              <span className="text-xs font-semibold text-white/60 hover:text-teal cursor-pointer transition-colors" onClick={() => onNavigate('terms')}>Terms of Service</span>
              <a href="mailto:support@qalam.medical" className="text-xs font-semibold text-white/60 hover:text-teal transition-colors no-underline">Email Support</a>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="max-w-6xl mx-auto w-full border-t border-white/10 pt-6 flex flex-col gap-4 text-center text-xs text-white/40">
          <p className="text-[10.5px] text-white/50 leading-relaxed max-w-3xl mx-auto italic">
            Disclaimer: Qalam is an AI-assisted documentation scribe. Registered clinicians retain sole responsibility to review and approve all prescriptions, treatment plans, and diagnostic notes prior to printing or sending.
          </p>
          <p>&copy; {new Date().getFullYear()} Qalam Medical. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
