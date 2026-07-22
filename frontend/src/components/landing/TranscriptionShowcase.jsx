import React, { useRef, useEffect, useState } from 'react';

const conversationLines = [
  {
    speaker: 'Doctor',
    text: 'Good morning, please have a seat. What brings you in today?',
    lang: 'English',
  },
  {
    speaker: 'Patient',
    text: "Doctor, I've been having severe chest pain for 2 days, especially at night.",
    lang: 'English',
  },
  {
    speaker: 'Doctor',
    text: 'Tame bataavi shaksho ke dukhāvo barābar kyā thāy chhe? Śvās levāthī vadhe chhe?',
    lang: 'Gujarati',
  },
  {
    speaker: 'Patient',
    text: 'Haa, daabee taraf. Ane jyaare hoo deep breath lau chhu tyaare vadhu dukhe chhe.',
    lang: 'Gujarati',
  },
  {
    speaker: 'Doctor',
    text: 'Kya aapke parivaar mein kisi ko dil ki bimari ka itihas hai? Koi dawai le rahe hain?',
    lang: 'Hindi',
  },
  {
    speaker: 'Patient',
    text: 'Ji doctor sahab, mere pitaji ko 50 ki umar mein heart attack aaya tha. Main BP ki dawai le raha hoon.',
    lang: 'Hindi',
  },
  {
    speaker: 'Doctor',
    text: "Main aapka ECG aur Chest X-ray order kar raha hoon. Let's also check your troponin levels.",
    lang: 'Hinglish',
  },
  {
    speaker: 'Patient',
    text: 'Okay doctor, please test kar lijiye. Mujhe kafi tension ho rahi hai.',
    lang: 'Hinglish',
  },
];

const soapSections = [
  {
    title: 'Chief Complaint',
    content: 'Severe left-sided chest pain for 2 days, worsening at night and with deep inspiration.',
  },
  {
    title: 'History of Present Illness',
    content: 'Left-sided, pleuritic chest pain. Family history: MI in father at age 50. Currently on antihypertensive medication.',
  },
  {
    title: 'Physical Examination',
    content: 'ECG ordered. Chest X-ray ordered. Troponin levels to be checked. Vitals pending.',
  },
  {
    title: 'Assessment & Plan',
    content: 'R/O acute coronary syndrome vs pleuritic chest pain. Stat ECG, CXR, Troponin-I. Cardiology consult if troponin elevated.',
  },
];

