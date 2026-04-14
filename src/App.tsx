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

import type { ReadingResponse } from './types/reading';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [selectedPath, setSelectedPath] = useState<'character' | 'partnership' | null>(null);
  const [readingResponse, setReadingResponse] = useState<ReadingResponse | null>(null);

  const mainRef = useRef<HTMLElement>(null);
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);

  const handleReadingReady = useCallback((response: ReadingResponse) => {
    setReadingResponse(response);
  }, []);

  const handleUnlock = useCallback((readingHash: string) => {
    // Phase 3: will call POST /api/checkout with readingHash
    // For now, alert so the feature is clearly gated
    alert(`Checkout coming in Phase 3 — reading hash: ${readingHash}`);
  }, []);

  const handleSelectPath = useCallback((path: 'character' | 'partnership') => {
    setSelectedPath(path);

    setTimeout(() => {
      document.getElementById('input-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const handleBegin = useCallback(() => {
    document.getElementById('paths-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleRestart = useCallback(() => {
    setSelectedPath(null);
    setReadingResponse(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigate = useCallback((section: string) => {
    const sectionMap: Record<string, string> = {
      hero: 'hero-section',
      readings: 'paths-section',
      method: 'how-it-works-section',
      about: 'closing-section',
    };
    document.getElementById(sectionMap[section])?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Global scroll snap for pinned sections
  useEffect(() => {
    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      const snapTrigger = ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            const inPinned = pinnedRanges.some(
              r => value >= r.start - 0.02 && value <= r.end + 0.02
            );
            if (!inPinned) return value;

            return pinnedRanges.reduce((closest, r) =>
              Math.abs(r.center - value) < Math.abs(closest - value) ? r.center : closest,
              pinnedRanges[0]?.center ?? 0
            );
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
            onReadingReady={handleReadingReady}
          />
        </div>

        {/* Section 4: The Reveal - pin: true */}
        <div id="reveal-section">
          <RevealSection
            teaser={readingResponse?.teaser ?? null}
            readingHash={readingResponse?.reading_hash ?? null}
            onUnlock={handleUnlock}
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
