import React, { useEffect, useRef } from 'react';

export function Modal({ 
  isOpen, 
  title, 
  children, 
  primaryAction, 
  primaryLabel = 'Confirm',
  secondaryAction,
  secondaryLabel = 'Cancel',
  isDanger = false,
  onClose
}) {
  const primaryButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && primaryButtonRef.current) {
      // Focus on primary button when modal opens
      setTimeout(() => primaryButtonRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        primaryAction?.();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, primaryAction, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-xs" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="text-base font-bold text-navy mb-3 text-left">{title}</h3>}
        
        <div className="text-sm text-gray-600 mb-5 text-left">
          {children}
        </div>
 
        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
          {secondaryAction && (
            <button 
              className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer"
              onClick={secondaryAction}
              autoFocus={!isDanger}
            >
              {secondaryLabel}
            </button>
          )}
          {primaryAction && (
            <button 
              ref={primaryButtonRef}
              className={`inline-flex items-center justify-center px-4 py-2 font-semibold text-sm rounded-xl transition-all cursor-pointer border-none ${isDanger ? 'bg-red-brand hover:bg-red-brand/90 text-white' : 'bg-teal hover:bg-teal-dark text-navy'}`}
              onClick={primaryAction}
              autoFocus={isDanger}
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
