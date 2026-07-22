import React from 'react';
import { Check } from 'lucide-react';

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

export function PricingGrid({ onNavigate }) {
  return (
    <section id="pricing" className="py-20 px-6 max-w-6xl mx-auto flex flex-col gap-12 border-t border-slate-100 w-full z-10">
      <div className="text-center flex flex-col gap-2 max-w-xl mx-auto">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-600">Transparent Subscriptions</span>
        <h2 className="text-2xl md:text-3xl font-serif text-[#22252a] font-bold">Uncompromising Value for Clinicians</h2>
        <p className="text-sm text-slate-500 leading-relaxed">Choose a pilot plan to launch your AI clinical scribe department. Upgrade, downgrade, or cancel anytime.</p>
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
                RECOMMENDED PILOT
              </span>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">{tier.name}</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl md:text-4xl font-serif font-bold text-slate-900">{tier.price}</span>
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
            </div>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Included Features</span>
              <ul className="flex flex-col gap-2.5 pl-0 list-none m-0">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="text-xs text-slate-500 flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