export function TranscriptionShowcase() {
  const sectionRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoveredLine, setHoveredLine] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = rect.height;
      const offsetTop = -rect.top;
      const viewportHeight = window.innerHeight;
      const totalScrollable = sectionHeight - viewportHeight;

      if (totalScrollable <= 0) return;
      const progress = Math.max(0, Math.min(1, offsetTop / totalScrollable));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalLines = conversationLines.length;
  const convStart = 0.10;
  const convEnd = 0.58;
  const lineStep = (convEnd - convStart) / totalLines;

  const titleProgress = scrollProgress < 0.08 ? 0 : Math.min(1, (scrollProgress - 0.08) / 0.06);
  const titleOpacity = 1 - titleProgress;
  const titleTranslateY = -titleProgress * 60;

  const activeLineFloat = (scrollProgress - convStart) / lineStep;
  const lineBlockHeight = 110;
  const convTranslateY = -activeLineFloat * lineBlockHeight;

  const convFadeStart = 0.56;
  const convOpacity = scrollProgress < convFadeStart ? 1 : Math.max(0, 1 - (scrollProgress - convFadeStart) / 0.06);

  const lineDrawStart = 0.60;
  const lineDrawEnd = 0.72;
  const lineDrawProgress = Math.max(0, Math.min(1, (scrollProgress - lineDrawStart) / (lineDrawEnd - lineDrawStart)));
  const showLine = scrollProgress >= 0.58;

  const soapStart = 0.72;
  const soapSpan = (1.0 - soapStart) / soapSections.length;
  const showSoap = scrollProgress >= 0.68;

  return (
    <section
      ref={sectionRef}
      className="relative w-full z-10 bg-[#fafafc]"
      style={{ height: '500vh' }}
    >
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* TITLE */}
        <div
          className="absolute left-1/2 w-full max-w-3xl text-center z-20 px-6"
          style={{
            top: '15vh',
            transform: `translateX(-50%) translateY(${titleTranslateY}px)`,
            opacity: titleOpacity,
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            pointerEvents: titleOpacity < 0.1 ? 'none' : 'auto',
          }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-serif text-[#22252a] leading-[1.1] tracking-tight">
            See How AI Scribe
            <br />
            Transcribes in Real Time
          </h2>
          <p className="mt-4 text-sm text-slate-400 font-sans font-medium tracking-wide uppercase">
            Multilingual · Ambient · Instant Documentation
          </p>
        </div>

        {/* CONVERSATION LYRICS */}
        <div
          className="relative w-full max-w-2xl px-6"
          style={{
            height: '60vh',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 55%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 55%, transparent 100%)',
            opacity: convOpacity,
            transition: 'opacity 0.3s ease',
            pointerEvents: convOpacity < 0.05 ? 'none' : 'auto',
          }}
        >
          <div
            className="flex flex-col will-change-transform"
            style={{
              transform: `translateY(calc(28vh + ${convTranslateY}px))`,
              transition: 'transform 0.12s cubic-bezier(0.22, 0.68, 0.36, 1)',
            }}
          >
            {conversationLines.map((line, idx) => {
              const dist = Math.abs(idx - activeLineFloat);
              const isActive = dist < 0.55;
              const isFuture = idx > activeLineFloat;
              const isHovered = hoveredLine === idx;

              let opacity, blur;
              if (isActive || isHovered) {
                opacity = 1;
                blur = 0;
              } else if (isFuture) {
                const f = Math.min(1, dist / 2.2);
                opacity = Math.max(0.04, 0.2 - f * 0.16);
                blur = Math.min(8, 3 + f * 5);
              } else {
                const f = Math.min(1, dist / 1.8);
                opacity = Math.max(0.12, 0.55 - f * 0.43);
                blur = Math.min(3, f * 3);
              }

              const isDoctor = line.speaker === 'Doctor';
              const flagIcon = line.lang === 'English' ? '🇬🇧' : line.lang === 'Gujarati' ? '🇮🇳' : line.lang === 'Hindi' ? '🇮🇳' : '🗣️';

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredLine(idx)}
                  onMouseLeave={() => setHoveredLine(null)}
                  onClick={() => setHoveredLine(hoveredLine === idx ? null : idx)}
                  className="group cursor-pointer relative"
                  style={{
                    display: 'flex',
                    justifyContent: isDoctor ? 'flex-start' : 'flex-end',
                    minHeight: `${lineBlockHeight}px`,
                    alignItems: 'center',
                    padding: '6px 0',
                  }}
                >
                  <div
                    className="relative"
                    style={{
                      opacity,
                      filter: `blur(${blur}px)`,
                      transform: `scale(${isActive || isHovered ? 1.02 : 0.96})`,
                      transition: 'all 0.35s cubic-bezier(0.22, 0.68, 0.36, 1)',
                      textAlign: isDoctor ? 'left' : 'right',
                      maxWidth: '82%',
                    }}
                  >
                    {/* Floating Circular Language Badge on Hover/Active */}
                    <div
                      className={`absolute -top-3 ${isDoctor ? '-right-10' : '-left-10'} w-9 h-9 rounded-full bg-white border border-slate-200/90 shadow-lg flex items-center justify-center text-sm transition-all duration-300 pointer-events-none ${
                        isHovered || isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                      }`}
                    >
                      <span className="text-base" title={line.lang}>{flagIcon}</span>
                    </div>

                    {/* Speaker label */}
                    <span
                      className="font-bold uppercase flex items-center gap-1.5 mb-1"
                      style={{
                        fontSize: '11px',
                        letterSpacing: '0.14em',
                        color: isDoctor ? '#475569' : '#94a3b8',
                        justifyContent: isDoctor ? 'flex-start' : 'flex-end',
                      }}
                    >
                      {line.speaker}
                      <span
                        style={{
                          marginLeft: '6px',
                          fontSize: '9px',
                          letterSpacing: '0.04em',
                          textTransform: 'none',
                          fontWeight: 600,
                          color: '#475569',
                          background: '#f1f5f9',
                          padding: '2px 7px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <span>{flagIcon}</span> {line.lang}
                      </span>
                    </span>
                    {/* Dialogue text */}
                    <p
                      className="font-sans font-bold leading-snug tracking-tight"
                      style={{
                        fontSize: 'clamp(17px, 2.4vw, 28px)',
                        color: '#22252a',
                        margin: 0,
                      }}
                    >
                      {line.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* VERTICAL LINE + SOAP CARD */}
        {showLine && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 z-30"
            style={{
              opacity: Math.min(1, (scrollProgress - 0.58) / 0.06),
              transition: 'opacity 0.25s ease',
            }}
          >
            <div className="flex flex-col items-center" style={{ marginBottom: showSoap ? '16px' : '0' }}>
              <div
                className="relative overflow-hidden"
                style={{ width: '2px', height: '70px', background: '#e2e8f0', borderRadius: '1px' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${lineDrawProgress * 100}%`,
                    background: '#22252a',
                    transition: 'height 0.15s ease-out',
                  }}
                />
              </div>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  border: '2px solid #22252a',
                  background: '#fff',
                  marginTop: '-1px',
                  opacity: lineDrawProgress > 0.85 ? 1 : 0,
                  transform: `scale(${lineDrawProgress > 0.85 ? 1 : 0.15})`,
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
            </div>

            {showSoap && (
              <div
                className="select-none"
                style={{
                  width: '100%',
                  maxWidth: '340px',
                  background: '#fff',
                  border: '1px solid rgba(226,232,240,0.8)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  textAlign: 'left',
                  opacity: Math.min(1, (scrollProgress - 0.70) / 0.06),
                  transform: `translateY(${Math.max(0, 30 - Math.min(1, (scrollProgress - 0.70) / 0.06) * 30)}px)`,
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, #ffe4e6, #f43f5e 50%, #be123c 85%, #4c0519)',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#1e293b',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.2,
                      }}
                    >
                      AI Generated Note
                    </span>
                    <span
                      style={{
                        fontSize: '8px',
                        fontWeight: 700,
                        color: '#94a3b8',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        marginTop: '2px',
                      }}
                    >
                      AMBIENT DOCUMENTATION
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '8px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    Generated Sections
                  </span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {soapSections.map((section, idx) => {
                      const secStart = soapStart + idx * soapSpan;
                      const secProgress = Math.max(0, Math.min(1, (scrollProgress - secStart) / soapSpan));
                      const isVisible = secProgress > 0.15;

                      return (
                        <li
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px',
                            fontSize: '10px',
                            color: isVisible ? '#475569' : '#cbd5e1',
                            transition: 'all 0.5s ease',
                            opacity: isVisible ? 1 : 0.3,
                            transform: `translateY(${isVisible ? 0 : 6}px)`,
                          }}
                        >
                          <span
                            style={{
                              color: isVisible ? '#22c55e' : '#cbd5e1',
                              fontWeight: 700,
                              flexShrink: 0,
                              transition: 'color 0.5s ease',
                            }}
                          >
                            ✓
                          </span>
                          <span>
                            <strong style={{ color: isVisible ? '#1e293b' : '#cbd5e1', transition: 'color 0.5s ease' }}>
                              {section.title}:
                            </strong>{' '}
                            {isVisible ? section.content : 'Awaiting data...'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '8px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    Languages Detected
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['English', 'Gujarati', 'Hindi', 'Hinglish'].map((lang, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '2px 8px',
                          background: '#f1f5f9',
                          borderRadius: '6px',
                          fontSize: '9px',
                          fontWeight: 600,
                          color: '#475569',
                          border: '1px solid rgba(226,232,240,0.3)',
                        }}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  style={{
                    width: '100%',
                    padding: '8px 0',
                    background: '#22252a',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    marginTop: '4px',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1a1c20'}
                  onMouseLeave={e => e.currentTarget.style.background = '#22252a'}
                >
                  Try AI Scribe ✦
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
