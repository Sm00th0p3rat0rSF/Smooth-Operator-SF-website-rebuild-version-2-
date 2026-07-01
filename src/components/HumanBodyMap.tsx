import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Info, Eye } from 'lucide-react';
import { Service, Hotspot } from '../types';
import { SERVICES, FRONT_HOTSPOTS, BACK_HOTSPOTS } from '../services';

// Import photographic model assets
import modelFrontImg from '../assets/images/Frontview.png';
import modelBackImg from '../assets/images/backview.png';

interface HumanBodyMapProps {
  onAddService: (service: Service) => void;
  selectedServices: Service[];
  services?: Service[];
}

const getTransformSettings = (id: string | undefined) => {
  return { scale: 1.0, origin: '50% 50%' };
};

export default function HumanBodyMap({ onAddService, selectedServices, services = SERVICES }: HumanBodyMapProps) {
  const [viewSide, setViewSide] = useState<'front' | 'back'>('front');
  const [hoveredHotspot, setHoveredHotspot] = useState<Hotspot | null>(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('intimate');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const rawHotspots = viewSide === 'front' ? FRONT_HOTSPOTS : BACK_HOTSPOTS;

  // Cleanly map coordinates to fit the 100x220 canvas coordinates perfectly matched to our premium models
  const hotspots = rawHotspots.map(hs => {
    let cx = hs.cx;
    let cy = hs.cy;

    if (hs.id === 'face') {
      cx = 50;
      cy = 28;
    } else if (hs.id === 'chest') {
      cx = 50;
      cy = 58;
    } else if (hs.id === 'stomach') {
      cx = 50;
      cy = 82;
    } else if (hs.id === 'arms') {
      cx = 24;
      cy = 80;
    } else if (hs.id === 'intimate') {
      cx = 50;
      cy = 112;
    } else if (hs.id === 'legs') {
      cx = 40;
      cy = 160;
    } else if (hs.id === 'shoulders') {
      cx = 28;
      cy = 62;
    } else if (hs.id === 'back') {
      cx = 50;
      cy = 72;
    } else if (hs.id === 'butt') {
      cx = 50;
      cy = 114;
    }

    return {
      ...hs,
      cx,
      cy,
      r: hs.r * 1.3 // slightly larger, premium desktop/mobile high-usability targets
    };
  });

  // Automatically select the 'intimate' hotspot for front, and 'butt' hotspot for back when switching views
  React.useEffect(() => {
    if (viewSide === 'front') {
      setSelectedHotspotId('intimate');
    } else {
      setSelectedHotspotId('butt');
    }
  }, [viewSide]);

  const selectedHotspot = hotspots.find(hs => hs.id === selectedHotspotId) || hotspots[0] || null;

  const activeHotspot = hoveredHotspot || selectedHotspot;
  const activeSettings = getTransformSettings(activeHotspot?.id);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && ('ontouchstart' in window)) return; // skip tilt on mobile touch targets
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setTilt({ x: x * 10, y: y * -10 }); // scale tilt max degrees
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHoveredHotspot(null);
  };

  const handleSetViewSide = (side: 'front' | 'back') => {
    setViewSide(side);
  };

  const activeHotspotsList = hotspots;

  return (
    <div className="glass rounded-2xl p-3 xs:p-4 md:p-6 shadow-2xl relative overflow-hidden" id="human-body-map-container">
      {/* Absolute faint background details */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-[#39ff14]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#39ff14]/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Title block */}
      <div className="mb-4 md:mb-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#39ff14]" />
            <h3 className="font-sans font-semibold text-lg text-white tracking-wide">
              Interactive Body Map
            </h3>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Roll over the hotspot nodes to preview and select specialized services directly from the physical figure map.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center">
        {/* Controls and figure display: Col 7 */}
        <div className="md:col-span-7 flex flex-col items-center">
          {/* Menu controllers */}
          <div className="flex flex-wrap gap-4 mb-6 justify-center w-full max-w-sm">
            <div className="bg-purple-950/20 p-1 rounded-xl flex border border-purple-500/10 w-full font-sans">
              <button
                id="btn-view-front"
                onClick={() => handleSetViewSide('front')}
                className={`flex-1 py-1.5 px-4 rounded-lg text-xs font-semibold tracking-wider uppercase transition cursor-pointer ${
                  viewSide === 'front' ? 'bg-[#39ff14] text-black font-semibold shadow-[0_0_15px_rgba(57,255,20,0.4)]' : 'text-gray-400 hover:text-white'
                }`}
              >
                Front View
              </button>
              <button
                id="btn-view-back"
                onClick={() => handleSetViewSide('back')}
                className={`flex-1 py-1.5 px-4 rounded-lg text-xs font-semibold tracking-wider uppercase transition cursor-pointer ${
                  viewSide === 'back' ? 'bg-[#39ff14] text-black font-semibold shadow-[0_0_15px_rgba(57,255,20,0.4)]' : 'text-gray-400 hover:text-white'
                }`}
              >
                Back View
              </button>
            </div>
          </div>

          {/* Interactive Silhouette Stage with Fixed, Static Presentation */}
          <div 
            className="relative w-full max-w-[280px] aspect-[100/220] bg-transparent border border-[#27293a] rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl select-none group"
          >
            {/* Unified static layout container enclosing both photographic assets + hotspot alignment dots */}
            <div className="absolute inset-0 w-full h-full">
              {/* Real photographic model background layers */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={viewSide}
                  src={viewSide === 'front' ? modelFrontImg : modelBackImg}
                  alt={`Model ${viewSide} view`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 brightness-[0.80] contrast-[1.05] mix-blend-screen"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Subtle premium gold vignette gradient mask for a blended glass look overlaying the photography */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0c0d12]/80 via-transparent to-[#0c0d12]/40 z-10" />

              {/* SVG Interactive Overlay */}
              <svg
                className="absolute inset-0 w-full h-full z-20 animate-pulse-subtle"
                viewBox="0 0 100 220"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#39ff14" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#39ff14" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                  </linearGradient>
                  <radialGradient id="hotspotGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#39ff14" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#39ff14" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#39ff14" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Render background grid lines for that surgical/tech feel */}
                <g stroke="#ffffff" strokeWidth="0.12" strokeOpacity="0.12">
                  <line x1="50" y1="0" x2="50" y2="220" strokeDasharray="1,1" />
                  <line x1="0" y1="44" x2="100" y2="44" strokeDasharray="1,1" />
                  <line x1="0" y1="110" x2="100" y2="110" strokeDasharray="1,1" />
                  <line x1="0" y1="176" x2="100" y2="176" strokeDasharray="1,1" />
                </g>

                {/* Hotspot Circle elements with high usability click & touch-hold states */}
                {activeHotspotsList.map((hs) => {
                  const isHovered = hoveredHotspot?.id === hs.id;
                  const isSelected = selectedHotspotId === hs.id;
                  const isActive = isHovered || isSelected;

                  const visualRadius = 2.2;

                  return (
                    <g
                      key={hs.id}
                      onMouseEnter={() => {
                        if (typeof window !== 'undefined' && !('ontouchstart' in window)) {
                          setHoveredHotspot(hs);
                        }
                      }}
                      onMouseLeave={() => {
                        if (typeof window !== 'undefined' && !('ontouchstart' in window)) {
                          setHoveredHotspot(null);
                        }
                      }}
                      onClick={() => {
                        setSelectedHotspotId(hs.id);
                        // Smooth scroll on mobile screen to easily select products
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          const targetCard = document.getElementById('selected-zone-card');
                          if (targetCard) {
                            targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {/* Invisible extra-large hit target for effortless precision on touch screen & mobile thumbs */}
                      <circle
                        cx={hs.cx}
                        cy={hs.cy}
                        r={Math.max(hs.r * 1.8, 14)}
                        fill="transparent"
                        className="cursor-pointer"
                      />

                      {/* Smooth outward central glow for active/selected hotspots (pulsating, not translation) */}
                      {isActive && (
                        <motion.circle
                          cx={hs.cx}
                          cy={hs.cy}
                          fill="url(#hotspotGlow)"
                          initial={{ opacity: 0.4 }}
                          animate={{ 
                            opacity: [0.4, 0.85, 0.4],
                            r: [hs.r * 1.3, hs.r * 2.2, hs.r * 1.3]
                          }}
                          transition={{
                            duration: 2.8,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="pointer-events-none"
                        />
                      )}

                      {/* Center point circle */}
                      <circle
                        cx={hs.cx}
                        cy={hs.cy}
                        r={visualRadius}
                        fill={isActive ? "#ffffff" : "#39ff14"}
                        stroke={isActive ? "#39ff14" : "#ffffff"}
                        strokeWidth="0.5"
                        className="transition-all duration-300 pointer-events-none"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Dynamic Context Card display: Col 5 */}
        <div className="md:col-span-5 md:h-[360px] h-auto flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {selectedHotspot ? (
              <motion.div
                id="selected-zone-card"
                key={selectedHotspot.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="glass border border-[#39ff14]/40 rounded-xl p-3 sm:p-5 h-full flex flex-col justify-between shadow-2xl shadow-[rgba(57,255,20,0.1)] font-sans"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#39ff14]">
                      Target Zone
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-gray-800">
                      {`${viewSide.toUpperCase()} VIEW`}
                    </span>
                  </div>
                  
                  <h4 className="font-sans font-bold text-lg text-white mb-3 flex items-center justify-between gap-2">
                    <span>{selectedHotspot.name}</span>
                  </h4>
                  
                  <div className="space-y-2.5 overflow-y-auto max-h-[260px] md:max-h-[180px] pr-2 custom-scrollbar">
                    {selectedHotspot.services.map(srvId => {
                      const serviceObj = services.find(s => s.id === srvId);
                      if (!serviceObj) return null;
                      const isAlreadyAdded = selectedServices.some(s => s.id === serviceObj.id);
                      const isBrazilianSelected = selectedServices.some(s => s.id === 'intimate-brazilian-penis' || s.id === 'intimate-brazilian-vagina');
                      const isButtStripExcluded = serviceObj.id === 'intimate-butt-strip' && isBrazilianSelected;

                      return (
                        <div key={serviceObj.id} className={`p-2 rounded-lg bg-black/40 border border-purple-950/40 flex flex-col font-sans transition-opacity ${
                          isButtStripExcluded ? 'opacity-50' : ''
                        }`}>
                          <div className="flex justify-between items-start font-medium text-sm text-gray-200">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {serviceObj.category === 'Manscaping' ? (
                                <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-1 py-0.5 rounded">manscape</span>
                              ) : (
                                <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1 py-0.5 rounded">wax</span>
                              )}
                              <span>{serviceObj.name}</span>
                            </div>
                            <span className="text-[#39ff14] font-semibold shrink-0">${serviceObj.price.toFixed(2)}</span>
                          </div>
                          <span className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                            {isButtStripExcluded ? "Included at no extra charge in your selected Brazilian service." : serviceObj.description}
                          </span>
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-800/50">
                            <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {serviceObj.duration} min
                            </span>
                            <button
                              id={`add-${serviceObj.id}`}
                              onClick={() => !isButtStripExcluded && onAddService(serviceObj)}
                              disabled={isButtStripExcluded}
                              className={`text-xs py-1 px-3 rounded-md transition font-medium ${
                                isButtStripExcluded
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 cursor-not-allowed'
                                  : isAlreadyAdded
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-pointer'
                                    : 'bg-[#39ff14] text-black hover:bg-green-400 font-semibold shadow-[0_0_12px_rgba(57,255,20,0.3)] cursor-pointer'
                              }`}
                            >
                              {isButtStripExcluded ? 'Included' : isAlreadyAdded ? 'Added' : 'Add to Book'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 leading-relaxed border-t border-gray-800 pt-2 flex items-center gap-1.5 justify-between font-sans">
                  <span className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-green-500 shrink-0" /> Tap zones to change categories. Your selection stays locked.
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-dark border border-purple-500/10 rounded-xl p-8 flex flex-col items-center justify-center text-center h-full font-sans"
              >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-[#39ff14]" />
                </div>
                <h4 className="font-sans font-medium text-white mb-2">Explore Intuitively</h4>
                <p className="text-xs text-gray-400 max-w-[220px]">
                  Touch the hotspots on the silhouette to bring up available grooming services for that area.
                </p>
                <div className="mt-8 flex items-center gap-2 text-xs text-[#39ff14] font-medium animate-pulse">
                  <span>Interact with diagram</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
