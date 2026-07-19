import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, AlertTriangle, UserCheck, ShieldCheck } from 'lucide-react';

export function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warm-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 bg-warm-white/80 backdrop-blur-md z-50 border-b border-gray-200/40 px-6 py-4 flex justify-between items-center w-full">
        <div className="font-serif text-[26px] text-navy tracking-[0.5px] font-bold">
          Qa<span className="text-teal">lam</span>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-xs rounded-xl transition-all cursor-pointer bg-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 flex-1 text-left flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
          <FileText className="w-8 h-8 text-teal" />
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-navy font-bold">Terms of Service</h1>
            <p className="text-xs text-gray-400 font-medium">Last updated: May 24, 2026</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Welcome to Scribologist. By registering for or using our AI-assisted medical scribe platform, web app, or standalone PWA, you agree to comply with and be bound by the following Terms of Service.
        </p>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-brand" /> 1. Important Medical & Liability Disclaimer
          </h2>
          <div className="p-4 bg-red-brand-light border border-red-brand/10 rounded-xl">
            <p className="text-xs text-red-brand leading-relaxed font-semibold uppercase tracking-wider mb-2">Crucial Professional Notice:</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              Scribologist is an AI-assisted documentation utility. It does <strong>not</strong> practice medicine, deliver clinical diagnoses, prescribe drug courses, or replace professional medical judgment. 
              <strong>The clinician holds sole responsibility for reviewing, updating, and verifying all generated transcripts, clinical notes, prescriptions, diagnostics, and vitals before finalizing, printing, or sharing them with patients.</strong> We accept no liability for clinical decisions made based on outputs.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal" /> 2. Clinician Account & Professional Credentials
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Scribologist accounts are only available to verified, practicing medical professionals. During onboarding, you must provide your true legal name, medical license number, and qualification. You are responsible for maintaining the confidentiality of your account credentials and represent that all information provided is accurate and current.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal" /> 3. Patient Consent and Legal Compliance
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            By capturing patient consults, you represent that you have obtained the patient's explicit verbal or written consent to record and process their audio for clinical summarization. You agree to protect patient confidentiality and comply with your regional medical council regulations.
          </p>
        </section>

        <section className="flex flex-col gap-3 border-t border-gray-100 pt-6">
          <h2 className="text-lg font-bold text-navy">4. Contact Information</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            For any queries or legal notices, please write to:
          </p>
          <p className="text-sm text-navy font-semibold">
            Email: legal@scribologist.ai
          </p>
        </section>
      </main>

      {/* Mini Footer */}
      <footer className="bg-white border-t border-gray-150 py-6 px-6 text-center text-xs text-gray-400 w-full mt-auto">
        <p>&copy; {new Date().getFullYear()} Scribologist Medical. All rights reserved.</p>
      </footer>
    </div>
  );
}
