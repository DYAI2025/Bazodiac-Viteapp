import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

import { Navigation } from './components/Navigation';
import { HeroSection } from './sections/HeroSection';
import { TwoPathsSection } from './sections/TwoPathsSection';
import { InputSection } from './sections/InputSection';
import { RevealSection } from './sections/RevealSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { SampleReadingsSection } from './sections/SampleReadingsSection';
import { ClosingSection } from './sections/ClosingSection';

import { calculateFullAstrology, type AstrologyResult } from './utils/astrology';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [selectedPath, setSelectedPath] = useState<'character' | 'partnership' | null>(null);
  const [astrologyResult, setAstrologyResult] = useState<AstrologyResult | null>(null);
  
  const mainRef = useRef<HTMLElement>(null);
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);

  // Calculate astrology and show reveal
  const handleCalculate = useCallback((
    birthDate: Date, 
    _birthTime?: string, 
    _partnerDate?: Date, 
    _partnerTime?: string
  ) => {
    const result = calculateFullAstrology(birthDate);
    setAstrologyResult(result);
    
    // Scroll to reveal section after a brief delay
    setTimeout(() => {
      const revealSection = document.getElementById('reveal-section');
      if (revealSection) {
        revealSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, []);

  // Handle path selection
  const handleSelectPath = useCallback((path: 'character' | 'partnership') => {
    setSelectedPath(path);
    
    // Scroll to input section
    setTimeout(() => {
      const inputSection = document.getElementById('input-section');
      if (inputSection) {
        inputSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, []);

  // Handle begin from hero
  const handleBegin = useCallback(() => {
    const pathsSection = document.getElementById('paths-section');
    if (pathsSection) {
      pathsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Handle restart
  const handleRestart = useCallback(() => {
    setSelectedPath(null);
    setAstrologyResult(null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((section: string) => {
    const sectionMap: Record<string, string> = {
      hero: 'hero-section',
      readings: 'paths-section',
      method: 'how-it-works-section',
      about: 'closing-section',
    };
    
    const elementId = sectionMap[section];
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  // Global scroll snap for pinned sections
  useEffect(() => {
    // Wait for all ScrollTriggers to be created
    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);
      
      const maxScroll = ScrollTrigger.maxScroll(window);
      
      if (!maxScroll || pinned.length === 0) return;

      // Build ranges and snap targets from pinned sections
      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      // Create global snap
      const snapTrigger = ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            // Check if within any pinned range (with buffer)
            const inPinned = pinnedRanges.some(
              r => value >= r.start - 0.02 && value <= r.end + 0.02
            );
            
            if (!inPinned) return value; // Flowing section: free scroll

            // Find nearest pinned center
            const target = pinnedRanges.reduce((closest, r) =>
              Math.abs(r.center - value) < Math.abs(closest - value) ? r.center : closest,
              pinnedRanges[0]?.center ?? 0
            );
            
            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        }
      });

      scrollTriggersRef.current.push(snapTrigger);
    }, 500);

    return () => {
      clearTimeout(timer);
      scrollTriggersRef.current.forEach(st => st.kill());
      scrollTriggersRef.current = [];
    };
  }, []);

  // Cleanup all ScrollTriggers on unmount
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div className="relative">
      <Navigation onNavigate={handleNavigate} />
      
      <main ref={mainRef} className="relative">
        {/* Section 1: Hero - pin: true */}
        <div id="hero-section">
          <HeroSection onBegin={handleBegin} />
        </div>

        {/* Section 2: Two Paths - pin: true */}
        <div id="paths-section">
          <TwoPathsSection onSelectPath={handleSelectPath} />
        </div>

        {/* Section 3: Input Ceremony - pin: true */}
        <div id="input-section">
          <InputSection 
            pathType={selectedPath} 
            onCalculate={handleCalculate} 
          />
        </div>

        {/* Section 4: The Reveal - pin: true */}
        <div id="reveal-section">
          <RevealSection 
            result={astrologyResult}
            onSave={() => alert('Save feature coming soon!')}
            onShare={() => alert('Share feature coming soon!')}
            onReadFull={() => alert('Full analysis coming soon!')}
          />
        </div>

        {/* Section 5: How It Works - pin: false (flowing) */}
        <div id="how-it-works-section">
          <HowItWorksSection />
        </div>

        {/* Section 6: Sample Readings - pin: false (flowing) */}
        <div id="sample-readings-section">
          <SampleReadingsSection />
        </div>

        {/* Section 7: Closing - pin: false (flowing) */}
        <div id="closing-section">
          <ClosingSection onRestart={handleRestart} />
        </div>
      </main>
    </div>
  );
}

export default App;
