import { useEffect, useRef } from 'react';

export function Recorder({
  recording,
  isPaused,
  loading,
  timer,
  processingStep,
  onStart,
  onStop,
  onPause,
  onResume,
  onCancel,
  retryAvailable,
  transcriptionError,
  onRetry,
  onReRecord,
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!recording && !loading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const animate = () => {
      ctx.fillStyle = '#F3E4C9';
      ctx.fillRect(0, 0, width, height);

      const bars = 40;
      const barWidth = width / bars;
      const maxBarHeight = height * 0.75;

      for (let i = 0; i < bars; i++) {
        const randomHeight = (recording && !isPaused) ? Math.random() * maxBarHeight + 6 : maxBarHeight * 0.12;
        const x = i * barWidth + barWidth * 0.2;
        const w = barWidth * 0.6;
        const y = (height - randomHeight) / 2;

        ctx.fillStyle = (recording && !isPaused) ? '#8B5E3C' : '#D3D4C0';
        ctx.beginPath();
        ctx.roundRect(x, y, w, randomHeight, 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [recording, isPaused, loading]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4 w-full select-none">
      {/* Audio Wave Visualizer - only show when recording or transcribing */}
      {(recording || loading) && (
        <div className="flex flex-col gap-2 p-3 bg-[#F3E4C9]/50 rounded-xl border border-[#D3D4C0] transition-all">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-wider text-[#0A2947]/70">
            <span>{recording ? (isPaused ? "Recording Paused" : "Ambient Audio Live Stream") : "Processing Audio..."}</span>
            {recording && (
              <span className={`font-mono ${isPaused ? 'text-amber-600' : 'text-[#8B5E3C] animate-pulse'}`}>
                {isPaused ? "⏸ PAUSED" : "● LIVE REC"} ({formatTimer(timer)})
              </span>
            )}
          </div>
          <canvas
            ref={canvasRef}
            className="w-full h-12 bg-[#F3E4C9] rounded-lg border border-[#D3D4C0]/60"
            width={400}
            height={50}
          />
        </div>
      )}

      {/* Upload Retry State */}
      {retryAvailable && (
        <div className="flex flex-col gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-left">
          <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{transcriptionError || "Recording failed to transcribe."}</span>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              className="bg-[#8B5E3C] hover:bg-[#6e482d] text-white border-none px-3.5 py-2 rounded-lg text-[11px] font-bold cursor-pointer transition-all shadow-sm"
              onClick={onRetry}
            >
              Retry Upload
            </button>
            <button
              className="bg-white border border-[#D3D4C0] text-[#0A2947] px-3.5 py-2 rounded-lg text-[11px] font-bold cursor-pointer hover:bg-[#F3E4C9]/40 transition-all"
              onClick={onReRecord}
            >
              Record Again
            </button>
          </div>
        </div>
      )}

      {/* AI Processing Steps Tracker */}
      {loading && (
        <div className="flex justify-between bg-[#F3E4C9]/60 rounded-xl p-3 border border-[#D3D4C0]">
          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase transition-colors ${processingStep >= 1 ? 'text-[#0A2947]' : 'text-[#0A2947]/40'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${processingStep >= 1 ? 'bg-[#8B5E3C]' : 'bg-[#D3D4C0]'}`} />
            <span>Transcribing</span>
          </div>
          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase transition-colors ${processingStep >= 2 ? 'text-[#0A2947]' : 'text-[#0A2947]/40'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${processingStep >= 2 ? 'bg-[#8B5E3C]' : 'bg-[#D3D4C0]'}`} />
            <span>Structuring SOAP</span>
          </div>
          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase transition-colors ${processingStep >= 3 ? 'text-[#0A2947]' : 'text-[#0A2947]/40'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${processingStep >= 3 ? 'bg-[#8B5E3C]' : 'bg-[#D3D4C0]'}`} />
            <span>CDSCO Check</span>
          </div>
        </div>
      )}

      {/* Action Controls (Starts, Stops, Pauses, Resumes, Cancels recording) */}
      {!retryAvailable && !loading && (
        <div className="flex items-center justify-center gap-2 w-full mt-2">
          {recording ? (
            <>
              {/* Cancel / Discard (Wrong Button) */}
              <button
                onClick={onCancel}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 border border-slate-200 cursor-pointer transition-all flex items-center justify-center shadow-xs shrink-0"
                title="Cancel & Discard Recording"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Pause / Resume Button */}
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wide rounded-full cursor-pointer transition-all flex items-center gap-2 border-none shadow-md"
                  title="Resume Recording"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Resume
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wide rounded-full cursor-pointer transition-all flex items-center gap-2 border-none shadow-md"
                  title="Pause Recording"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  Pause
                </button>
              )}

              {/* Stop & Compile Note */}
              <button
                onClick={onStop}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wide rounded-full cursor-pointer transition-all flex items-center gap-2 border-none shadow-md"
                title="Stop & Compile Note"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                Stop & Compile
              </button>
            </>
          ) : (
            <button
              onClick={onStart}
              className="px-6 py-3 bg-[#8B5E3C] hover:bg-[#6e482d] text-white font-bold text-xs uppercase tracking-wide rounded-full cursor-pointer transition-all flex items-center gap-2 border-none shadow-md"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
              Start Recording
            </button>
          )}
        </div>
      )}
    </div>
  );
}
