import React, { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SunIcon, CornerBrackets } from '../components/SunIcon';
import { Info } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface InputSectionProps {
  pathType: 'character' | 'partnership' | null;
  onCalculate: (birthDate: Date, birthTime?: string, partnerDate?: Date, partnerTime?: string) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ pathType, onCalculate }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [partnerDate, setPartnerDate] = useState('');
  const [partnerTime, setPartnerTime] = useState('');

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
        // Left photo panel slides in
        .fromTo(photoRef.current,
          { x: '-50vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        // Right content area slides in
        .fromTo(contentRef.current,
          { x: '20vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0.06
        )
        // Heading reveals
        .fromTo(headingRef.current,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.12
        )
        // Form card rises up
        .fromTo(formRef.current,
          { y: '18vh', scale: 0.96, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, ease: 'none' },
          0.14
        );

      // SETTLE (30-70%): Hold for user interaction

      // EXIT (70-100%)
      scrollTl
        .to(formRef.current,
          { y: '-12vh', opacity: 0, ease: 'power2.in' },
          0.70
        )
        .to(headingRef.current,
          { opacity: 0, ease: 'power2.in' },
          0.72
        )
        .to(photoRef.current,
          { scale: 1.06, opacity: 0, ease: 'power2.in' },
          0.75
        )
        // Midnight overlay fades in for transition to next section
        .fromTo(overlayRef.current,
          { opacity: 0 },
          { opacity: 1, ease: 'none' },
          0.78
        );

    }, section);

    return () => ctx.revert();
  }, []);

  const handleCalculate = () => {
    if (!birthDate) return;
    
    const date = new Date(birthDate);
    const pDate = partnerDate ? new Date(partnerDate) : undefined;
    
    onCalculate(date, birthTime || undefined, pDate, partnerTime || undefined);
  };

  const isValid = birthDate !== '' && (pathType !== 'partnership' || partnerDate !== '');

  return (
    <section
      ref={sectionRef}
      className="relative w-screen h-screen bg-[#F4EFE6] grain-overlay overflow-hidden z-30"
    >
      {/* Left Photo Panel */}
      <div
        ref={photoRef}
        className="absolute left-0 top-0 w-full md:w-[46vw] h-[40vh] md:h-full"
      >
        <img
          src="/input_portrait.jpg"
          alt="Editorial portrait"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#F4EFE6]/50 hidden md:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F4EFE6] via-transparent to-transparent md:hidden" />
      </div>

      {/* Right Content Area */}
      <div
        ref={contentRef}
        className="absolute left-0 md:left-[46vw] top-[35vh] md:top-0 w-full md:w-[54vw] h-[65vh] md:h-full flex flex-col justify-center px-6 md:px-[6vw] py-8"
      >
        {/* Sun Icon */}
        <div className="mb-6">
          <SunIcon size={28} className="text-[#C8A14A]" opacity={0.5} />
        </div>

        {/* Heading */}
        <h2
          ref={headingRef}
          className="text-[clamp(32px,4vw,56px)] leading-[1.0] text-[#14181F] mb-4"
        >
          Enter your birth moment
        </h2>

        <p className="text-base text-[#6D6A61] mb-8 max-w-md leading-relaxed">
          The exact time anchors your rising tone and BaZi hour pillar. If unsure, use noon.
        </p>

        {/* Form Card */}
        <div ref={formRef}>
          <CornerBrackets className="bg-white/90 backdrop-blur-sm rounded-sm p-6 md:p-8">
            {/* Birth Date & Time */}
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61] mb-2">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F4EFE6] border border-[#E5DDD1] rounded-sm text-[#14181F] focus:outline-none focus:border-[#C8A14A] transition-colors"
                />
              </div>
              
              <div>
                <label className="block font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61] mb-2">
                  Birth Time <span className="text-[#6D6A61]/60">(optional)</span>
                </label>
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F4EFE6] border border-[#E5DDD1] rounded-sm text-[#14181F] focus:outline-none focus:border-[#C8A14A] transition-colors"
                />
              </div>

              {/* Partner fields if partnership path */}
              {pathType === 'partnership' && (
                <>
                  <div className="pt-4 border-t border-[#E5DDD1]">
                    <label className="block font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61] mb-2">
                      Partner's Birth Date
                    </label>
                    <input
                      type="date"
                      value={partnerDate}
                      onChange={(e) => setPartnerDate(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F4EFE6] border border-[#E5DDD1] rounded-sm text-[#14181F] focus:outline-none focus:border-[#C8A14A] transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61] mb-2">
                      Partner's Birth Time <span className="text-[#6D6A61]/60">(optional)</span>
                    </label>
                    <input
                      type="time"
                      value={partnerTime}
                      onChange={(e) => setPartnerTime(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F4EFE6] border border-[#E5DDD1] rounded-sm text-[#14181F] focus:outline-none focus:border-[#C8A14A] transition-colors"
                    />
                  </div>
                </>
              )}
            </div>
          </CornerBrackets>

          {/* CTA Button */}
          <button
            onClick={handleCalculate}
            disabled={!isValid}
            className="mt-6 w-full md:w-auto px-8 py-4 bg-[#053B3F] text-[#F4EFE6] rounded-sm font-medium text-sm tracking-wide hover:bg-[#0A4A4E] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg"
          >
            Calculate my portrait
          </button>

          {/* Secondary Link */}
          <button className="mt-4 flex items-center gap-2 text-sm text-[#6D6A61] hover:text-[#C8A14A] transition-colors">
            <Info className="w-4 h-4" />
            Why we ask for time
          </button>
        </div>
      </div>

      {/* Midnight Overlay (for transition) */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-[#0B0F17] pointer-events-none opacity-0"
      />
    </section>
  );
};
