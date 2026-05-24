import { useRef, useEffect } from 'react';

export function Transcript({ transcript, recording }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  if (!transcript && !recording) return null;

  const parseTranscript = (text) => {
    if (!text) return [];
    return text.split('\n').filter((line) => line.trim()).map((line, idx) => {
      const doctorMatch = line.match(/^Doctor:\s*"?(.+?)"?$/i);
      const patientMatch = line.match(/^Patient:\s*"?(.+?)"?$/i);
      
      if (doctorMatch) {
        return { id: idx, speaker: 'Doctor', text: doctorMatch[1] };
      } else if (patientMatch) {
        return { id: idx, speaker: 'Patient', text: patientMatch[1] };
      }
      return { id: idx, speaker: null, text: line };
    });
  };

  const lines = parseTranscript(transcript);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex-1 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <span className="text-[13.5px] font-semibold text-navy">Transcript</span>
        {recording && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-teal-dark tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            LIVE
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto text-[13.5px] leading-relaxed text-gray-700">
        {!transcript && recording && (
          <div className="text-gray-400 italic">Listening... speak to begin transcription</div>
        )}
        {lines.map((line) => (
          <div key={line.id} style={{ marginBottom: '8px' }}>
            {line.speaker ? (
              <div>
                <span className={`${line.speaker === 'Doctor' ? 'text-teal-dark' : 'text-navy-light'} font-semibold text-[12px]`}>
                  {line.speaker}:
                </span>{' '}
                <span className="text-gray-700">{line.text}</span>
              </div>
            ) : (
              <span className="text-gray-700">{line.text}</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
