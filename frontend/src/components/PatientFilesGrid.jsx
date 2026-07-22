import { useState } from 'react';
import { apiClient } from '../config.js';
import { FileCaptureModal } from './FileCaptureModal.jsx';

export function PatientFilesGrid({ patient, onPatientUpdate }) {
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [activeLightboxFile, setActiveLightboxFile] = useState(null);
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [deleteConfirmFileId, setDeleteConfirmFileId] = useState(null);

  const files = patient?.files || [];

  const handleDelete = (fileId, e) => {
    e.stopPropagation();
    setDeleteConfirmFileId(fileId);
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'X-ray': return { background: '#e0f2fe', color: '#0369a1' };
      case 'MRI': return { background: '#f5f3ff', color: '#6d28d9' };
      case 'CT Scan': return { background: '#fae8ff', color: '#a21caf' };
      case 'Surgery Photo': return { background: '#fee2e2', color: '#b91c1c' };
      case 'Lab Report': return { background: '#ecfdf5', color: '#047857' };
      case 'Prescription': return { background: '#fffbeb', color: '#b45309' };
      default: return { background: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-5 text-left select-none">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-4">
        <div className="text-left">
          <h3
            className="text-2xl font-normal text-[#22252a] tracking-tight mb-1"
            style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}
          >
            Clinical Diagnostics & Files
          </h3>
          <p className="text-xs text-slate-500 font-sans">MRI scans, X-rays, lab results, and diagnostic images attached to this patient profile.</p>
        </div>
        <button
          className="px-4 py-2.5 bg-[#22252a] hover:bg-[#1a1c20] text-white font-bold text-xs rounded-xl transition-all cursor-pointer border-none shadow-sm flex items-center gap-1.5"
          onClick={() => setShowCaptureModal(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Attach Clinical File ✦
        </button>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 text-gray-400 py-8 text-center text-sm font-medium border border-dashed border-gray-200 rounded-xl">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <p>No medical documents or scans attached to this patient profile yet.</p>
          <button className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-xs rounded-xl transition-all cursor-pointer" onClick={() => setShowCaptureModal(true)}>
            Capture First Scan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
          {files.map((file) => {
            const catColors = getCategoryColor(file.category);
            const formattedDate = new Date(file.uploadedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div key={file._id} className="border border-gray-150 rounded-xl bg-white overflow-hidden shadow-xs hover:border-teal/30 hover:shadow-sm cursor-pointer transition-all flex flex-col group" onClick={() => setActiveLightboxFile(file)}>
                <div className="relative aspect-square bg-gray-100 overflow-hidden flex items-center justify-center">
                  <img src={file.url} alt={file.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider" style={catColors}>{file.category}</span>
                </div>
                <div className="p-3 flex flex-col gap-1.5 border-t border-gray-100 text-left">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] text-gray-400 font-semibold">{formattedDate}</span>
                    <button
                      className="p-1 text-gray-400 hover:text-red-brand bg-transparent border-none cursor-pointer flex items-center justify-center rounded hover:bg-red-brand-light/30 transition-colors"
                      onClick={(e) => handleDelete(file._id, e)}
                      disabled={deletingFileId === file._id}
                      title="Delete attachment"
                    >
                      {deletingFileId === file._id ? (
                        <span className="animate-spin border-2 border-red-brand border-t-transparent rounded-full w-3.5 h-3.5"></span>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                  {file.notes && <p className="text-xs text-gray-600 line-clamp-2 italic">{file.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Camera Capture Modal */}
      <FileCaptureModal
        isOpen={showCaptureModal}
        onClose={() => setShowCaptureModal(false)}
        patientId={patient._id}
        onUploadSuccess={onPatientUpdate}
      />

      {/* Lightbox Overlay */}
      {activeLightboxFile && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[10000] p-4 backdrop-blur-md" onClick={() => setActiveLightboxFile(null)}>
          <button className="absolute top-4 right-4 text-white text-3xl font-bold bg-transparent border-none cursor-pointer p-2 hover:text-gray-300 transition-colors" onClick={() => setActiveLightboxFile(null)}>×</button>
          <div className="max-w-4xl max-h-[80vh] flex flex-col items-center relative gap-4" onClick={(e) => e.stopPropagation()}>
            <img src={activeLightboxFile.url} alt="Lightbox View" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl" />
            <div className="bg-white/10 backdrop-blur-md text-white p-4 rounded-xl max-w-lg w-full text-center flex flex-col items-center gap-1.5 border border-white/10">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider" style={getCategoryColor(activeLightboxFile.category)}>
                {activeLightboxFile.category}
              </span>
              <span className="text-[11px] text-gray-300">
                Uploaded: {new Date(activeLightboxFile.uploadedAt).toLocaleDateString()}
              </span>
              {activeLightboxFile.notes && <p className="text-sm text-gray-100 italic">{activeLightboxFile.notes}</p>}
            </div>
          </div>
        </div>
      )}

      {deleteConfirmFileId && (
        <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200 gap-3 text-left">
            <h3 className="text-base font-bold text-red-brand">Delete File?</h3>
            <p className="text-sm text-gray-600">Are you sure you want to permanently delete this attached file? This action cannot be undone.</p>
            <div className="flex justify-end gap-2.5 mt-2">
              <button 
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer"
                onClick={() => setDeleteConfirmFileId(null)}
              >
                Cancel
              </button>
              <button 
                className="inline-flex items-center justify-center px-4 py-2 bg-red-brand text-white hover:bg-red-brand/90 font-semibold text-sm rounded-xl transition-all cursor-pointer border-none"
                onClick={async () => {
                  const fileId = deleteConfirmFileId;
                  setDeleteConfirmFileId(null);
                  setDeletingFileId(fileId);
                  try {
                    const response = await apiClient.delete(`/api/patients/${patient._id}/files/${fileId}`);
                    if (response.data.success) {
                      onPatientUpdate(response.data.data);
                    }
                  } catch (err) {
                    console.error('Error deleting file:', err);
                    alert('Error deleting file: ' + err.message);
                  } finally {
                    setDeletingFileId(null);
                  }
                }}
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
