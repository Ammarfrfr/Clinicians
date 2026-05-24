import { useState, useRef } from 'react';
import { apiClient } from '../config.js';

export function FileCaptureModal({ isOpen, onClose, patientId, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [category, setCategory] = useState('X-ray');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const categories = ['X-ray', 'MRI', 'CT Scan', 'Surgery Photo', 'Lab Report', 'Prescription', 'Other'];

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const triggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please capture or select a file to upload.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', category);
      formData.append('notes', notes);

      const response = await apiClient.post(`/api/patients/${patientId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        onUploadSuccess(response.data.data); // Returns updated patient
        handleClose();
      } else {
        setError(response.data.message || 'Upload failed.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      setError(err.response?.data?.message || 'Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setCategory('X-ray');
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-xs" onClick={handleClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-gray-100 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-navy mb-4 text-left">Attach Patient File</h2>
        
        {error && (
          <div className="p-3 rounded-xl bg-red-brand-light text-red-brand text-xs flex items-center gap-2 mb-4 border border-red-brand/10">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 mt-2">
          {!previewUrl ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Hidden Inputs */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <input
                type="file"
                accept="image/*,application/pdf"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <button className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 hover:border-teal/30 cursor-pointer transition-all text-navy font-semibold text-sm" onClick={triggerCamera}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Take Photo
              </button>

              <button className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 hover:border-teal/30 cursor-pointer transition-all text-navy font-semibold text-sm" onClick={triggerFileSelect}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Choose from Files
              </button>
            </div>
          ) : (
            <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden flex flex-col items-center justify-center group">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              <button className="absolute bottom-3 right-3 px-3 py-1.5 bg-red-brand hover:bg-red-brand/95 text-white text-xs font-bold rounded-lg transition-colors border-none cursor-pointer shadow-md" onClick={() => { setSelectedFile(null); setPreviewUrl(''); }}>
                Remove & Retake
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">File Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploading}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all h-[40px]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Doctor Notes</label>
            <textarea
              placeholder="Add details, observations, or clinical context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={uploading}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-y"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 mt-5">
          <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal hover:bg-teal-dark text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? (
              <span className="animate-spin border-2 border-navy border-t-transparent rounded-full w-4 h-4"></span>
            ) : (
              'Upload File'
            )}
          </button>
          <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer" onClick={handleClose} disabled={uploading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
