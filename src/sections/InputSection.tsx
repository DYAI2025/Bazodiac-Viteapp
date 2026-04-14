import React, { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SunIcon, CornerBrackets } from '../components/SunIcon';
import { Info, Loader2 } from 'lucide-react';
import type { ReadingResponse } from '../types/reading';

gsap.registerPlugin(ScrollTrigger);

interface InputSectionProps {
  pathType: 'character' | 'partnership' | null;
  onReadingReady: (response: ReadingResponse) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ pathType, onReadingReady }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthTimeKnown, setBirthTimeKnown] = useState(false);
  const [partnerDate, setPartnerDate] = useState('');
  const [partnerTime, setPartnerTime] = useState('');
  const [partnerTimeKnown, setPartnerTimeKnown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        .fromTo(photoRef.current,
          { x: '-50vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo(contentRef.current,
          { x: '20vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0.06
        )
        .fromTo(headingRef.current,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.12
        )
        .fromTo(formRef.current,
          { y: '18vh', scale: 0.96, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, ease: 'none' },
          0.14
        );

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
        .fromTo(overlayRef.current,
          { opacity: 0 },
          { opacity: 1, ease: 'none' },
          0.78
        );

    }, section);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async () => {
    if (!birthDate) return;
    setError(null);
    setLoading(true);

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const body = {
      mode: pathType ?? 'character',
      birth_data: {
        date: birthDate,
        ...(birthTimeKnown && birthTime ? { time: birthTime } : {}),
        birth_time_known: birthTimeKnown,
        timezone,
      },
      ...(pathType === 'partnership' && partnerDate
        ? {
            partner_birth_data: {
              date: partnerDate,
              ...(partnerTimeKnown && partnerTime ? { time: partnerTime } : {}),
              birth_time_known: partnerTimeKnown,
              timezone,
            },
          }
        : {}),
    };

    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unexpected error' }));
        setError((err as { error?: string }).error ?? 'Could not generate reading — please try again.');
        return;
      }

      const data = await res.json() as ReadingResponse;
      onReadingReady(data);

      // Scroll to reveal section
      setTimeout(() => {
        document.getElementById('reveal-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      setError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    birthDate !== '' &&
    (pathType !== 'partnership' || partnerDate !== '');

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
        <div className="mb-6">
          <SunIcon size={28} className="text-[#C8A14A]" opacity={0.5} />
        </div>

        <h2
          ref={headingRef}
          className="text-[clamp(32px,4vw,56px)] leading-[1.0] text-[#14181F] mb-4"
        >
          Enter your birth moment
        </h2>

        <p className="text-base text-[#6D6A61] mb-8 max-w-md leading-relaxed">
          The exact time anchors your rising tone and BaZi hour pillar. If unsure, leave it unchecked.
        </p>

        {/* Form Card */}
        <div ref={formRef}>
          <CornerBrackets className="bg-white/90 backdrop-blur-sm rounded-sm p-6 md:p-8">
            <div className="space-y-4">
              {/* Birth Date */}
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

              {/* Birth Time */}
              <div>
                <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61] mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={birthTimeKnown}
                    onChange={(e) => setBirthTimeKnown(e.target.checked)}
                    className="accent-[#C8A14A]"
                  />
                  Birth Time known
                </label>
                {birthTimeKnown && (
                  <input
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F4EFE6] border border-[#E5DDD1] rounded-sm text-[#14181F] focus:outline-none focus:border-[#C8A14A] transition-colors"
                  />
                )}
              </div>

              {/* Partner fields */}
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
                    <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#6D6A61] mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={partnerTimeKnown}
                        onChange={(e) => setPartnerTimeKnown(e.target.checked)}
                        className="accent-[#C8A14A]"
                      />
                      Partner's Birth Time known
                    </label>
                    {partnerTimeKnown && (
                      <input
                        type="time"
                        value={partnerTime}
                        onChange={(e) => setPartnerTime(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F4EFE6] border border-[#E5DDD1] rounded-sm text-[#14181F] focus:outline-none focus:border-[#C8A14A] transition-colors"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </CornerBrackets>

          {/* Error message */}
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}

          {/* CTA Button */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="mt-6 w-full md:w-auto px-8 py-4 bg-[#053B3F] text-[#F4EFE6] rounded-sm font-medium text-sm tracking-wide hover:bg-[#0A4A4E] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Calculating…' : 'Calculate my portrait'}
          </button>

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
