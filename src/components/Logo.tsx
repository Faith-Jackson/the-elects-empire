import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 40, color = 'currentColor' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <title>The Elects Empire Official Logo</title>
      
      {/* Background Sun/Moon with horizontal stripes */}
      <mask id="sun-mask">
        <circle cx="360" cy="100" r="60" fill="white" />
        <path d="M300 50 H420 V55 H300 Z" fill="black" />
        <path d="M300 60 H420 V65 H300 Z" fill="black" />
        <path d="M300 70 H420 V75 H300 Z" fill="black" />
        <path d="M300 80 H420 V85 H300 Z" fill="black" />
        <path d="M300 90 H420 V95 H300 Z" fill="black" />
        <path d="M300 100 H420 V105 H300 Z" fill="black" />
        <path d="M300 110 H420 V115 H300 Z" fill="black" />
        <path d="M300 120 H420 V125 H300 Z" fill="black" />
        <path d="M300 130 H420 V135 H300 Z" fill="black" />
        <path d="M300 140 H420 V145 H300 Z" fill="black" />
      </mask>
      <circle cx="360" cy="100" r="60" fill={color} mask="url(#sun-mask)" />

      {/* The Imperial Palace / Cathedral Silhouette */}
      <g fill={color}>
        {/* Base Curve */}
        <path d="M60 480 C 150 430, 362 430, 452 480 L 452 500 L 60 500 Z" />
        
        {/* Left Towers */}
        <rect x="70" y="280" width="10" height="200" />
        <rect x="85" y="300" width="30" height="180" />
        <rect x="120" y="285" width="25" height="195" />
        <rect x="150" y="295" width="25" height="185" />
        <rect x="180" y="350" width="35" height="130" />
        
        {/* Center Structure */}
        <rect x="225" y="220" width="30" height="260" />
        <rect x="256" y="200" width="10" height="280" /> {/* Central Axis */}
        <rect x="267" y="220" width="30" height="260" />
        
        {/* Right Towers */}
        <rect x="307" y="350" width="35" height="130" />
        <rect x="347" y="300" width="25" height="180" />
        <rect x="377" y="305" width="30" height="175" />
        <rect x="412" y="290" width="30" height="190" />
        <rect x="447" y="280" width="10" height="200" />
        
        {/* The Throne/Base of Cross */}
        <path d="M220 220 H292 V190 H220 Z" />
        <path d="M230 190 H282 V160 H230 Z" />
        <path d="M245 160 H267 V145 H245 Z" />
        
        {/* The Imperial Cross */}
        {/* Vertical Post */}
        <rect x="252" y="50" width="8" height="100" />
        {/* Main Horizontal Bar */}
        <rect x="220" y="75" width="72" height="8" />
        {/* Top Horizontal Bar */}
        <rect x="245" y="58" width="22" height="4" />
        
        {/* The Shroud (Cloth) */}
        <path d="M235 83 C 235 83, 245 115, 256 115 C 267 115, 277 83, 277 83" stroke={color} strokeWidth="4" fill="none" />
        <path d="M230 75 L 240 115 L 235 125 L 225 115 Z" fill={color} />
        <path d="M282 75 L 272 115 L 277 125 L 287 115 Z" fill={color} />
      </g>
    </svg>
  );
};

export default Logo;
