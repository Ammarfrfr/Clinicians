import React, { useEffect, useRef } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';

export function BookDemoBanner({ onNavigate }) {
  const canvasRef = useRef(null);

  // Dynamic interactive canvas effect (Scattered Particle Field across full background)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth || 1200);
    let height = (canvas.height = canvas.offsetHeight || 500);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    const numParticles = 140;
    const particles = [];
    const mouse = { x: width / 2, y: height / 2, radius: 160, active: false };

    // Scatter particles randomly across the entire width and height of the banner
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.6 + 0.8,
        opacity: Math.random() * 0.65 + 0.25,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        color: Math.random() > 0.4 ? '#60a5fa' : Math.random() > 0.5 ? '#93c5fd' : '#3b82f6',
      });
    }

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;
    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Render scattered blue particles across the full banner area
      particles.forEach((p, idx) => {
        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Bounce gently at borders
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        let renderX = p.x;
        let renderY = p.y;

        // Interactive mouse push effect
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            renderX += (dx / dist) * force * 25;
            renderY += (dy / dist) * force * 25;
          }
        }

        const currentOpacity = Math.max(0.1, p.opacity + Math.sin(time * 3 + idx) * 0.2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentOpacity;
        ctx.beginPath();
        ctx.arc(renderX, renderY, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby scattered particles with delicate constellation lines
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.hypot(renderX - p2.x, renderY - p2.y);

          if (dist2 < 75) {
            ctx.strokeStyle = '#60a5fa';
            ctx.globalAlpha = (1 - dist2 / 75) * 0.15 * currentOpacity;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(renderX, renderY);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section className="w-full max-w-[96%] xl:max-w-[1440px] mx-auto px-2 sm:px-4 my-14 md:my-24 relative z-20">
      {/* Expansive Pitch-Black Banner Container */}
      <div className="relative bg-[#050508] border border-slate-800/80 rounded-[32px] sm:rounded-[44px] overflow-hidden shadow-2xl p-10 sm:p-14 lg:p-16 flex flex-col items-start justify-center min-h-[440px] sm:min-h-[500px]">
        
        {/* Full-Card Background Interactive Scattered Particle Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair z-0"
        />

        {/* Ambient Glow Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/12 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-indigo-600/12 rounded-full blur-3xl pointer-events-none z-0" />

        {/* Content Column (Sitting over full background particle field) */}
        <div className="relative z-10 max-w-2xl text-left flex flex-col items-start gap-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold text-white tracking-tight leading-[1.12]">
            Try Scribologist now
          </h2>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal max-w-xl">
            See how Scribologist transcribes clinical consultations, generates structured notes, and saves 2+ hours daily for doctors and medical clinics.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate && onNavigate('book-demo')}
              className="px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm sm:text-base rounded-full shadow-xl hover:scale-105 transition-all cursor-pointer border-none flex items-center gap-2.5 group"
            >
              <Calendar className="w-4 h-4 text-slate-900" />
              <span>Book a Demo</span>
              <ArrowRight className="w-4 h-4 text-slate-900 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
