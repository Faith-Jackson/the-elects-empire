import React from 'react';

const AppLogo = ({ className = "w-8 h-8", color = "currentColor" }: { className?: string, color?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Sun in top right with horizontal lines */}
    <g opacity="0.7">
      <circle cx="75" cy="22" r="14" fill={color} />
      <rect x="61" y="11" width="28" height="1.5" fill="var(--color-background)" />
      <rect x="61" y="15" width="28" height="1.5" fill="var(--color-background)" />
      <rect x="61" y="19" width="28" height="1.5" fill="var(--color-background)" />
      <rect x="61" y="23" width="28" height="1.5" fill="var(--color-background)" />
      <rect x="61" y="27" width="28" height="1.5" fill="var(--color-background)" />
      <rect x="61" y="31" width="28" height="1.5" fill="var(--color-background)" />
    </g>
    
    {/* Pedestal Tiers */}
    <rect x="20" y="85" width="60" height="6" fill={color} />
    <rect x="28" y="77" width="44" height="6" fill={color} />
    <rect x="35" y="69" width="30" height="6" fill={color} />
    <rect x="42" y="61" width="16" height="6" fill={color} />
    
    {/* Cross */}
    <rect x="48" y="18" width="4" height="43" fill={color} /> {/* Vertical */}
    <rect x="36" y="28" width="28" height="4" fill={color} /> {/* Horizontal */}
    
    {/* Shroud */}
    <path 
      d="M38 28 Q 38 45, 48 45 Q 58 45, 58 28" 
      stroke={color} 
      strokeWidth="2" 
      fill="none" 
      strokeDasharray="2 1"
      opacity="0.5"
    />
  </svg>
);

export default AppLogo;
