import React from 'react';

export function Transcript({ transcript }) {
  return (
    <div className="transcript-container">
      <label className="transcript-label">Live Transcript</label>
      <div className="transcript-box">
        {transcript || <span className="transcript-placeholder">Transcript will appear here...</span>}
      </div>
    </div>
  );
}
