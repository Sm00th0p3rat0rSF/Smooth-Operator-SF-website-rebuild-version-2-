import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Shield, Heart } from 'lucide-react';
import landingBgImage from '../assets/images/landing_bg_neon_1780596601485.png';
import brandLogo from '../assets/images/SOFavicon.png';
import SparklingLogo from './SparklingLogo';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#050609] flex flex-col items-center justify-between p-6 relative overflow-hidden">
      {/* Top-left aligned logo icon with branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-6 left-6 md:top-8 md:left-8 z-20 flex items-center gap-3 select-none"
      >
        <SparklingLogo size="lg" />
      </motion.div>

      {/* Immersive background glowing image with vignette matching the premium design */}
      <div className="absolute inset-0 z-0">
        <img
          src={landingBgImage}
          alt="Smooth Operator SF Neon Studio"
          className="w-full h-full object-cover brightness-[0.7] contrast-[1.05]"
          referrerPolicy="no-referrer"
        />
        {/* Soft dark vignette gradients to blend with the deep obsidian backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050609] via-transparent to-[#050609]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050609]/30 via-transparent to-[#050609]/30" />
      </div>

      {/* Floating ambient dots overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(57,255,20,0.05)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0" />
      
      {/* Subtle organic green background glow pulse */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#39ff14]/10 rounded-full blur-[140px] pointer-events-none animate-pulse z-0" />

      {/* Header/Top branding marker */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center pt-8 z-10"
      >
        <span className="text-[11px] font-mono tracking-[0.3em] text-[#39ff14] uppercase bg-black/40 backdrop-blur-md border border-[#39ff14]/25 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(57,255,20,0.15)]">
          EST. SAN FRANCISCO
        </span>
      </motion.div>

      {/* Main Hero block */}
      <div className="flex flex-col items-center max-w-4xl w-full text-center z-10">
        {/* Brand Display Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="font-sans font-light tracking-[0.25em] text-white text-5xl md:text-7xl lg:text-8xl leading-none select-none text-center"
        >
          SMOOTH
          <br />
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#b4ff39] to-[#39ff14] drop-shadow-[0_2px_10px_rgba(57,255,20,0.25)]">
            OPERATOR SF
          </span>
        </motion.h1>

        {/* Sub-text reflecting self-confidence & client inclusion */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="text-gray-200/90 text-sm md:text-base tracking-[0.08em] font-light max-w-xl mt-6 leading-relaxed px-4 text-shadow-sm"
        >
          A premium waxing and manscaping studio catering to all genders, sexual identities, and body types. Step in to reclaim your smooth skin, elevate your self-care ritual, and walk out with absolute self-confidence.
        </motion.p>

        {/* Glowing Enter Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-12 group relative"
        >
          {/* Outer glowing halo backing */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-[#39ff14] rounded-full blur-xl opacity-30 group-hover:opacity-85 transition duration-500 scale-105" />
          
          <button
            id="enter-button"
            onClick={onEnter}
            className="relative px-12 py-4 bg-gradient-to-r from-[#39ff14] to-emerald-500 hover:from-[#51ff33] hover:to-emerald-400 text-black font-sans font-bold uppercase tracking-[0.2em] rounded-full text-sm transition-all duration-300 shadow-[0_0_35px_rgba(57,255,20,0.5)] hover:shadow-[0_0_50px_rgba(57,255,20,0.8)] transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            Enter Studio
          </button>
        </motion.div>
      </div>

      {/* Footer highlighting support / non-discrim stance */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 1.2, delay: 1 }}
        className="w-full flex justify-center gap-8 text-[11px] font-mono text-gray-200/80 tracking-wider pt-6 pb-2 border-t border-white/5 z-10 glass-dark rounded-t-xl"
      >
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#39ff14]" /> All Genders & Sexualities Welcome
        </span>
        <span className="flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-[#39ff14]" /> Tailored For Everyone
        </span>
      </motion.div>
    </div>
  );
}
