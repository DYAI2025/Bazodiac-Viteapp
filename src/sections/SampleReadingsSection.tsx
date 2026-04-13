import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CornerBrackets } from '../components/SunIcon';

gsap.registerPlugin(ScrollTrigger);

export const SampleReadingsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Heading reveal
      gsap.fromTo(headingRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          }
        }
      );

      // Cards reveal with stagger
      const cards = cardsRef.current?.querySelectorAll('.sample-card');
      if (cards) {
        cards.forEach((card) => {
          gsap.fromTo(card,
            { y: 28, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 75%',
                toggleActions: 'play none none reverse',
              }
            }
          );
        });
      }

    }, section);

    return () => ctx.revert();
  }, []);

  const samples = [
    {
      name: 'Mira',
      avatar: '/avatar_01.jpg',
      sign: 'Leo Sun',
      bazi: 'Yang Fire',
      quote: 'You lead with warmth, but your BaZi day master adds restraint—your confidence is earned, not performed.',
    },
    {
      name: 'Soren',
      avatar: '/avatar_02.jpg',
      sign: 'Pisces Sun',
      bazi: 'Yin Water',
      quote: 'You feel before you think. The portrait names the pattern—so you can choose differently.',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#F4EFE6] grain-overlay py-20 md:py-28 z-50"
    >
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        {/* Heading */}
        <h2
          ref={headingRef}
          className="text-[clamp(32px,4vw,56px)] leading-[1.0] text-[#14181F] mb-12"
        >
          Sample readings
        </h2>

        {/* Cards */}
        <div ref={cardsRef} className="space-y-8">
          {samples.map((sample) => (
            <div key={sample.name} className="sample-card">
              <CornerBrackets className="bg-white/90 backdrop-blur-sm rounded-sm p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#C8A14A]/20">
                      <img
                        src={sample.avatar}
                        alt={sample.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h3 className="text-xl text-[#14181F]">{sample.name}</h3>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-[#C8A14A]/10 rounded-full text-xs font-mono uppercase tracking-wide text-[#C8A14A]">
                          {sample.sign}
                        </span>
                        <span className="px-3 py-1 bg-[#053B3F]/10 rounded-full text-xs font-mono uppercase tracking-wide text-[#053B3F]">
                          {sample.bazi}
                        </span>
                      </div>
                    </div>

                    <blockquote className="text-lg md:text-xl text-[#14181F] leading-relaxed italic">
                      "{sample.quote}"
                    </blockquote>
                  </div>
                </div>
              </CornerBrackets>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
