import React from 'react';

interface SmartProcureLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'icon-only';
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export const SmartProcureLogo: React.FC<SmartProcureLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  theme = 'auto',
}) => {
  // Dimension scales
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const subtitleSizes = {
    sm: 'text-[7px] tracking-wider',
    md: 'text-[9px] tracking-wider',
    lg: 'text-[11px] tracking-widest',
    xl: 'text-xs tracking-widest',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* 3D Isometric Hexagonal Box with Dynamic Checkmark Arrow */}
      <div className={`relative shrink-0 ${iconSizes[size]} flex items-center justify-center`}>
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            {/* Hexagon Outline Gradient */}
            <linearGradient id="spHexGrad" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>

            {/* Isometric Box Top Face */}
            <linearGradient id="spBoxTop" x1="40" y1="35" x2="80" y2="55" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>

            {/* Isometric Box Left Face */}
            <linearGradient id="spBoxLeft" x1="38" y1="52" x2="60" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>

            {/* Isometric Box Right Face */}
            <linearGradient id="spBoxRight" x1="60" y1="52" x2="82" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>

            {/* Checkmark Ribbon Gradient */}
            <linearGradient id="spCheckGrad" x1="45" y1="70" x2="110" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E40AF" />
              <stop offset="40%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>

          {/* Outer Hexagon Frame with thick line */}
          <path
            d="M60 6 L106 32 V88 L60 114 L14 88 V32 Z"
            stroke="url(#spHexGrad)"
            strokeWidth="10"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 3D Isometric Cube Box inside Hexagon */}
          {/* Top Face */}
          <path
            d="M60 36 L82 48 L60 60 L38 48 Z"
            fill="url(#spBoxTop)"
          />

          {/* Left Face */}
          <path
            d="M38 48 L60 60 V84 L38 72 Z"
            fill="url(#spBoxLeft)"
          />

          {/* Right Face */}
          <path
            d="M60 60 L82 48 V72 L60 84 Z"
            fill="url(#spBoxRight)"
          />

          {/* Package Seam Lines */}
          <path
            d="M49 42 L71 54"
            stroke="#93C5FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M60 60 V78"
            stroke="#172554"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Dynamic Swooshing Checkmark Arrow */}
          <path
            d="M48 68 L60 80 L108 46 L96 46 L60 72 L52 64 Z"
            fill="url(#spCheckGrad)"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col">
          <div className={`font-black tracking-tight leading-none ${textSizes[size]}`}>
            <span className={theme === 'dark' ? 'text-white' : theme === 'light' ? 'text-slate-900' : 'text-slate-900 dark:text-white'}>
              Smart
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              Procure
            </span>
          </div>

          {variant === 'full' && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="h-[1px] w-2.5 bg-blue-500/50" />
              <span className={`font-semibold uppercase text-slate-500 dark:text-slate-400 font-sans ${subtitleSizes[size]}`}>
                Procurement • Purchase Orders • Delivery
              </span>
              <span className="h-[1px] w-2.5 bg-blue-500/50" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
