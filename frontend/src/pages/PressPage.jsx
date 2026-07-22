import React from 'react';
import { Navbar } from '../components/landing/Navbar';
import { FooterSection } from '../components/landing/FooterSection';

export function PressPage({ onNavigate }) {
  const assets = [
    {
      id: 'icon-light',
      title: 'Stethoscope Icon (Light Background)',
      desc: 'Our primary browser favicon and iOS shortcut icon.',
      bg: 'bg-slate-50 border-slate-200/90',
      svg: (
        <svg viewBox="0 0 24 24" width="80" height="80" xmlns="http://www.w3.org/2000/svg" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M11 2v2" />
          <path d="M5 2v2" />
          <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
          <path d="M8 15a6 6 0 0 0 12 0v-3" />
          <circle cx="20" cy="10" r="2" />
        </svg>
      ),
      downloadName: 'scribologist-icon-light.png',
      rawSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2v2" /><path d="M5 2v2" /><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" /><path d="M8 15a6 6 0 0 0 12 0v-3" /><circle cx="20" cy="10" r="2" /></svg>`
    },
    {
      id: 'icon-dark',
      title: 'Stethoscope Icon (Dark Background)',
      desc: 'High contrast variant for dark theme interfaces.',
      bg: 'bg-slate-950 border-slate-900',
      svg: (
        <svg viewBox="0 0 24 24" width="80" height="80" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M11 2v2" />
          <path d="M5 2v2" />
          <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
          <path d="M8 15a6 6 0 0 0 12 0v-3" />
          <circle cx="20" cy="10" r="2" />
        </svg>
      ),
      downloadName: 'scribologist-icon-dark.png',
      rawSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2v2" /><path d="M5 2v2" /><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" /><path d="M8 15a6 6 0 0 0 12 0v-3" /><circle cx="20" cy="10" r="2" /></svg>`
    },
    {
      id: 'wordmark',
      title: 'Scribologist Brand Wordmark',
      desc: 'Typographic logo in solid white text for dark backdrops.',
      bg: 'bg-slate-950 border-slate-900',
      svg: (
        <span className="font-sans text-xl sm:text-2xl font-black tracking-tighter text-white uppercase select-none">
          Scribologist
        </span>
      ),
      downloadName: 'scribologist-wordmark-white.png',
      rawSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" width="400" height="100"><text x="200" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="42" fill="#ffffff" text-anchor="middle" letter-spacing="-1.5">SCRIBOLOGIST</text></svg>`
    }
  ];

  const handleDownload = (asset) => {
    // Convert SVG to high-resolution PNG on the fly
    const svgString = asset.rawSvg;
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const isWordmark = asset.id === 'wordmark';
      const w = isWordmark ? 1200 : 1024;
      const h = isWordmark ? 300 : 1024;
      canvas.width = w;
      canvas.height = h;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = asset.downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      DOMURL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col font-sans select-none overflow-x-clip text-slate-800 antialiased text-left">
      <Navbar onNavigate={onNavigate} />

      <main className="max-w-4xl mx-auto w-full px-6 py-20 flex-1 flex flex-col gap-12">
        <div className="flex flex-col gap-4 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-serif text-[#22252a] tracking-tight leading-[1.15]">
            Scribologist Press Assets
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-sans leading-relaxed">
            Download high-resolution logos, product icons, and wordmarks verified for press kits, EHR integration profiles, and clinic websites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {assets.map((asset) => (
            <div key={asset.id} className="flex flex-col gap-4">
              <div className={`aspect-[16/10] ${asset.bg} border rounded-2xl flex items-center justify-center p-8 relative overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group`}>
                {asset.svg}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 backdrop-blur-xs flex items-center justify-center transition-all duration-300">
                  <button
                    onClick={() => handleDownload(asset)}
                    className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-md hover:scale-105 transition-all cursor-pointer border-none"
                  >
                    Download PNG
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-sans font-bold text-sm text-[#22252a]">{asset.title}</h3>
                <p className="font-sans text-xs text-slate-500 leading-relaxed">{asset.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <FooterSection onNavigate={onNavigate} />
    </div>
  );
}
