import React from 'react';

export function Transcript({ transcript }) {
  // Enhanced formatting for Doctor/Patient speakers
  const formatTranscript = (text) => {
    if (!text) return <span className="transcript-placeholder">Transcript will appear here...</span>;
    
    // Split by newlines, or try to split whenever "Doctor:" or "Patient:" appears if missing newlines
    let textToParse = text;
    // Add newlines before "Patient:" or "Doctor:" if they are missing
    textToParse = textToParse.replace(/(Patient:|Doctor:|Orthopedic Surgeon:)/gi, '\n$1');
    let lines = textToParse.split('\n').map(l => l.trim()).filter(line => line.length > 0);
    
    return lines.map((line, idx) => {
      let isDoctor = line.toLowerCase().startsWith('doctor');
      let isPatient = line.toLowerCase().startsWith('patient');
      
      const speakerClass = isDoctor ? 'speaker-doctor' : (isPatient ? 'speaker-patient' : 'speaker-other');
      
      return (
        <div key={idx} className={`transcript-line ${speakerClass}`} style={{ marginBottom: '8px' }}>
          {isDoctor || isPatient ? (
            <>
              <strong style={{ 
                color: isDoctor ? '#4f46e5' : '#e11d48', 
                marginRight: '6px' 
              }}>
                {line.substring(0, line.indexOf(':') + 1)}
              </strong>
              <span>{line.substring(line.indexOf(':') + 1)}</span>
            </>
          ) : (
            <span>{line}</span>
          )}
        </div>
      );
    });
  };

  return (
    <div className="transcript-container">
      <label className="transcript-label">Live Transcript</label>
      <div className="transcript-box" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
        {formatTranscript(transcript)}
      </div>
    </div>
  );
}
