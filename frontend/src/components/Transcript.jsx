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
    <div className="bg-white border border-[#D3D4C0] rounded-2xl p-6 flex-1 flex flex-col overflow-hidden text-left select-none shadow-xs">
      <div className="flex justify-between items-center mb-4 shrink-0 border-b border-[#D3D4C0]/40 pb-3">
        <span className="text-sm font-bold font-187 text-[#0A2947] tracking-tight">
          Live Consultation Transcript
        </span>
        {recording && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-mono text-[10px] font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            LIVE TRANSCRIPTION
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto text-xs leading-relaxed text-[#0A2947] flex flex-col gap-3 font-sans">
        {!transcript && recording && (
          <div className="text-[#0A2947]/50 italic text-xs py-4">
            Listening to doctor-patient conversation... speak ambiently to begin.
          </div>
        )}

        {lines.map((line) => (
          <div key={line.id} className="flex flex-col gap-0.5 p-2 rounded-xl bg-[#F3E4C9]/40 border border-[#D3D4C0]/60">
            {line.speaker ? (
              <div>
                <span className={`font-bold text-xs uppercase tracking-wider block mb-0.5 ${line.speaker === 'Doctor' ? 'text-[#8B5E3C]' : 'text-[#0A2947]'}`}>
                  {line.speaker}
                </span>
                <span className="text-[#0A2947] text-xs leading-relaxed">{line.text}</span>
              </div>
            ) : (
              <span className="text-[#0A2947] text-xs leading-relaxed">{line.text}</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
