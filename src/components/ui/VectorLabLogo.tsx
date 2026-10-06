'use client';

import React from 'react';

interface VectorLabLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function VectorLabLogo({
  size = 44,
  className = '',
  showText = true
}: VectorLabLogoProps) {
  return (
    <div className={`flex items-center gap-3.5 group select-none ${className}`}>
      {/* Interactive VectorLab Glyph */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-105"
        style={{ width: size, height: size }}
      >
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/25 via-indigo-500/30 to-purple-500/25 blur-md group-hover:blur-lg transition-all" />

        {/* Outer Glass Container */}
        <div className="relative w-full h-full rounded-2xl p-[1.5px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-[var(--bg-main)] rounded-[14px] flex items-center justify-center overflow-hidden relative">
            
            {/* Background Vector Grid Accent */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]" />

            {/* The "V + Flask + Vector Arrow" SVG Mark */}
            <svg
              viewBox="0 0 100 100"
              className="w-4/5 h-4/5 relative z-10 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)] transition-transform duration-300 group-hover:scale-110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Dynamic Gradient for the Flask & Vector */}
                <linearGradient id="vlGradientPrimary" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan */}
                  <stop offset="50%" stopColor="#6366f1" /> {/* Indigo */}
                  <stop offset="100%" stopColor="#a855f7" /> {/* Purple */}
                </linearGradient>

                <linearGradient id="vlGradientLiquid" x1="25" y1="60" x2="75" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.9" />
                </linearGradient>

                <filter id="vlGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. Laboratory Flask Neck (Top Opening) */}
              <path
                d="M42 16H58"
                stroke="url(#vlGradientPrimary)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* 2. Flask Outer Shell (Колба Эрленмейера) */}
              <path
                d="M44 18V30L20 74C18 78 21 84 26 84H74C79 84 82 78 80 74L56 30V18"
                stroke="url(#vlGradientPrimary)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-70 group-hover:opacity-100 transition-opacity"
              />

              {/* 3. The Core Letter "V" formed inside the flask */}
              <path
                d="M33 38L50 72L67 38"
                stroke="url(#vlGradientPrimary)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 4. Ascending Vector Arrow (Стрела вектора роста из центра наверх) */}
              <path
                d="M50 72L78 22"
                stroke="#38bdf8"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <path
                d="M66 22H78V34"
                stroke="#38bdf8"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 5. Glowing Quantum Dot (Фокус/Катализатор) */}
              <circle
                cx="50"
                cy="72"
                r="4.5"
                fill="#22d3ee"
                filter="url(#vlGlow)"
                className="animate-pulse"
              />

              {/* 6. Subtle Measurement Marks (Лабораторные мерные засечки) */}
              <line x1="32" y1="56" x2="38" y2="56" stroke="url(#vlGradientPrimary)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
              <line x1="36" y1="66" x2="43" y2="66" stroke="url(#vlGradientPrimary)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            </svg>

            {/* Glowing Corner Indicator */}
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_6px_#22d3ee] animate-ping" />
          </div>
        </div>
      </div>

      {/* Typography: VectorLab */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl font-black tracking-tight leading-none">
              <span className="text-[var(--text-main)]">Vector</span>
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Lab
              </span>
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 tracking-wider uppercase">
              Assets
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase font-semibold mt-0.5">
            Digital Asset Laboratory
          </span>
        </div>
      )}
    </div>
  );
}
