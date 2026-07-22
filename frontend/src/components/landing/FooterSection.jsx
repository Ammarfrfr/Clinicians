import React from 'react';

export function FooterSection({ onNavigate }) {
  return (
    <footer className="bg-[#fafafc] border-t border-blue-900/10 pt-16 pb-0 flex flex-col gap-8 w-full text-slate-800 relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between items-start gap-8 md:gap-4 px-6 mb-4">

        {/* Left brand tagline */}
        <div className="text-left md:max-w-xs">
          <h3 className="text-2xl md:text-[28px] font-sans font-bold tracking-tight text-[#22252a] leading-tight">
            Elevate Clinical<br />Experience
          </h3>
        </div>

        {/* Right link columns */}
        <div className="flex gap-16 md:gap-24 text-left">
          <div className="flex flex-col gap-3">
            <a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }} className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">About Us</a>
            <a href="#product" className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Product</a>
            <a href="#docs" className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Docs</a>
            <a href="#press" onClick={(e) => { e.preventDefault(); onNavigate('press'); }} className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Press</a>
            <a href="#book-demo" onClick={(e) => { e.preventDefault(); onNavigate('book-demo'); }} className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Book a Demo</a>
          </div>

          <div className="flex flex-col gap-3">
            <a href="#privacy" onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }} className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Privacy Policy</a>
            <a href="#terms" onClick={(e) => { e.preventDefault(); onNavigate('terms'); }} className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Terms of Service</a>
            <a href="#usecases" className="text-[13px] font-bold text-slate-700 hover:text-slate-950 transition-colors no-underline">Use Cases</a>
          </div>
        </div>
      </div>

      {/* Giant footer brand text matching the screenshot */}
      <div className="w-full text-center relative select-none pointer-events-none mt-auto z-10">
        <h1 className="text-[12vw] font-sans font-black tracking-tighter text-[#1f2229] leading-none select-none">
          Scribologist
        </h1>
      </div>

      {/* Copyright & Meta (Moved below Scribologist) */}
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center pb-6 text-center gap-3 px-6 z-20">
        <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2.5 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono select-none">
          <span>© 2026 SCRIBOLOGIST</span>
          <span className="text-slate-200">•</span>
          <a href="mailto:hello@scribologist.ai" className="hover:text-slate-900 transition-colors no-underline">HELLO@SCRIBOLOGIST.AI</a>
          <span className="text-slate-200">•</span>
          <span>BUILT IN INDIA</span>
        </div>
        <p className="text-[9.5px] text-slate-400 leading-relaxed max-w-3xl mx-auto mt-2 text-center uppercase tracking-wide">
          Disclaimer: Scribologist is an AI-assisted documentation scribe. Registered clinicians retain sole responsibility to review and approve all prescriptions, treatment plans, and diagnostic notes prior to printing or sending.
        </p>
      </div>

      {/* Halftone / Dither Mountain Landscape (Blue theme matching new design) */}
      <div className="w-full mt-4 select-none pointer-events-none text-blue-600">
        <svg className="w-full h-auto max-h-[360px]" viewBox="0 0 1600 240" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-pattern-light" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="#2563eb" opacity="0.22" />
            </pattern>
            <pattern id="dot-pattern-medium" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.1" fill="#2563eb" opacity="0.48" />
            </pattern>
            <pattern id="dot-pattern-dark" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.6" fill="#2563eb" opacity="0.82" />
            </pattern>
          </defs>

          {/* Sky Contour Waves */}
          <path d="M -50 40 Q 400 120 800 60 T 1650 80 L 1650 240 L -50 240 Z" fill="url(#dot-pattern-light)" opacity="0.25" />
          <path d="M -50 70 Q 400 140 800 90 T 1650 110 L 1650 240 L -50 240 Z" fill="url(#dot-pattern-light)" opacity="0.4" />

          {/* Animated Wind Lines (Wispy curves with dash offset animation) */}
          <g>
            <path
              className="wind-line"
              d="M -100 45 Q 350 15 800 55 T 1700 25"
              stroke="#2563eb"
              strokeWidth="1"
              fill="none"
              opacity="0.08"
              style={{ animationDuration: '14s', animationDelay: '0s' }}
            />
            <path
              className="wind-line"
              d="M -50 80 Q 400 100 850 65 T 1750 85"
              stroke="#2563eb"
              strokeWidth="1.2"
              fill="none"
              opacity="0.06"
              style={{ animationDuration: '18s', animationDelay: '-4s' }}
            />
            <path
              className="wind-line"
              d="M 150 25 Q 600 55 1050 30 T 1850 50"
              stroke="#2563eb"
              strokeWidth="0.8"
              fill="none"
              opacity="0.07"
              style={{ animationDuration: '16s', animationDelay: '-8s' }}
            />
          </g>

          {/* Flock of Birds (20 birds flying left-to-right spread over 1600 width) */}
          {(() => {
            const birds = [
              { x: 450, y: 112, s: 0.8 }, { x: 490, y: 100, s: 0.9 }, { x: 530, y: 125, s: 0.75 },
              { x: 550, y: 115, s: 1.1 }, { x: 590, y: 108, s: 1.0 }, { x: 630, y: 122, s: 0.95 },
              { x: 670, y: 95, s: 1.2 }, { x: 710, y: 78, s: 1.3 }, { x: 750, y: 105, s: 0.85 },
              { x: 790, y: 118, s: 1.1 }, { x: 830, y: 125, s: 1.05 }, { x: 690, y: 118, s: 0.8 },
              { x: 730, y: 128, s: 0.9 }, { x: 770, y: 132, s: 0.75 }, { x: 810, y: 142, s: 0.7 },
              { x: 650, y: 70, s: 1.15 }, { x: 690, y: 85, s: 1.0 }, { x: 820, y: 68, s: 1.25 },
              { x: 920, y: 80, s: 0.9 }, { x: 960, y: 95, s: 1.1 }
            ];
            return birds.map((b, i) => {
              const pathDown = `M ${b.x} ${b.y} Q ${b.x + 6 * b.s} ${b.y - 6 * b.s} ${b.x + 12 * b.s} ${b.y} Q ${b.x + 18 * b.s} ${b.y - 6 * b.s} ${b.x + 24 * b.s} ${b.y}`;
              const pathUp = `M ${b.x} ${b.y - 4 * b.s} Q ${b.x + 6 * b.s} ${b.y - 1 * b.s} ${b.x + 12 * b.s} ${b.y} Q ${b.x + 18 * b.s} ${b.y - 1 * b.s} ${b.x + 24 * b.s} ${b.y - 4 * b.s}`;
              return (
                <path
                  key={i}
                  d={pathDown}
                  stroke="#2563eb"
                  strokeWidth="1.2"
                  fill="none"
                  opacity="0.55"
                >
                  <animate
                    attributeName="d"
                    dur="1.4s"
                    repeatCount="indefinite"
                    values={`${pathDown}; ${pathUp}; ${pathDown}`}
                    begin={`${i * 0.15}s`}
                  />
                </path>
              );
            });
          })()}

          {/* Back Mountains (Light dot pattern) */}
          <path d="M -50 240 L -50 145 Q 350 115 800 165 T 1450 140 Q 1550 150 1650 160 L 1650 240 Z" fill="url(#dot-pattern-light)" />

          {/* Small trees on back mountains */}
          {Array.from({ length: 40 }).map((_, idx) => {
            const x = idx * 42 + 20;
            const y = 145 + (x < 800 ? (x - 20) * -0.04 : (x - 800) * 0.035);
            const scale = 0.35;
            return (
              <polygon
                key={`bg-t-${idx}`}
                points={`${x},${y} ${x - 5 * scale},${y + 12 * scale} ${x + 5 * scale},${y + 12 * scale}`}
                fill="url(#dot-pattern-light)"
              />
            );
          })}

          {/* Middle Mountains (Medium dot pattern) */}
          <path d="M -50 240 L -50 170 Q 300 135 800 180 T 1450 165 Q 1550 145 1650 165 L 1650 240 Z" fill="url(#dot-pattern-medium)" />

          {/* Flat-topped Acacia tree on the right midground hill */}
          <g opacity="0.65">
            <path d="M 1380 154 L 1380 132" stroke="#2563eb" strokeWidth="2.5" />
            <path d="M 1380 137 Q 1372 130 1368 130 M 1380 134 Q 1388 127 1392 127" stroke="#2563eb" strokeWidth="1.5" fill="none" />
            <ellipse cx="1380" cy="122" rx="22" ry="7" fill="url(#dot-pattern-medium)" />
            <ellipse cx="1372" cy="126" rx="14" ry="5" fill="url(#dot-pattern-medium)" />
            <ellipse cx="1388" cy="124" rx="16" ry="6" fill="url(#dot-pattern-medium)" />
          </g>

          {/* Front Mountains (Dark dot pattern) */}
          <path d="M -50 240 L -50 205 Q 250 185 800 215 T 1450 200 Q 1550 205 1650 215 L 1650 240 Z" fill="url(#dot-pattern-dark)" />

          {/* Dense leafy trees in foreground (previously bare winter branches) */}
          {/* Dense leafy trees in foreground (previously bare winter branches) */}
          {[320, 680, 1050, 1420].map((tx, idx) => (
            <g key={`leafy-t-${idx}`} opacity="0.85">
              {/* Root Trunk (Stays anchored in the ground) */}
              <path d={`M ${tx} 212 L ${tx} 190`} stroke="#2563eb" strokeWidth="2.5" />

              {/* Swaying canopy group (including upper trunk, branches, and leaves) */}
              <g
                className="swaying-canopy"
                style={{
                  transformOrigin: `${tx}px 190px`,
                  animationDuration: `${3.6 + idx * 0.4}s`,
                  animationDelay: `${idx * -0.7}s`
                }}
              >
                {/* Upper Trunk & Branches */}
                <path d={`M ${tx} 190 L ${tx} 175`} stroke="#2563eb" strokeWidth="2.5" />
                <path d={`M ${tx} 195 Q ${tx - 10} 185 ${tx - 16} 182`} stroke="#2563eb" strokeWidth="1.8" fill="none" />
                <path d={`M ${tx} 190 Q ${tx + 10} 180 ${tx + 18} 178`} stroke="#2563eb" strokeWidth="1.8" fill="none" />
                <path d={`M ${tx} 182 Q ${tx - 6} 168 ${tx - 10} 160`} stroke="#2563eb" strokeWidth="1.2" fill="none" />
                <path d={`M ${tx} 180 Q ${tx + 6} 170 ${tx + 10} 162`} stroke="#2563eb" strokeWidth="1.2" fill="none" />

                {/* Dense Foliage/Leaves overlay */}
                <circle cx={tx} cy="170" r="16" fill="url(#dot-pattern-dark)" />
                <circle cx={tx - 12} cy="174" r="12" fill="url(#dot-pattern-dark)" />
                <circle cx={tx + 12} cy="172" r="12" fill="url(#dot-pattern-dark)" />
                <circle cx={tx} cy="158" r="14" fill="url(#dot-pattern-dark)" />

                {/* Leaf highlights */}
                <circle cx={tx - 4} cy="162" r="6" fill="url(#dot-pattern-medium)" opacity="0.6" />
                <circle cx={tx + 4} cy="164" r="6" fill="url(#dot-pattern-medium)" opacity="0.6" />
              </g>
            </g>
          ))}

          {/* Forest Foreground Pine Trees (using dark pattern) */}
          {Array.from({ length: 60 }).map((_, idx) => {
            const x = idx * 28 - 20;
            const scale = 0.72 + (Math.sin(idx) * 0.25);
            const y = 205 + (Math.cos(idx * 2) * 8);
            return (
              <polygon
                key={`pine-t-${idx}`}
                points={`${x},${y} ${x - 8 * scale},${y + 12 * scale} ${x - 4 * scale},${y + 12 * scale} ${x - 11 * scale},${y + 24 * scale} ${x - 6 * scale},${y + 24 * scale} ${x - 14 * scale},${y + 36 * scale} ${x + 14 * scale},${y + 36 * scale} ${x + 6 * scale},${y + 24 * scale} ${x + 11 * scale},${y + 24 * scale} ${x + 4 * scale},${y + 12 * scale} ${x + 8 * scale},${y + 12 * scale}`}
                fill="url(#dot-pattern-dark)"
              />
            );
          })}
        </svg>
      </div>
    </footer>
  );
}
