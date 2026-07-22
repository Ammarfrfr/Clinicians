import React from 'react';

export function Navbar({ onNavigate }) {
  return (
    <div className="w-full bg-[#fafafc] border-b border-slate-100 sticky top-0 z-50 backdrop-blur-md bg-[#fafafc]/95">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center w-full">
        <div className="flex items-center select-none cursor-pointer gap-2" onClick={() => onNavigate('/')}>
          <span className="font-sans text-lg sm:text-2xl font-black tracking-tighter text-slate-900 uppercase">Scribologist</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            className="px-2.5 sm:px-5 py-1.5 sm:py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-[11px] sm:text-xs rounded-md sm:rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
            onClick={() => onNavigate('login')}
          >
            Sign In <span className="text-[9px] sm:text-[10px]">✦</span>
          </button>
          <button
            className="px-3 sm:px-5 py-1.5 sm:py-2 bg-[#22252a] hover:bg-[#1a1c20] text-white font-semibold text-[11px] sm:text-xs rounded-md sm:rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer border-none whitespace-nowrap"
            onClick={() => onNavigate('book-demo')}
          >
            Book a demo <span className="text-[9px] sm:text-[10px] text-slate-400">✦</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
