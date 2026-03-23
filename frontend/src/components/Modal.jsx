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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="modal-title">{title}</h3>}
        
        <div className="modal-body">
          {children}
        </div>

        <div className="modal-actions">
          {secondaryAction && (
            <button 
              className="modal-btn modal-btn-secondary"
              onClick={secondaryAction}
              autoFocus={!isDanger}
            >
              {secondaryLabel}
            </button>
          )}
          {primaryAction && (
            <button 
              ref={primaryButtonRef}
              className={`modal-btn ${isDanger ? 'modal-btn-danger' : 'modal-btn-primary'}`}
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
