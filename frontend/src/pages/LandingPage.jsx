import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { OrbitShowcase } from '../components/landing/OrbitShowcase';
import { ProductShowcase } from '../components/landing/ProductShowcase';
import { TranscriptionShowcase } from '../components/landing/TranscriptionShowcase';
import { ImpactMetricsSection } from '../components/landing/ImpactMetricsSection';
import { BookDemoBanner } from '../components/landing/BookDemoBanner';
import { FooterSection } from '../components/landing/FooterSection';

export function LandingPage({ onNavigate }) {
  const [activeOrbitAgent, setActiveOrbitAgent] = useState('receptionist');
  const [showcaseProgress, setShowcaseProgress] = useState(0);
  const [scrollRotation, setScrollRotation] = useState(0);
  const [activeTab, setActiveTab] = useState('transcribe');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const rotation = window.scrollY * 0.12;
      setScrollRotation(rotation);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update activeTab and showcaseProgress based on scroll progress of the feature showcase container
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height;
      const offsetTop = -rect.top;
      const windowHeight = window.innerHeight;
      const totalScrollable = containerHeight - windowHeight;

      if (totalScrollable <= 0) return;

      const progress = Math.max(0, Math.min(1, offsetTop / totalScrollable));
      setShowcaseProgress(progress);

      if (progress < 0.33) {
        setActiveTab('transcribe');
      } else if (progress < 0.66) {
        setActiveTab('search');
      } else {
        setActiveTab('followup');
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabClick = (tabId) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const containerTop = rect.top + scrollTop;
    const totalScrollable = rect.height - window.innerHeight;

    let targetScroll = containerTop;
    if (tabId === 'search') {
      targetScroll = containerTop + totalScrollable * 0.5;
    } else if (tabId === 'followup') {
      targetScroll = containerTop + totalScrollable;
    }

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col font-sans select-none overflow-x-clip text-slate-800 antialiased">
      <Navbar onNavigate={onNavigate} />

      <HeroSection onNavigate={onNavigate} />

      <OrbitShowcase
        scrollRotation={scrollRotation}
        activeOrbitAgent={activeOrbitAgent}
        setActiveOrbitAgent={setActiveOrbitAgent}
        onNavigate={onNavigate}
      />

      <ProductShowcase
        containerRef={containerRef}
        activeTab={activeTab}
        showcaseProgress={showcaseProgress}
        handleTabClick={handleTabClick}
        onNavigate={onNavigate}
      />

      <TranscriptionShowcase />

      <ImpactMetricsSection />

      <BookDemoBanner onNavigate={onNavigate} />

      <FooterSection onNavigate={onNavigate} />
    </div>
  );
}
