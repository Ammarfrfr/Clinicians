import React, { useRef, useEffect, useState } from 'react';

const metrics = [
  {
    targetVal: 1.8,
    prefix: '',
    suffix: 'h',
    decimalPlaces: 1,
    title: 'DOCTOR TIME SAVED',
  },
  {
    targetVal: 99.4,
    prefix: '',
    suffix: '%',
    decimalPlaces: 1,
    title: 'CLINICAL ACCURACY',
  },
  {
    targetVal: 4,
    prefix: '< ',
    suffix: ' Sec',
    decimalPlaces: 0,
    title: 'GENERATION SPEED',
  },
  {
    targetVal: 98,
    prefix: '',
    suffix: '%',
    decimalPlaces: 0,
    title: 'PATIENT FOCUS',
  }
];

export function ImpactMetricsSection() {
  const sectionRef = useRef(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    let animFrameId;
    let startTime = null;
    const duration = 1400; // 1.4s smooth ease-out sequence

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            // Cubic Ease-Out curve
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedProgress(eased);

            if (progress < 1) {
              animFrameId = requestAnimationFrame(animate);
            }
          };
          animFrameId = requestAnimationFrame(animate);
        } else {
          setAnimatedProgress(0);
          startTime = null;
        }
      },
      { threshold: 0.12 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      observer.disconnect();
    };
  }, []);

  const totalBars = 28;

  return (
    <section ref={sectionRef} className="w-full bg-[#fafafc] py-20 md:py-28 relative z-20 border-t border-slate-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col gap-16">
        
        {/* Title in Kalice / Instrument Serif Editorial Style */}
        <div className="text-left">
          <h2
            className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-normal text-[#22252a] tracking-tight leading-[1.04]"
            style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}
          >
            Autonomous<br />
            Impact on Clinics <span className="italic font-light text-slate-900">&amp;</span><br />
            Doctors
          </h2>
        </div>

        {/* Combined Layout: Metrics Grid + Graph Lines extending up into the text height */}
        <div className="relative w-full pt-4 min-h-[280px] sm:min-h-[340px] flex flex-col justify-between">
          
          {/* Background Graph Lines (Tallest right bars reach middle of text line) */}
          <div className="absolute inset-x-0 bottom-0 h-[280px] sm:h-[340px] pointer-events-none flex items-end justify-between px-1 z-0">
            {[...Array(totalBars)].map((_, i) => {
              // Steep exponential curve (starts low at left, curves up steeply to middle of text line at right)
              const exponentialTargetHeight = Math.pow(i / (totalBars - 1), 2.8) * 94 + 6;
              
              // Graph animation starts slightly after target value numbers begin, creating a dramatic visible wave!
              const graphProgress = Math.max(0, Math.min(1, (animatedProgress - 0.14) / 0.86));
              const currentHeight = exponentialTargetHeight * Math.pow(graphProgress, 1.15);

              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center h-full">
                  <div
                    className="w-[1.5px] bg-[#22252a]"
                    style={{
                      height: `${currentHeight}%`,
                      transition: 'height 0.08s ease-out',
                      opacity: 0.15 + (i / totalBars) * 0.85
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Foreground 4 Metric Columns (Title on Top, Target Value Below) */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 w-full divide-y sm:divide-y-0 md:divide-x divide-slate-200/80">
            {metrics.map((m, idx) => {
              // Target value count-up
              const currentValue = (m.targetVal * animatedProgress).toFixed(m.decimalPlaces);

              return (
                <div key={idx} className="flex flex-col text-left justify-start gap-2.5 px-4 sm:px-6 py-2">
                  {/* Title Above Target Value */}
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">
                    {m.title}
                  </span>

                  {/* Target Value */}
                  <div className="text-3xl sm:text-4xl lg:text-[44px] font-sans font-extrabold text-[#22252a] tracking-tight leading-none whitespace-nowrap">
                    {m.prefix}{currentValue}{m.suffix}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
