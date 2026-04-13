import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CornerBrackets } from '../components/SunIcon';
import { Download, Share2, BookOpen } from 'lucide-react';
import type { AstrologyResult } from '../utils/astrology';

gsap.registerPlugin(ScrollTrigger);

interface RevealSectionProps {
  result: AstrologyResult | null;
  onSave: () => void;
  onShare: () => void;
  onReadFull: () => void;
}

export const RevealSection: React.FC<RevealSectionProps> = ({ 
  result, 
  onSave, 
  onShare, 
  onReadFull 
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
        // Left portrait card slides in
        .fromTo(cardRef.current,
          { x: '-60vw', rotation: -3, opacity: 0 },
          { x: 0, rotation: 0, opacity: 1, ease: 'none' },
          0.06
        )
        // Right panel slides in
        .fromTo(panelRef.current,
          { x: '40vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0.10
        )
        // Title reveals
        .fromTo(titleRef.current,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.16
        )
        // Index number scales in
        .fromTo(indexRef.current,
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, ease: 'none' },
          0.20
        );

      // SETTLE (30-70%): Hold for viewing

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

  if (!result) {
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
          {/* Photo area */}
          <div className="h-[200px] md:h-[38%] overflow-hidden">
            <img
              src="/reveal_portrait.jpg"
              alt="Cosmic portrait"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Card content */}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{result.westernSign.symbol}</span>
              <div>
                <h4 className="text-lg font-medium text-[#14181F]">{result.westernSign.name}</h4>
                <p className="text-xs text-[#6D6A61]">{result.westernSign.element} Sign</p>
              </div>
            </div>
            
            <div className="border-t border-[#E5DDD1] pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">BaZi Day Master</p>
                  <p className="text-[#14181F]">{result.baziDayMaster.name} ({result.baziDayMaster.yinYang} {result.baziDayMaster.element})</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">Animal</p>
                  <p className="text-[#14181F]">{result.baziAnimal.animal}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#E5DDD1]">
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61]">Dominant Element</p>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: result.dominantElement.color }}
                />
                <p className="text-[#14181F]">{result.dominantElement.name}</p>
              </div>
            </div>
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
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#C8A14A] mb-8">
            Harmony Index
          </p>
        </div>

        <div ref={indexRef} className="mb-8">
          <div className="flex items-baseline gap-2">
            <span className="text-[clamp(64px,10vw,120px)] leading-none font-light text-[#C8A14A]">
              {result.harmonyIndex}
            </span>
            <span className="text-[#F4EFE6]/40 text-lg">/ 99</span>
          </div>
          <p className="text-sm text-[#F4EFE6]/60 mt-2">
            How coherently your three cosmic systems align
          </p>
        </div>

        <p className="text-base md:text-lg text-[#F4EFE6]/80 leading-relaxed mb-8 max-w-md">
          {result.interpretation}
        </p>

        {/* CTA Row */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-5 py-3 bg-[#C8A14A] text-[#0B0F17] rounded-sm text-sm font-medium hover:bg-[#D4B76A] transition-colors"
          >
            <Download className="w-4 h-4" />
            Save result
          </button>
          
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-5 py-3 border border-[#F4EFE6]/30 text-[#F4EFE6] rounded-sm text-sm font-medium hover:border-[#C8A14A] hover:text-[#C8A14A] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          
          <button
            onClick={onReadFull}
            className="flex items-center gap-2 px-5 py-3 text-[#F4EFE6]/60 rounded-sm text-sm font-medium hover:text-[#F4EFE6] transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Read full analysis
          </button>
        </div>
      </div>
    </section>
  );
};
