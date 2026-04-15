import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CornerBrackets } from '../components/SunIcon';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import type { TeaserReading, FullReading } from '../types/reading';

gsap.registerPlugin(ScrollTrigger);

interface RevealSectionProps {
  teaser: TeaserReading | null;
  readingHash: string | null;
  fullReading: FullReading | null;
  onUnlock: (readingHash: string) => void;
  checkoutLoading: boolean;
  unlockError: string | null;
}

export const RevealSection: React.FC<RevealSectionProps> = ({
  teaser,
  readingHash,
  fullReading,
  onUnlock,
  checkoutLoading,
  unlockError,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        }
      });

      scrollTl
        .fromTo(cardRef.current,
          { x: '-60vw', rotation: -3, opacity: 0 },
          { x: 0, rotation: 0, opacity: 1, ease: 'none' },
          0.06
        )
        .fromTo(panelRef.current,
          { x: '40vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0.10
        )
        .fromTo(titleRef.current,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.16
        )
        .fromTo(indexRef.current,
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, ease: 'none' },
          0.20
        );

      scrollTl
        .to(cardRef.current,
          { y: '-16vh', opacity: 0, ease: 'power2.in' },
          0.70
        )
        .to(panelRef.current,
          { y: '-10vh', opacity: 0, ease: 'power2.in' },
          0.72
        );

    }, section);

    return () => ctx.revert();
  }, []);

  // Empty state — no teaser yet
  if (!teaser && !fullReading) {
    return (
      <section
        ref={sectionRef}
        className="relative w-screen h-screen bg-[#0B0F17] star-field grain-overlay overflow-hidden z-40"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[#F4EFE6]/60 text-lg">Enter your birth details to see your portrait</p>
        </div>
      </section>
    );
  }

  const isUnlocked = fullReading !== null;
  const subject = isUnlocked ? fullReading.subject : teaser!.subject;

  return (
    <section
      ref={sectionRef}
      className="relative w-screen h-screen bg-[#0B0F17] star-field grain-overlay overflow-hidden z-40"
    >
      {/* Left Portrait Card */}
      <div
        ref={cardRef}
        className="absolute left-[5vw] md:left-[10vw] top-1/2 -translate-y-1/2 w-[90vw] md:w-[34vw] max-w-[480px]"
      >
        <CornerBrackets className="bg-[rgba(244,239,230,0.92)] rounded-sm overflow-hidden">
          <div className="h-[160px] md:h-[32%] overflow-hidden">
            <img
              src="/cosmic_portrait.png"
              alt="Your cosmic portrait"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-4">
              <h4 className="text-lg font-medium text-[#14181F]">{subject.sun_sign}</h4>
              <p className="text-xs text-[#6D6A61]">Sun Sign</p>
            </div>

            <div className="border-t border-[#E5DDD1] pt-4 space-y-3">
              {isUnlocked ? (
                <>
                  <div className="flex justify-between">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">Moon Sign</p>
                      <p className="text-[#14181F]">{fullReading.subject.moon_sign}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">Ascendant</p>
                      <p className="text-[#14181F]">{fullReading.subject.ascendant}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">Day Master</p>
                    <p className="text-[#14181F]">{fullReading.subject.day_master}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">Chinese Year</p>
                    <p className="text-[#14181F]">{fullReading.subject.chinese_year_animal}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">Chinese Astrology</p>
                    <p className="text-[#14181F]">{teaser!.subject.chinese_year_animal}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">Ascendant</p>
                    <p className="text-[#14181F]">{teaser!.subject.ascendant}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">Element</p>
                    <p className="text-[#14181F]">{teaser!.subject.element_summary}</p>
                  </div>
                </>
              )}
            </div>

            {!isUnlocked && teaser!.mode === 'partnership' && teaser!.partner && (
              <div className="mt-4 pt-4 border-t border-[#E5DDD1]">
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61] mb-2">Partner</p>
                <p className="text-[#14181F]">{teaser!.partner.sun_sign} · {teaser!.partner.chinese_year_animal}</p>
              </div>
            )}
          </div>
        </CornerBrackets>
      </div>

      {/* Right Reading Panel */}
      <div
        ref={panelRef}
        className="absolute left-[5vw] md:left-[52vw] top-[55%] md:top-1/2 -translate-y-1/2 w-[90vw] md:w-[38vw] max-w-[520px]"
      >
        <div ref={titleRef}>
          <h2 className="text-[clamp(28px,3.5vw,48px)] leading-[1.0] text-[#F4EFE6] mb-2">
            Your Cosmic Portrait
          </h2>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#C8A14A] mb-6">
            {isUnlocked ? 'Full Reading' : 'Preview'}
          </p>
        </div>

        <div ref={indexRef}>
          {isUnlocked ? (
            // Full reading content (TASK-spa-full-reading-display will expand this)
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#C8A14A] mb-4">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Reading unlocked</span>
              </div>

              {/* Four Pillars */}
              <div className="bg-[rgba(255,255,255,0.06)] rounded-sm p-4 border border-[#F4EFE6]/10">
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#C8A14A] mb-3">Four Pillars</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {(['year', 'month', 'day', 'hour'] as const).map(pillar => {
                    const p = fullReading.subject.four_pillars[pillar];
                    if (!p) return null;
                    return (
                      <div key={pillar} className="space-y-1">
                        <p className="text-xs text-[#F4EFE6]/40 capitalize">{pillar}</p>
                        <p className="text-sm text-[#F4EFE6]">{p.stamm}</p>
                        <p className="text-xs text-[#F4EFE6]/60">{p.zweig}</p>
                        {pillar === 'year' && 'tier' in p && <p className="text-xs text-[#C8A14A]">{(p as { tier: string }).tier}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Element Balance */}
              <div className="bg-[rgba(255,255,255,0.06)] rounded-sm p-4 border border-[#F4EFE6]/10">
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#C8A14A] mb-3">Wu-Xing Balance</p>
                {Object.entries(fullReading.subject.element_balance).map(([el, val]) => (
                  <div key={el} className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[#F4EFE6]/60 w-12 capitalize">{el}</span>
                    <div className="flex-1 h-2 bg-[#F4EFE6]/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C8A14A] rounded-full"
                        style={{ width: `${Math.round(val * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#F4EFE6]/40 w-8 text-right">{Math.round(val * 100)}%</span>
                  </div>
                ))}
              </div>

              {/* Harmony Index */}
              <div className="text-center py-2">
                <p className="text-xs text-[#F4EFE6]/40">Harmony Index</p>
                <p className="text-3xl text-[#C8A14A] font-light">
                  {Math.round(fullReading.subject.harmony_index > 1 ? fullReading.subject.harmony_index : fullReading.subject.harmony_index * 100)}
                </p>
              </div>
            </div>
          ) : (
            // Teaser + paywall
            <>
              <p className="text-base md:text-lg text-[#F4EFE6]/80 leading-relaxed mb-8 max-w-md">
                {teaser!.subject.preview_text}
              </p>

              {unlockError && (
                <p className="text-sm text-red-400 mb-4">{unlockError}</p>
              )}

              <div className="bg-[rgba(255,255,255,0.06)] rounded-sm p-6 border border-[#F4EFE6]/10">
                <p className="text-sm text-[#F4EFE6]/60 mb-4">
                  Your full reading includes the complete Four Pillars analysis, Wu-Xing balance, and your harmony index.
                </p>
                <button
                  onClick={() => readingHash && onUnlock(readingHash)}
                  disabled={!readingHash || checkoutLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#C8A14A] text-[#0B0F17] rounded-sm text-sm font-medium hover:bg-[#D4B76A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting to checkout…
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Unlock full reading
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
