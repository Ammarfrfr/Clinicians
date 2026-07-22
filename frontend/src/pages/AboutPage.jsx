import React, { useEffect } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { FooterSection } from '../components/landing/FooterSection';

export function AboutPage({ onNavigate }) {
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
            ABOUT SCRIBOLOGIST
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#22252a] font-bold tracking-tight leading-none">
            Building the Ambient AI Scribe for Modern Healthcare
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-4 font-mono">
            Designed alongside practicing medical clinicians & healthcare technology specialists.
          </p>
        </div>

        {/* Introduction */}
        <div className="text-base sm:text-lg text-slate-700 leading-relaxed mb-12 max-w-3xl">
          Scribologist was created with a clear mission: eliminate doctor administrative burnout and give clinicians 2+ hours back every single day so they can focus entirely on patient care.
        </div>

        {/* About Sections Flow (Clean, Borderless, vsk.design style) */}
        <div className="flex flex-col gap-12 max-w-3xl">
          
          {/* Section 01 */}
          <section className="flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">01 / OUR MISSION</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Empowering Clinicians Everywhere
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Medical documentation has become one of the single largest causes of physician burnout worldwide. Doctors spend up to 40% of their clinic hours typing SOAP notes, looking up drug codes, and filing administrative paperwork.
            </p>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Scribologist operates silently in the background during patient consultations, ambiently capturing clinical conversations and auto-generating structured medical documentation in real time.
            </p>
          </section>

          {/* Section 02 */}
          <section className="flex flex-col gap-4">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">02 / CORE CAPABILITIES</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Multilingual Speech & Clinical Intelligence
            </h2>
            
            <div className="flex flex-col gap-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              <div className="border-l-2 border-slate-900 pl-4 py-1">
                <strong className="text-[#22252a] block">Multilingual Code-Switching Speech AI:</strong>
                Patients frequently mix regional languages and English. Scribologist seamlessly recognizes fluid code-switching between English, Hindi, Gujarati, Marathi, Tamil, Telugu, and Kannada without losing clinical intent.
              </div>

              <div className="border-l-2 border-slate-900 pl-4 py-1">
                <strong className="text-[#22252a] block">Specialty-Aware Formatting:</strong>
                Structured extraction tailored for General Practice, Internal Medicine, Pediatrics, Cardiology, Orthopedics, Dermatology, ENT, and Gynecology.
              </div>

              <div className="border-l-2 border-slate-900 pl-4 py-1">
                <strong className="text-[#22252a] block">Prescription Safety & Verification:</strong>
                Auto-scans dosage formats and checks medications against CDSCO approved drug indexes to flag potential allergies or drug interactions.
              </div>
            </div>
          </section>

          {/* Section 03 */}
          <section className="flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">03 / DATA PRIVACY</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Zero Audio Retention & DPDP Compliance
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              We hold patient confidentiality to the highest standard. Consultation audio is processed strictly in temporary RAM buffers and permanently discarded immediately after transcript generation. We store zero raw audio recordings on disk, ensuring 100% compliance with India's DPDP Act 2023 and NMC guidelines.
            </p>
          </section>

          {/* Section 04 */}
          <section className="flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">04 / CLINICIAN IN CONTROL</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Doctor-In-The-Loop Workflow
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Scribologist is built to assist, not replace, medical judgment. Registered clinicians retain total control to review, edit, and approve every generated SOAP note, prescription, and patient instruction before saving or printing.
            </p>
          </section>

          {/* Section 05 */}
          <section className="flex flex-col gap-3 border-t border-slate-200/80 pt-8">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">05 / GET IN TOUCH</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#22252a]">
              Connect With Our Team
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Have questions or want to bring Scribologist to your clinic or hospital network? Write to us:
            </p>
            <p className="text-lg sm:text-xl font-bold text-[#22252a]">
              Email: <a href="mailto:hello@scribologist.ai" className="text-blue-600 underline">hello@scribologist.ai</a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <FooterSection onNavigate={onNavigate} />
    </div>
  );
}
