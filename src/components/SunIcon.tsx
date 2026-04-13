import React from 'react';

interface SunIconProps {
  className?: string;
  size?: number;
  opacity?: number;
}

export const SunIcon: React.FC<SunIconProps> = ({ 
  className = '', 
  size = 120,
  opacity = 0.18 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Central circle */}
      <circle
        cx="60"
        cy="60"
        r="16"
        fill="#C8A14A"
        fillOpacity={opacity}
      />
      
      {/* Rays */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const innerR = 22;
        const outerR = 52;
        const x1 = 60 + innerR * Math.cos(angle);
        const y1 = 60 + innerR * Math.sin(angle);
        const x2 = 60 + outerR * Math.cos(angle);
        const y2 = 60 + outerR * Math.sin(angle);
        
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#C8A14A"
            strokeWidth="1"
            strokeOpacity={opacity * 1.5}
            strokeLinecap="round"
          />
        );
      })}
      
      {/* Small dots at ray ends */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const r = 54;
        const x = 60 + r * Math.cos(angle);
        const y = 60 + r * Math.sin(angle);
        
        return (
          <circle
            key={`dot-${i}`}
            cx={x}
            cy={y}
            r="2"
            fill="#C8A14A"
            fillOpacity={opacity * 0.8}
          />
        );
      })}
    </svg>
  );
};

export const SunRing: React.FC<SunIconProps> = ({ 
  className = '', 
  size = 400 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer ring */}
      <circle
        cx="200"
        cy="200"
        r="190"
        stroke="#C8A14A"
        strokeWidth="1"
        strokeOpacity="0.35"
        fill="none"
      />
      
      {/* Inner ring */}
      <circle
        cx="200"
        cy="200"
        r="170"
        stroke="#C8A14A"
        strokeWidth="0.5"
        strokeOpacity="0.2"
        fill="none"
      />
      
      {/* Decorative arcs */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const r = 180;
        const x = 200 + r * Math.cos(angle);
        const y = 200 + r * Math.sin(angle);
        
        return (
          <circle
            key={`arc-${i}`}
            cx={x}
            cy={y}
            r="8"
            stroke="#C8A14A"
            strokeWidth="0.5"
            strokeOpacity="0.25"
            fill="none"
          />
        );
      })}
    </svg>
  );
};

export const OrnateDivider: React.FC<{ className?: string; horizontal?: boolean }> = ({ 
  className = '',
  horizontal = true 
}) => {
  return (
    <svg
      width={horizontal ? 200 : 2}
      height={horizontal ? 2 : 200}
      viewBox={horizontal ? "0 0 200 2" : "0 0 2 200"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {horizontal ? (
        <>
          <line x1="0" y1="1" x2="80" y2="1" stroke="#C8A14A" strokeWidth="1" strokeOpacity="0.35" />
          <circle cx="100" cy="1" r="3" fill="#C8A14A" fillOpacity="0.25" />
          <line x1="120" y1="1" x2="200" y2="1" stroke="#C8A14A" strokeWidth="1" strokeOpacity="0.35" />
        </>
      ) : (
        <>
          <line x1="1" y1="0" x2="1" y2="80" stroke="#C8A14A" strokeWidth="1" strokeOpacity="0.35" />
          <circle cx="1" cy="100" r="3" fill="#C8A14A" fillOpacity="0.25" />
          <line x1="1" y1="120" x2="1" y2="200" stroke="#C8A14A" strokeWidth="1" strokeOpacity="0.35" />
        </>
      )}
    </svg>
  );
};

export const CornerBrackets: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className = '',
  children 
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Top-left bracket */}
      <div className="absolute -top-3 -left-3 w-6 h-6 border-l border-t border-[#C8A14A]/40" />
      
      {/* Top-right bracket */}
      <div className="absolute -top-3 -right-3 w-6 h-6 border-r border-t border-[#C8A14A]/40" />
      
      {/* Bottom-left bracket */}
      <div className="absolute -bottom-3 -left-3 w-6 h-6 border-l border-b border-[#C8A14A]/40" />
      
      {/* Bottom-right bracket */}
      <div className="absolute -bottom-3 -right-3 w-6 h-6 border-r border-b border-[#C8A14A]/40" />
      
      {children}
    </div>
  );
};

export const FiligreeDivider: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      width="120"
      height="24"
      viewBox="0 0 120 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left flourish */}
      <path
        d="M10 12 Q 20 4, 30 12 Q 20 20, 10 12"
        stroke="#C8A14A"
        strokeWidth="0.5"
        strokeOpacity="0.4"
        fill="none"
      />
      
      {/* Center diamond */}
      <path
        d="M60 6 L 66 12 L 60 18 L 54 12 Z"
        stroke="#C8A14A"
        strokeWidth="0.5"
        strokeOpacity="0.4"
        fill="none"
      />
      
      {/* Right flourish */}
      <path
        d="M110 12 Q 100 4, 90 12 Q 100 20, 110 12"
        stroke="#C8A14A"
        strokeWidth="0.5"
        strokeOpacity="0.4"
        fill="none"
      />
      
      {/* Connecting lines */}
      <line x1="30" y1="12" x2="54" y2="12" stroke="#C8A14A" strokeWidth="0.5" strokeOpacity="0.25" />
      <line x1="66" y1="12" x2="90" y2="12" stroke="#C8A14A" strokeWidth="0.5" strokeOpacity="0.25" />
    </svg>
  );
};
