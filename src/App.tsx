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

import type { ReadingResponse, FullReading } from './types/reading';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [selectedPath, setSelectedPath] = useState<'character' | 'partnership' | null>(null);
  const [readingResponse, setReadingResponse] = useState<ReadingResponse | null>(null);
  const [fullReading, setFullReading] = useState<FullReading | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const mainRef = useRef<HTMLElement>(null);
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);

  // On page load: check for ?session_id= from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) return;

    // Clean the URL without reloading
    window.history.replaceState({}, '', '/');

    // Call unlock endpoint
    (async () => {
      try {
        const res = await fetch(`/api/reading/unlock?session_id=${encodeURIComponent(sessionId)}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unlock failed' }));
          setUnlockError((err as { error?: string }).error ?? 'Could not unlock reading');
          return;
        }
        const data = await res.json() as { full_reading: FullReading };
        setFullReading(data.full_reading);

        // Scroll to reveal section to show the full reading
        setTimeout(() => {
          document.getElementById('reveal-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } catch {
        setUnlockError('Network error — could not unlock reading');
      }
    })();
  }, []);

  const handleReadingReady = useCallback((response: ReadingResponse) => {
    setReadingResponse(response);
    setFullReading(null);
    setUnlockError(null);
  }, []);

  const handleUnlock = useCallback(async (readingHash: string) => {
    setCheckoutLoading(true);
    setUnlockError(null);

    try {
      const locale = navigator.language.startsWith('de') ? 'de' : 'en';
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reading_hash: readingHash, locale }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Checkout failed' }));
        setUnlockError((err as { error?: string }).error ?? 'Could not start checkout');
        return;
      }

      const data = await res.json() as { checkout_url: string };
      // Redirect to Stripe Checkout — user returns via success_url with ?session_id=
      window.location.href = data.checkout_url;
    } catch {
      setUnlockError('Network error — please try again');
    } finally {
      setCheckoutLoading(false);
    }
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
    setFullReading(null);
    setUnlockError(null);
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
        <div id="hero-section">
          <HeroSection onBegin={handleBegin} />
        </div>

        <div id="paths-section">
          <TwoPathsSection onSelectPath={handleSelectPath} />
        </div>

        <div id="input-section">
          <InputSection
            pathType={selectedPath}
            onReadingReady={handleReadingReady}
          />
        </div>

        <div id="reveal-section">
          <RevealSection
            teaser={readingResponse?.teaser ?? null}
            readingHash={readingResponse?.reading_hash ?? null}
            fullReading={fullReading}
            onUnlock={handleUnlock}
            checkoutLoading={checkoutLoading}
            unlockError={unlockError}
          />
        </div>

        <div id="how-it-works-section">
          <HowItWorksSection />
        </div>

        <div id="sample-readings-section">
          <SampleReadingsSection />
        </div>

        <div id="closing-section">
          <ClosingSection onRestart={handleRestart} />
        </div>
      </main>
    </div>
  );
}

export default App;
