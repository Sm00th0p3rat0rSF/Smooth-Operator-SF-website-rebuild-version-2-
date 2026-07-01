import React from 'react';
import { motion } from 'motion/react';
import brandLogo from '../assets/images/SOFavicon.png';

interface SparklingLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function SparklingLogo({ className = '', size = 'md' }: SparklingLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-11 h-11',
    xl: 'w-16 h-16',
  };

  // Dynamic set of randomized coordinate overlays with specific delay offsets
  const sparkles = [
    { delay: 0.1, duration: 2.2, top: '-6px', left: '-6px', scale: 0.9, color: '#39ff14' },
    { delay: 0.6, duration: 1.8, top: '15%', right: '-8px', scale: 0.7, color: '#D4AF37' },
    { delay: 1.2, duration: 2.5, bottom: '-6px', left: '20%', scale: 1.0, color: '#39ff14' },
    { delay: 0.8, duration: 2.0, bottom: '25%', right: '-6px', scale: 0.8, color: '#D4AF37' },
    { delay: 1.5, duration: 2.3, top: '-7px', right: '15%', scale: 0.7, color: '#ffffff' },
  ];

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Backdrop glowing visual bubble halo */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.60, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-gradient-to-tr from-[#39ff14]/15 to-[#D4AF37]/15 rounded-full blur-md"
      />

      {/* Floating Animated Sparkles orbit */}
      {sparkles.map((star, i) => (
        <motion.div
          key={i}
          className="absolute z-10 pointer-events-none"
          style={{
            top: star.top,
            left: star.left,
            right: star.right,
            bottom: star.bottom,
          }}
          animate={{
            scale: [0, star.scale, 0],
            rotate: [0, 180, 360],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut"
          }}
        >
          {/* Custom vector star shape */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke={star.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
              fill={star.color}
            />
          </svg>
        </motion.div>
      ))}

      {/* Interactive orbits */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute -inset-1 border border-dashed border-[#39ff14]/15 rounded-full scale-105 pointer-events-none"
      />

      {/* Core physical logo asset view */}
      <motion.div
        className={`${sizeClasses[size]} flex items-center justify-center overflow-hidden bg-transparent`}
        whileHover={{ scale: 1.12, rotate: 6 }}
        whileTap={{ scale: 0.94 }}
      >
        <img
          src={brandLogo}
          alt="Smooth Operator SF Logo"
          className="w-full h-full object-contain mix-blend-screen opacity-95 transition-all"
          style={{ filter: "invert(1) sepia(1) saturate(10000%) hue-rotate(76deg) brightness(1.2) contrast(1.2)" }}
          referrerPolicy="no-referrer"
        />
      </motion.div>
    </div>
  );
}
