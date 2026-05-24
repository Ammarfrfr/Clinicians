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
      ctx.fillStyle = '#FAFAF8';
      ctx.fillRect(0, 0, width, height);

      const bars = 45;
      const barWidth = width / bars;
      const maxBarHeight = height * 0.7;

      for (let i = 0; i < bars; i++) {
        const randomHeight = recording ? Math.random() * maxBarHeight : maxBarHeight * 0.1;
        const x = i * barWidth + barWidth * 0.2;
        const w = barWidth * 0.6;
        const y = (height - randomHeight) / 2;

        ctx.fillStyle = recording ? '#0EA5A0' : '#D1CFC8';
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
    <div className="bg-white border border-gray-200 rounded-xl p-5 shrink-0">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[13.5px] font-semibold text-navy">Audio Recorder</span>
        {recording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-brand animate-pulse" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--red-brand)' }}>REC</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <canvas ref={canvasRef} className="w-full h-20 bg-gray-50 rounded-lg border border-gray-100" width={500} height={80} />

        {retryAvailable ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-red-brand text-sm bg-red-brand-light border border-red-brand/10 p-3 rounded-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{transcriptionError || "Recording failed to transcribe."}</span>
            </div>
            <div className="flex gap-2.5">
              <button className="bg-teal text-navy border-none px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-teal-dark transition-colors duration-200 flex items-center justify-center" onClick={onRetry}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: '4px' }}>
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                Retry Upload
              </button>
              <button className="bg-transparent border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center" onClick={onReRecord}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: '4px' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Record Again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <button
                className={`w-12 h-12 rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  recording ? 'bg-navy text-white animate-pulse' : 'bg-red-brand text-white hover:bg-red-700 hover:scale-105'
                }`}
                onClick={recording ? onStop : onStart}
                disabled={loading}
              >
                {recording ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                )}
              </button>

              <div className="flex flex-col gap-0.5">
                <div className="font-mono text-xl font-medium text-navy">{formatTime(timer)}</div>
                <div className={`text-xs transition-colors duration-200 ${recording ? 'text-red-brand font-medium' : 'text-gray-500'}`}>
                  {recording ? 'Recording...' : loading ? 'Processing...' : 'Ready to record'}
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex justify-between bg-gray-50 rounded-lg p-3 px-4 border border-gray-100">
                <div className={`flex items-center gap-2 text-[11.5px] font-medium transition-colors duration-200 ${processingStep >= 1 ? 'text-teal-dark' : 'text-gray-400'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {processingStep > 1 ? (
                      <polyline points="20 6 9 17 4 12" />
                    ) : (
                      <circle cx="12" cy="12" r="3" />
                    )}
                  </svg>
                  <span>Transcribing</span>
                </div>
                <div className={`flex items-center gap-2 text-[11.5px] font-medium transition-colors duration-200 ${processingStep >= 2 ? 'text-teal-dark' : 'text-gray-400'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {processingStep > 2 ? (
                      <polyline points="20 6 9 17 4 12" />
                    ) : (
                      <circle cx="12" cy="12" r="3" />
                    )}
                  </svg>
                  <span>Structuring</span>
                </div>
                <div className={`flex items-center gap-2 text-[11.5px] font-medium transition-colors duration-200 ${processingStep >= 3 ? 'text-teal-dark' : 'text-gray-400'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {processingStep > 3 ? (
                      <polyline points="20 6 9 17 4 12" />
                    ) : (
                      <circle cx="12" cy="12" r="3" />
                    )}
                  </svg>
                  <span>Complete</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
