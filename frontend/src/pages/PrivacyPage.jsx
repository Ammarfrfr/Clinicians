import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock, FileText, CheckCircle } from 'lucide-react';

export function PrivacyPage() {
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
          <ShieldAlert className="w-8 h-8 text-teal" />
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-navy font-bold">Privacy Policy</h1>
            <p className="text-xs text-gray-400 font-medium">Last updated: May 24, 2026</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          At Scribologist, we recognize that patient confidentiality and data security are the cornerstones of clinical practice. This Privacy Policy describes how Scribologist Medical ("we", "us", or "our") collects, uses, processes, and stores information when you use our AI scribe website, standalone PWA, and backend services.
        </p>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal" /> 1. Compliance with Indian Healthcare Regulations
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Scribologist is designed to comply with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> of India, and the guidelines set forth by the National Medical Commission (NMC). 
            As a clinician, you are the Data Fiduciary under the DPDP Act, and Scribologist acts as the Data Processor. It is your professional responsibility to obtain appropriate consent from patients before recording consultations.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal" /> 2. Information We Collect and Process
          </h2>
          <ul className="list-disc pl-5 text-sm text-gray-600 flex flex-col gap-2">
            <li><strong>Audio Recordings:</strong> Consultation audio recorded through the microphone is temporarily buffered in memory on our secure servers for speech-to-text translation and speaker diarization. Audio files are processed instantly and deleted immediately upon transcript generation. <strong>We do not save raw consultation audio recordings.</strong></li>
            <li><strong>Clinical Data:</strong> Labeled transcripts, clinical summaries, diagnoses, prescriptions, and vital statistics are stored in encrypted MongoDB databases.</li>
            <li><strong>Clinician Profiles:</strong> Name, specialization, license numbers, email, phone number, and clinic/hospital names are collected during onboarding to customize outputs and headers.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal" /> 3. Data Processing and Security Controls
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            All data transmitted between the client browser (PWA) and our servers is secured using SSL/TLS encryption. Saved clinical notes are stored with industry-standard encryption at rest. We limit database access to authorized personnel and do not sell, rent, or lease clinical patient records to third-party advertisers or insurance companies.
          </p>
        </section>

        <section className="flex flex-col gap-3 border-t border-gray-100 pt-6">
          <h2 className="text-lg font-bold text-navy">4. Contact Information</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            For questions, concerns, or requests regarding data privacy, please contact our support desk:
          </p>
          <p className="text-sm text-navy font-semibold">
            Email: privacy@scribologist.ai
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
