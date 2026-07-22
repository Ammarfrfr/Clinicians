import { useEffect, useRef } from 'react';

export function Recorder({
  recording,
  loading,
  timer,
  processingStep,
  onStart,
  onStop,
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
      ctx.fillStyle = '#fafafc';
      ctx.fillRect(0, 0, width, height);

      const bars = 50;
      const barWidth = width / bars;
      const maxBarHeight = height * 0.75;

      for (let i = 0; i < bars; i++) {
        const randomHeight = recording ? Math.random() * maxBarHeight + 6 : maxBarHeight * 0.12;
        const x = i * barWidth + barWidth * 0.2;
        const w = barWidth * 0.6;
        const y = (height - randomHeight) / 2;

        ctx.fillStyle = recording ? '#22252a' : '#cbd5e1';
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
  }, [recording, loading]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs shrink-0 select-none">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
          Ambient Audio Stream
        </span>
        {recording && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700">
            <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">LIVE REC</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <canvas
          ref={canvasRef}
          className="w-full h-20 bg-[#fafafc] rounded-xl border border-slate-200/60"
          width={500}
          height={80}
        />

        {retryAvailable ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-rose-700 text-xs bg-rose-50 border border-rose-200 p-3.5 rounded-xl font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{transcriptionError || "Recording failed to transcribe."}</span>
            </div>
            <div className="flex gap-3">
              <button
                className="bg-[#22252a] hover:bg-[#1a1c20] text-white border-none px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                onClick={onRetry}
              >
                Retry Upload
              </button>
              <button
                className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                onClick={onReRecord}
              >
                Record Again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <button
                  className={`w-14 h-14 rounded-2xl border-none flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    recording ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#22252a] text-white hover:scale-105'
                  }`}
                  onClick={recording ? onStop : onStart}
                  disabled={loading}
                >
                  {recording ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="8" />
                    </svg>
                  )}
                </button>

                <div className="flex flex-col gap-0.5 text-left">
                  <div className="font-mono text-2xl font-black text-[#22252a] tracking-tight">
                    {formatTime(timer)}
                  </div>
                  <div className={`text-xs font-semibold ${recording ? 'text-rose-600' : 'text-slate-500'}`}>
                    {recording ? 'Ambient recording active...' : loading ? 'AI Transcribing & Structuring SOAP...' : 'Click button to start recording consultation'}
                  </div>
                </div>
              </div>

              {recording && (
                <button
                  onClick={onStop}
                  className="px-5 py-2.5 bg-[#22252a] hover:bg-[#1a1c20] text-white font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md border-none flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  Stop & Compile SOAP Note
                </button>
              )}
            </div>

            {loading && (
              <div className="flex justify-between bg-slate-50 rounded-xl p-3.5 px-4 border border-slate-200/80">
                <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${processingStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${processingStep >= 1 ? 'bg-slate-900' : 'bg-slate-300'}`} />
                  <span>Transcribing</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${processingStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${processingStep >= 2 ? 'bg-slate-900' : 'bg-slate-300'}`} />
                  <span>Structuring SOAP</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${processingStep >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${processingStep >= 3 ? 'bg-slate-900' : 'bg-slate-300'}`} />
                  <span>CDSCO Check</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
