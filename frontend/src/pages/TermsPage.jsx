import React, { useEffect } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { FooterSection } from '../components/landing/FooterSection';

export function TermsPage({ onNavigate }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col font-sans select-none overflow-x-clip text-slate-800 antialiased">
      {/* Navbar */}
      <Navbar onNavigate={onNavigate} />

      {/* Main Content Area (Clean Minimalist Layout matching vsk.design) */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-14 md:py-20 text-left">
        
        {/* Page Title & Header */}
        <div className="mb-14 border-b border-slate-200/80 pb-8 text-left">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block mb-3">
            LEGAL & TERMS
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#22252a] font-bold tracking-tight leading-none">
            Terms of Service
          </h1>
        </div>

        {/* Introduction */}
        <div className="text-base sm:text-lg text-slate-700 leading-relaxed mb-12 max-w-3xl">
          Welcome to Scribologist. By creating an account, accessing, or using our AI-assisted medical documentation platform, you agree to comply with and be bound by the following Terms of Service.
        </div>

        {/* Terms Sections Flow (Clean, Borderless, vsk.design style) */}
        <div className="flex flex-col gap-12 max-w-3xl">
          
          {/* Section 01 - Disclaimer */}
          <section className="flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">01 / MEDICAL DISCLAIMER</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Clinical Responsibility & Liability Notice
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Scribologist is an AI-assisted documentation tool designed to streamline clinical note-taking. It does <strong>not</strong> practice medicine, provide clinical diagnoses, prescribe treatment courses, or replace professional medical judgment.
            </p>
            <div className="border-l-2 border-[#22252a] pl-4 py-1.5 my-1 text-base sm:text-lg text-[#22252a] font-bold leading-relaxed">
              The registered clinician holds sole responsibility for reviewing, updating, and verifying all generated transcripts, clinical SOAP notes, prescriptions, diagnostics, and vitals before printing, saving, or sharing them with patients.
            </div>
          </section>

          {/* Section 02 */}
          <section className="flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">02 / CREDENTIALS</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Practitioner Verification & Accounts
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Scribologist services are intended exclusively for verified medical practitioners. During account onboarding, you represent that you hold a valid medical qualification and license to practice. You are responsible for maintaining account credential confidentiality.
            </p>
          </section>

          {/* Section 03 */}
          <section className="flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">03 / PATIENT CONSENT</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Patient Consent & Confidentiality
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              By initiating ambient consultation recording, you affirm that you have obtained appropriate consent from the patient in accordance with National Medical Commission (NMC) guidelines and regional healthcare privacy laws.
            </p>
          </section>

          {/* Section 04 */}
          <section className="flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">04 / INTELLECTUAL PROPERTY</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Intellectual Property & Service Modifications
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              All platform software, AI transcription models, and branding are the property of Scribologist AI. We reserve the right to update features, improve medical vocabulary dictionaries, or modify service offerings to enhance clinical performance.
            </p>
          </section>

          {/* Section 05 */}
          <section className="flex flex-col gap-3 border-t border-slate-200/80 pt-8">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">05 / LEGAL DESK</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Legal Desk Contact
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              For legal notices, terms inquiries, or compliance correspondence, contact our legal desk:
            </p>
            <p className="text-lg sm:text-xl font-bold text-[#22252a]">
              Email: <a href="mailto:legal@scribologist.ai" className="text-blue-600 underline">legal@scribologist.ai</a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <FooterSection onNavigate={onNavigate} />
    </div>
  );
}
