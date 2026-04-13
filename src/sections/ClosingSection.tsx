import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SunRing } from '../components/SunIcon';
import { ChevronUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface ClosingSectionProps {
  onRestart: () => void;
}

export const ClosingSection: React.FC<ClosingSectionProps> = ({ onRestart }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Sun ring slow rotation tied to scroll
      gsap.fromTo(ringRef.current,
        { rotation: 0 },
        {
          rotation: 45,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          }
        }
      );

      // Content reveal
      gsap.fromTo(contentRef.current,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          }
        }
      );

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#F4EFE6] grain-overlay py-20 md:py-32 z-50"
    >
      <div className="max-w-2xl mx-auto px-6 md:px-8 text-center">
        {/* Sun Ring */}
        <div
          ref={ringRef}
          className="flex justify-center mb-10"
        >
          <SunRing size={200} className="opacity-40" />
        </div>

        {/* Content */}
        <div ref={contentRef}>
          <h2 className="text-[clamp(32px,4vw,56px)] leading-[1.0] text-[#14181F] mb-4">
            Ready for your portrait?
          </h2>
          
          <p className="text-base md:text-lg text-[#6D6A61] mb-10 max-w-md mx-auto">
            One birth moment. Three systems. A few minutes to discover your cosmic portrait.
          </p>

          <button
            onClick={onRestart}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-[#053B3F] text-[#F4EFE6] rounded-sm font-medium text-sm tracking-wide hover:bg-[#0A4A4E] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            Begin Again
          </button>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-[#E5DDD1]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-mono text-xs text-[#6D6A61]">
              © Bazodiac
            </span>
            
            <div className="flex gap-6">
              <a href="#" className="font-mono text-xs text-[#6D6A61] hover:text-[#C8A14A] transition-colors">
                Privacy
              </a>
              <a href="#" className="font-mono text-xs text-[#6D6A61] hover:text-[#C8A14A] transition-colors">
                Terms
              </a>
              <a href="#" className="font-mono text-xs text-[#6D6A61] hover:text-[#C8A14A] transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
