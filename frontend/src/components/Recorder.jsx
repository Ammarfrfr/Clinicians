import React, { useEffect, useRef } from 'react';

export function Recorder({ recording, loading, timer, processingStep, onStart, onStop }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!recording && !loading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    let animationFrame = 0;

    const animate = () => {
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, width, height);

      // Draw waveform
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const bars = 40;
      const barWidth = width / bars;

      for (let i = 0; i < bars; i++) {
        const randomHeight = Math.random() * (height * 0.8);
        const x = i * barWidth + barWidth / 2;
        const y = height / 2;

        ctx.moveTo(x, y - randomHeight / 2);
        ctx.lineTo(x, y + randomHeight / 2);
      }

      ctx.stroke();

      animationFrame = (animationFrame + 1) % 60;
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
    <div className="recorder-container">
      <canvas ref={canvasRef} className="waveform-canvas" width={400} height={120}></canvas>
      
      <div className="recorder-controls">
        <button
          className={`record-button ${recording ? 'recording' : ''}`}
          onClick={recording ? onStop : onStart}
          disabled={loading}
        >
          {recording ? '■' : '●'}
        </button>
        
        <div className="recorder-status">
          <div className="timer">{formatTime(timer)}</div>
          <div className="status-label">
            {recording ? 'Recording...' : loading ? 'Processing...' : 'Ready'}
          </div>
        </div>
      </div>

      {loading && (
        <div className="processing-bar">
          <div className={`step ${processingStep >= 1 ? 'active' : ''}`}>
            {processingStep > 1 ? '✓' : '1'}
            <span>Transcribing</span>
          </div>
          <div className={`step ${processingStep >= 2 ? 'active' : ''}`}>
            {processingStep > 2 ? '✓' : '2'}
            <span>Structuring</span>
          </div>
          <div className={`step ${processingStep >= 3 ? 'active' : ''}`}>
            {processingStep > 3 ? '✓' : '3'}
            <span>Complete</span>
          </div>
        </div>
      )}
    </div>
  );
}
