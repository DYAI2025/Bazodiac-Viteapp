import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiligreeDivider } from '../components/SunIcon';
import { Sparkles, Languages, GitMerge } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const HowItWorksSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

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

      // Steps stagger reveal
      const steps = stepsRef.current?.querySelectorAll('.step-card');
      if (steps) {
        gsap.fromTo(steps,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: stepsRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      }

      // Pills reveal
      const pills = pillsRef.current?.querySelectorAll('.system-pill');
      if (pills) {
        gsap.fromTo(pills,
          { scale: 0.96, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: pillsRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      }

    }, section);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      number: '01',
      title: 'Cast',
      description: 'We compute your Western chart and BaZi pillars from your birth moment.',
      icon: Sparkles,
    },
    {
      number: '02',
      title: 'Translate',
      description: 'Each system is interpreted through a unified lens—no contradictions, only connections.',
      icon: Languages,
    },
    {
      number: '03',
      title: 'Weave',
      description: 'A single narrative emerges—clear, specific, and actionable.',
      icon: GitMerge,
    },
  ];

  const systems = ['Western', 'BaZi', 'Wuxing'];

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#F4EFE6] grain-overlay py-20 md:py-28 z-50"
    >
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        {/* Divider */}
        <div className="flex justify-center mb-12">
          <FiligreeDivider />
        </div>

        {/* Heading */}
        <h2
          ref={headingRef}
          className="text-[clamp(32px,4vw,56px)] leading-[1.0] text-[#14181F] text-center mb-16"
        >
          How the portrait is woven
        </h2>

        {/* Steps */}
        <div ref={stepsRef} className="grid md:grid-cols-3 gap-8 md:gap-12 mb-16">
          {steps.map((step) => (
            <div key={step.number} className="step-card text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#C8A14A]/10 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-[#C8A14A]" />
                </div>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#6D6A61]">
                  {step.number}
                </span>
              </div>
              
              <h3 className="text-2xl text-[#14181F] mb-3">{step.title}</h3>
              <p className="text-sm text-[#6D6A61] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* System Pills */}
        <div ref={pillsRef} className="flex flex-wrap justify-center gap-3">
          {systems.map((system) => (
            <div
              key={system}
              className="system-pill px-6 py-2 border border-[#C8A14A]/40 rounded-full"
            >
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-[#C8A14A]">
                {system}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
