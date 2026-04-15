import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CornerBrackets } from '../components/SunIcon';
import { Lock, Loader2, CheckCircle, Star, Compass, Flame } from 'lucide-react';
import type { TeaserReading, FullReading, PersonProfile } from '../types/reading';

const SECTOR_NAMES = [
  'Identity', 'Values', 'Communication', 'Home', 'Creativity', 'Service',
  'Partnership', 'Transformation', 'Vision', 'Achievement', 'Community', 'Spirit',
];

function FullReadingPanel({ profile, label }: { profile: PersonProfile; label: string }) {
  const harmonyDisplay = Math.round(
    profile.harmony_index > 1 ? profile.harmony_index : profile.harmony_index * 100
  );

  return (
    <div className="space-y-3">
      {/* Section label */}
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#C8A14A]">{label}</p>

      {/* Western Astrology */}
      <div className="bg-[rgba(255,255,255,0.06)] rounded-sm p-4 border border-[#F4EFE6]/10">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-3.5 h-3.5 text-[#C8A14A]" />
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#C8A14A]">Western Astrology</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-[#F4EFE6]/40">Sun</p>
            <p className="text-sm text-[#F4EFE6] font-medium">{profile.sun_sign}</p>
          </div>
          <div>
            <p className="text-xs text-[#F4EFE6]/40">Moon</p>
            <p className="text-sm text-[#F4EFE6] font-medium">{profile.moon_sign}</p>
          </div>
          <div>
            <p className="text-xs text-[#F4EFE6]/40">Rising</p>
            <p className="text-sm text-[#F4EFE6] font-medium">{profile.ascendant}</p>
          </div>
        </div>
      </div>

      {/* BaZi Four Pillars */}
      <div className="bg-[rgba(255,255,255,0.06)] rounded-sm p-4 border border-[#F4EFE6]/10">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-3.5 h-3.5 text-[#C8A14A]" />
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#C8A14A]">Four Pillars · {profile.day_master}</p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {(['year', 'month', 'day', 'hour'] as const).map(pillar => {
            const p = profile.four_pillars[pillar];
            if (!p) return <div key={pillar} className="opacity-30 text-xs text-[#F4EFE6]/40">—</div>;
            return (
              <div key={pillar} className="space-y-1">
                <p className="text-[10px] text-[#F4EFE6]/40 uppercase">{pillar}</p>
                <p className="text-sm text-[#F4EFE6] font-medium">{p.stamm}</p>
                <p className="text-xs text-[#F4EFE6]/60">{p.zweig}</p>
                {pillar === 'year' && 'tier' in p && (
                  <p className="text-xs text-[#C8A14A]">{(p as { tier: string }).tier}</p>
                )}
                <p className="text-[10px] text-[#F4EFE6]/30">{p.element}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wu-Xing Element Balance */}
      <div className="bg-[rgba(255,255,255,0.06)] rounded-sm p-4 border border-[#F4EFE6]/10">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-3.5 h-3.5 text-[#C8A14A]" />
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#C8A14A]">Wu-Xing Balance</p>
        </div>
        {Object.entries(profile.element_balance).map(([el, val]) => (
          <div key={el} className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-[#F4EFE6]/60 w-12 capitalize">{el}</span>
            <div className="flex-1 h-2 bg-[#F4EFE6]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#C8A14A] to-[#D4B76A] rounded-full transition-all duration-500"
                style={{ width: `${Math.round(val * 100)}%` }}
              />
            </div>
            <span className="text-xs text-[#F4EFE6]/40 w-10 text-right">{Math.round(val * 100)}%</span>
          </div>
        ))}
      </div>

      {/* Soulprint Sectors */}
      {profile.soulprint_sectors.length > 0 && (
        <div className="bg-[rgba(255,255,255,0.06)] rounded-sm p-4 border border-[#F4EFE6]/10">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#C8A14A] mb-3">Soulprint Sectors</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
            {profile.soulprint_sectors.map((val, i) => {
              const pct = Math.round(val * 100);
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[10px] text-[#F4EFE6]/50 truncate mr-1">{SECTOR_NAMES[i] ?? `S${i + 1}`}</span>
                  <span className="text-xs text-[#C8A14A] font-medium">{pct}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Harmony Index */}
      <div className="flex items-center justify-between bg-[rgba(255,255,255,0.04)] rounded-sm px-4 py-3 border border-[#F4EFE6]/10">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-[#F4EFE6]/40">Harmony Index</span>
        <span className="text-2xl text-[#C8A14A] font-light">{harmonyDisplay}</span>
      </div>
    </div>
  );
}

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
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
              <div className="flex items-center gap-2 text-[#C8A14A] mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Reading unlocked</span>
              </div>

              <FullReadingPanel profile={fullReading.subject} label="Your Portrait" />

              {fullReading.partner && (
                <FullReadingPanel profile={fullReading.partner} label="Partner's Portrait" />
              )}
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
