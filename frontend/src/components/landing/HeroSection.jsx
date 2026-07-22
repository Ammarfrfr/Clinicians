import React from 'react';

export function HeroSection({ onNavigate }) {
  return (
    <header className="relative w-full flex flex-col items-center justify-center text-center px-6 gap-8 z-10 max-w-4xl mx-auto snap-start snap-always" style={{ height: 'calc(100vh - 76px)' }}>
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif text-[#22252a] leading-[1.05] tracking-tight text-center max-w-3xl">
        Notes. History, Follow ups. Handled by AI that works like your best staff member
      </h1>

      <button
        className="px-8 py-4 bg-[#22252a] hover:bg-[#1a1c20] text-white font-semibold text-base rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer border-none"
        onClick={() => onNavigate('book-demo')}
      >
        Book a demo <span className="text-xs text-slate-400">✦</span>
      </button>
    </header>
  );
}
