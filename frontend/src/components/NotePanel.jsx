import React from 'react';

export function NotePanel({ note, loading }) {
  const getStatus = () => {
    if (loading) return 'Generating...';
    if (note) return 'Generated';
    return 'Pending';
  };

  const getStatusClass = () => {
    if (loading) return 'generating';
    if (note) return 'generated';
    return 'pending';
  };

  return (
    <aside className="note-panel">
      <div className="note-header">
        <h3>Clinical Note</h3>
        <span className={`status-badge ${getStatusClass()}`}>
          {getStatus()}
        </span>
      </div>

      {note && (
        <div className="note-content">
          <div className="note-section">
            <label>Chief Complaint</label>
            <p>{note.chief_complaint}</p>
          </div>

          <div className="note-section">
            <label>History</label>
            <p>{note.history}</p>
          </div>

          <div className="note-section">
            <label>Examination</label>
            <p>{note.examination}</p>
          </div>

          <div className="note-section">
            <label>Diagnosis</label>
            <p>{note.diagnosis}</p>
          </div>

          <div className="note-section">
            <label>Prescription</label>
            <div className="prescription-list">
              {note.prescription?.map((med, idx) => (
                <div key={idx} className="prescription-item">
                  <span className="drug">{med.drug}</span>
                  <span className="dose">{med.dose}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="note-section">
            <label>Follow-up</label>
            <p>{note.followup}</p>
          </div>

          <div className="note-actions">
            <button className="action-btn">📄 Export PDF</button>
            <button className="action-btn">🏥 Push to EHR</button>
            <button className="action-btn">💬 Send WhatsApp</button>
          </div>
        </div>
      )}

      {!note && !loading && (
        <div className="note-empty">
          <p>Start recording to generate clinical notes</p>
        </div>
      )}
    </aside>
  );
}
