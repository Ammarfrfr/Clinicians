import React, { useEffect } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { FooterSection } from '../components/landing/FooterSection';

export function PrivacyPage({ onNavigate }) {
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
            LEGAL & PRIVACY
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#22252a] font-bold tracking-tight leading-none">
            Privacy Policy
          </h1>
        </div>

        {/* Introduction */}
        <div className="text-base sm:text-lg text-slate-700 leading-relaxed mb-12 max-w-3xl">
          At Scribologist, we recognize that patient confidentiality and medical data security are the cornerstones of healthcare. This Privacy Policy describes how Scribologist AI ("we", "us", or "our") collects, processes, and protects information when you use our AI scribe platform, mobile tools, and backend services.
        </div>

        {/* Policy Sections Flow (Clean, Borderless, vsk.design style) */}
        <div className="flex flex-col gap-12 max-w-3xl">
          
          {/* Section 01 */}
          <section className="flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">01 / REGULATORY COMPLIANCE</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              DPDP Act & NMC Compliance
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Scribologist is engineered to strictly comply with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> of India, and guidelines set forth by the National Medical Commission (NMC).
            </p>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              As a clinician, you act as the Data Fiduciary under the DPDP Act, while Scribologist acts as the Data Processor. Registered clinicians hold professional responsibility to obtain appropriate consent from patients prior to ambient consultation recording.
            </p>
          </section>

          {/* Section 02 */}
          <section className="flex flex-col gap-4">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">02 / DATA COLLECTION</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Information We Collect & Process
            </h2>
            
            <div className="flex flex-col gap-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              <div className="border-l-2 border-slate-900 pl-4 py-1">
                <strong className="text-[#22252a] block">Zero Raw Audio Disk Storage:</strong>
                Audio recorded through the microphone is temporarily buffered in encrypted memory solely for speech-to-text translation and speaker diarization. Audio buffers are deleted immediately upon transcript generation. <strong>We do not save raw consultation audio recordings on disk.</strong>
              </div>

              <div className="border-l-2 border-slate-900 pl-4 py-1">
                <strong className="text-[#22252a] block">Clinical Transcripts & Summaries:</strong>
                Labeled transcripts, clinical notes (SOAP notes), diagnoses, prescriptions, and vital statistics are stored in encrypted database clusters.
              </div>

              <div className="border-l-2 border-slate-900 pl-4 py-1">
                <strong className="text-[#22252a] block">Clinician Profile Information:</strong>
                Name, specialization, license numbers, work email, phone number, and clinic names collected during onboarding to format output handouts.
              </div>
            </div>
          </section>

          {/* Section 03 */}
          <section className="flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">03 / SECURITY CONTROLS</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Security Controls & Encryption
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              All data transmitted between the client browser and our application servers is protected using TLS 1.3 encryption. Saved clinical notes are stored with AES-256 encryption at rest. Database access is strictly restricted to authenticated application roles, and we never sell, rent, or monetize patient records with third parties or advertising brokers.
            </p>
          </section>

          {/* Section 04 */}
          <section className="flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">04 / YOUR RIGHTS</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Data Ownership & Deletion Rights
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Clinicians retain 100% ownership of all patient documentation created on Scribologist. You may export, modify, or permanently delete patient files and clinical encounter history from your workspace at any time.
            </p>
          </section>

          {/* Section 05 */}
          <section className="flex flex-col gap-3 border-t border-slate-200/80 pt-8">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">05 / CONTACT DESK</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Privacy Desk & Inquiries
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              For privacy requests, data audit queries, or DPDP compliance questions, reach out to our privacy officer directly:
            </p>
            <p className="text-lg sm:text-xl font-bold text-[#22252a]">
              Email: <a href="mailto:privacy@scribologist.ai" className="text-blue-600 underline">privacy@scribologist.ai</a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <FooterSection onNavigate={onNavigate} />
    </div>
  );
}
