import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CornerBrackets } from '../components/SunIcon';
import { Lock } from 'lucide-react';
import type { TeaserReading } from '../types/reading';

gsap.registerPlugin(ScrollTrigger);

interface RevealSectionProps {
  teaser: TeaserReading | null;
  readingHash: string | null;
  onUnlock: (readingHash: string) => void;
}

export const RevealSection: React.FC<RevealSectionProps> = ({
  teaser,
  readingHash,
  onUnlock,
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

      // ENTRANCE (0-30%)
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

      // EXIT (70-100%)
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

  if (!teaser) {
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

  const subject = teaser.subject;

  return (
    <section
      ref={sectionRef}
      className="relative w-screen h-screen bg-[#0B0F17] star-field grain-overlay overflow-hidden z-40"
    >
      {/* Left Portrait Card — teaser data */}
      <div
        ref={cardRef}
        className="absolute left-[5vw] md:left-[10vw] top-1/2 -translate-y-1/2 w-[90vw] md:w-[34vw] max-w-[480px]"
      >
        <CornerBrackets className="bg-[rgba(244,239,230,0.92)] rounded-sm overflow-hidden">
          {/* Photo area */}
          <div className="h-[160px] md:h-[32%] overflow-hidden">
            <img
              src="/cosmic_portrait.png"
              alt="Your cosmic portrait"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Card content */}
          <div className="p-6 md:p-8">
            <div className="mb-4">
              <h4 className="text-lg font-medium text-[#14181F]">{subject.sun_sign}</h4>
              <p className="text-xs text-[#6D6A61]">Sun Sign</p>
            </div>

            <div className="border-t border-[#E5DDD1] pt-4 space-y-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">Chinese Astrology</p>
                <p className="text-[#14181F]">{subject.chinese_year_animal}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">Ascendant</p>
                <p className="text-[#14181F]">{subject.ascendant}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">Element</p>
                <p className="text-[#14181F]">{subject.element_summary}</p>
              </div>
            </div>

            {teaser.mode === 'partnership' && teaser.partner && (
              <div className="mt-4 pt-4 border-t border-[#E5DDD1]">
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61] mb-2">Partner</p>
                <p className="text-[#14181F]">{teaser.partner.sun_sign} · {teaser.partner.chinese_year_animal}</p>
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
            Preview
          </p>
        </div>

        <div ref={indexRef}>
          <p className="text-base md:text-lg text-[#F4EFE6]/80 leading-relaxed mb-8 max-w-md">
            {subject.preview_text}
          </p>

          {/* Paywall CTA */}
          <div className="bg-[rgba(255,255,255,0.06)] rounded-sm p-6 border border-[#F4EFE6]/10">
            <p className="text-sm text-[#F4EFE6]/60 mb-4">
              Your full reading includes the complete Four Pillars analysis, Wu-Xing balance, Nakshatra sectors, and your signature blueprint.
            </p>
            <button
              onClick={() => readingHash && onUnlock(readingHash)}
              disabled={!readingHash}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#C8A14A] text-[#0B0F17] rounded-sm text-sm font-medium hover:bg-[#D4B76A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              Unlock full reading
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
