import React from 'react';

interface RetroInstagramLogoProps {
  size?: number;
  className?: string;
}

export const RetroInstagramLogo: React.FC<RetroInstagramLogoProps> = ({ size = 44, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-md transition-transform duration-200 hover:scale-105 select-none ${className}`}
      aria-label="Retrogram classic logo"
      role="img"
    >
      <defs>
        {/* Two-tone camera body gradient: vintage warm leather brown to vintage warm cream */}
        <linearGradient id="retroBody" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#84552e" />
          <stop offset="39%" stopColor="#673f1c" />
          <stop offset="41%" stopColor="#dcd4c6" />
          <stop offset="100%" stopColor="#c3b8a6" />
        </linearGradient>

        {/* Outer chrome bezel */}
        <linearGradient id="chromeBezel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0e0e0" />
          <stop offset="50%" stopColor="#9a9a9a" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        {/* Textured lens ring */}
        <linearGradient id="lensRing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#141414" />
        </linearGradient>

        {/* Deep glass reflection */}
        <radialGradient id="glassReflection" cx="42%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#1e324a" />
          <stop offset="65%" stopColor="#0a121c" />
          <stop offset="100%" stopColor="#020407" />
        </radialGradient>
      </defs>

      {/* Main squircle camera body */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="22"
        fill="url(#retroBody)"
        stroke="#45270f"
        strokeWidth="2.5"
      />

      {/* Divider seam between upper leather and lower body */}
      <line x1="7.5" y1="41" x2="92.5" y2="41" stroke="#331c0a" strokeWidth="1.8" />
      <line x1="7.5" y1="42.5" x2="92.5" y2="42.5" stroke="#f4ede2" strokeWidth="1" opacity="0.7" />

      {/* Iconic 4-color rainbow stripe (Red, Yellow, Green, Blue) */}
      <rect x="18" y="7.5" width="4.5" height="33.5" fill="#e73827" />
      <rect x="22.5" y="7.5" width="4.5" height="33.5" fill="#fabc28" />
      <rect x="27" y="7.5" width="4.5" height="33.5" fill="#3fa535" />
      <rect x="31.5" y="7.5" width="4.5" height="33.5" fill="#0080c6" />

      {/* Viewfinder (top right) */}
      <rect x="67" y="16" width="16" height="16" rx="4.5" fill="#181818" stroke="#484848" strokeWidth="1.5" />
      <circle cx="75" cy="24" r="4.5" fill="#2d3d52" />
      <circle cx="73.5" cy="22.5" r="1.5" fill="#ffffff" opacity="0.85" />

      {/* Flash sensor (top left above rainbow) */}
      <circle cx="27" cy="14" r="2.2" fill="#1b120c" stroke="#503824" strokeWidth="0.8" />

      {/* Big circular camera lens in center */}
      <circle cx="50" cy="57" r="24.5" fill="url(#chromeBezel)" />
      <circle cx="50" cy="57" r="22" fill="url(#lensRing)" />
      <circle cx="50" cy="57" r="17.5" fill="url(#glassReflection)" />
      <circle cx="50" cy="57" r="10.5" fill="#05080c" stroke="#1f2c3d" strokeWidth="1.2" />

      {/* Glass glare specular reflection */}
      <ellipse
        cx="44"
        cy="50"
        rx="5.5"
        ry="3"
        transform="rotate(-35 44 50)"
        fill="#ffffff"
        opacity="0.45"
      />
      <circle cx="58" cy="65" r="1.6" fill="#ffffff" opacity="0.35" />
    </svg>
  );
};

export default RetroInstagramLogo;
