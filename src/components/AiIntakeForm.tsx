import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, AlertTriangle, Check, RefreshCw, Eye, BookOpen, Send, ShieldAlert, HeartHandshake, Plus } from 'lucide-react';
import { Service } from '../types';
import { SERVICES } from '../services';

interface AiIntakeFormProps {
  selectedServices: Service[];
  onApplyServices: (services: Service[]) => void;
  onSetContraindicationWarnings?: (warnings: string[]) => void;
  services?: Service[];
}

export default function AiIntakeForm({ selectedServices, onApplyServices, onSetContraindicationWarnings, services = SERVICES }: AiIntakeFormProps) {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingUpsells, setIsRefreshingUpsells] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  
  // Track selected popular combinations. Syncs automatically with notes text.
  const [selectedComboIds, setSelectedComboIds] = useState<string[]>([]);

  const SUGGESTIONS = [
    {
      id: "total_operator",
      title: "The Total Operator",
      subtitle: "Brazilian (Penis) + Full Back + Underarms",
      text: "I want to get the Total Operator bundle: Brazilian (Penis), Full Back wax, and Underarm waxing."
    },
    {
      id: "summer_smooth",
      title: "The Summer Smooth",
      subtitle: "Full Legs + Bikini Line + Eyebrows",
      text: "Looking for the Summer Smooth: Full Legs, Bikini Line wax, and Eyebrows shaping."
    },
    {
      id: "precision_groom",
      title: "The Precision Groom",
      subtitle: "Full Face + Chest & Stomach trim",
      text: "I'd like to get the Precision Groom: Full Face waxing, Manscaping Chest, and Stomach clipper trim."
    },
    {
      id: "bikini_butt",
      title: "Bikini Full & Butt Full",
      subtitle: "Bikini - Full (Penis) + Butt - Full",
      text: "I would like to get my bikini full waxed (front side) and also get my full butt cheeks waxed (Butt - Full)."
    }
  ];

  const handleSuggestClick = (id: string, sText: string) => {
    setSelectedComboIds(prev => {
      const exists = prev.includes(id);
      if (exists) {
        // Safe remove without leaving redundant spaces
        setNotes(n => n.replace(sText, "").replace(/\n\n+/g, "\n\n").trim());
        return prev.filter(x => x !== id);
      } else {
        // Safe append
        setNotes(n => {
          const trimmed = n.trim();
          return trimmed ? `${trimmed}\n\n${sText}` : sText;
        });
        return [...prev, id];
      }
    });
    setApplied(false);
  };

  // Sync button selected states if client manually edits and removes suggestion copy
  React.useEffect(() => {
    setSelectedComboIds(prev => {
      const matched = prev.filter(id => {
        const item = SUGGESTIONS.find(s => s.id === id);
        return item ? notes.includes(item.text) : false;
      });
      if (matched.length !== prev.length) {
        return matched;
      }
      return prev;
    });
  }, [notes]);
  
  const [result, setResult] = useState<{
    selectedServiceIds: string[];
    upsellSuggestions: string[];
    explanation: string;
    sandbox?: boolean;
  } | null>(null);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScanNotes = async () => {
    if (!notes.trim()) {
      setError("Please describe what treatments you're looking for first.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setApplied(false);

    try {
      const response = await fetch('/api/gemini/parse-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notes,
          selectedServiceIds: selectedServices.map(s => s.id)
        })
      });

      if (!response.ok) {
        throw new Error('Server returned an error while processing notes.');
      }

      const data = await response.json();
      if (data.success) {
        const newlyMatchedIds = data.selectedServiceIds || [];
        const existingCartIds = selectedServices.map(s => s.id);
        const conjoinedIds = Array.from(new Set([...existingCartIds, ...newlyMatchedIds]));

        setResult({
          selectedServiceIds: conjoinedIds,
          upsellSuggestions: data.upsellSuggestions || [],
          explanation: data.explanation || '',
          sandbox: data.sandbox
        });
        
        // Sync scan results back to the parent cart instantly!
        const conjoinedServices = conjoinedIds
          .map(id => services.find(s => s.id === id))
          .filter((s): s is Service => !!s);
        onApplyServices(conjoinedServices);
        setApplied(true);

        if (onSetContraindicationWarnings && data.upsellSuggestions) {
          onSetContraindicationWarnings(data.upsellSuggestions);
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze notes. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const findMatchingServicesForSuggestion = (text: string): Service[] => {
    const textLower = text.toLowerCase();
    const matchedServices: Service[] = [];
    
    // Explicit keywords mapping for fully robust, precise matching
    const keywordMapping: { keywords: string[]; serviceId: string }[] = [
      { keywords: ['eyebrow', 'brow', 'brows'], serviceId: 'face-eyebrows' },
      { keywords: ['nose', 'nostril', 'nostrils'], serviceId: 'face-nose' },
      { keywords: ['ear', 'ears'], serviceId: 'face-ears' },
      { keywords: ['underarm', 'under-arm', 'under arm', 'underarms', 'under arms'], serviceId: 'body-underarm' },
      { keywords: ['shoulder', 'shoulders'], serviceId: 'body-shoulder' },
      { keywords: ['full leg', 'full legs', 'legs (full)'], serviceId: 'body-legs-full' },
      { keywords: ['lower leg', 'lower legs'], serviceId: 'body-legs-lower' },
      { keywords: ['upper leg', 'upper legs'], serviceId: 'body-legs-upper' },
      { keywords: ['full arm', 'full arms'], serviceId: 'body-arms-full' },
      { keywords: ['half arm', 'half arms'], serviceId: 'body-arms-half' },
      { keywords: ['full back', 'back wax'], serviceId: 'body-back-full' },
      { keywords: ['stomach', 'belly', 'abs'], serviceId: 'body-stomach-full' },
      { keywords: ['chest'], serviceId: 'body-chest-full' },
      { keywords: ['chin'], serviceId: 'face-chin' },
      { keywords: ['neck'], serviceId: 'face-neck-front' },
      { keywords: ['inner thigh'], serviceId: 'body-inner-thigh' },
      { keywords: ['butt full', 'butt - full', 'full butt', 'butt cheek', 'butt cheeks', 'glute', 'glutes'], serviceId: 'intimate-butt-full' },
      { keywords: ['butt strip', 'butt-strip'], serviceId: 'intimate-butt-strip' },
      { keywords: ['bikini line'], serviceId: 'intimate-bikini-line' },
      { keywords: ['brazilian penis', 'brazilian (penis)'], serviceId: 'intimate-brazilian-penis' },
      { keywords: ['brazilian vagina', 'brazilian (vagina)'], serviceId: 'intimate-brazilian-vagina' },
      { keywords: ['bikini full penis', 'bikini - full (penis)'], serviceId: 'intimate-bikini-full-penis' },
      { keywords: ['bikini full vagina', 'bikini - full (vagina)'], serviceId: 'intimate-bikini-full-vagina' },
    ];

    // Check custom mappings first
    keywordMapping.forEach(({ keywords, serviceId }) => {
      if (keywords.some(kw => textLower.includes(kw))) {
        const s = services.find(x => x.id === serviceId);
        if (s && !matchedServices.includes(s)) {
          matchedServices.push(s);
        }
      }
    });

    // Also check generic substring match on all services to be super bulletproof
    services.forEach(s => {
      const sName = s.name.toLowerCase();
      const singularSName = sName.endsWith('s') ? sName.slice(0, -1) : sName;
      const strippedSName = sName.replace(' waxing', '').replace(' full', '').replace(' - full', '').trim();
      const singularStripped = strippedSName.endsWith('s') ? strippedSName.slice(0, -1) : strippedSName;

      if (
        (sName.length > 3 && textLower.includes(sName)) ||
        (singularSName.length > 3 && textLower.includes(singularSName)) ||
        (strippedSName.length > 3 && textLower.includes(strippedSName)) ||
        (singularStripped.length > 3 && textLower.includes(singularStripped))
      ) {
        if (!matchedServices.some(m => m.id === s.id)) {
          matchedServices.push(s);
        }
      }
    });

    // Universal fallback: if still zero, guarantee clickability by attaching 'face-eyebrows' (or face-nose)
    if (matchedServices.length === 0) {
      const s = services.find(x => x.id === 'face-eyebrows') || services.find(x => x.id === 'face-nose');
      if (s) {
        matchedServices.push(s);
      }
    }

    return matchedServices;
  };

  const refreshTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const triggerBackgroundRefreshTimeout = (currentServiceIds: string[]) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(async () => {
      setIsRefreshingUpsells(true);
      try {
        const response = await fetch('/api/gemini/parse-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            notes, 
            selectedServiceIds: currentServiceIds 
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setResult(prev => {
              if (!prev) return null;
              return {
                ...prev,
                selectedServiceIds: currentServiceIds,
                upsellSuggestions: data.upsellSuggestions || [],
                explanation: data.explanation || prev.explanation,
                sandbox: data.sandbox
              };
            });
          }
        }
      } catch (err) {
        console.warn("Failed to dynamically update recommendations:", err);
      } finally {
        setIsRefreshingUpsells(false);
      }
    }, 3000);
  };

  const toggleUpsellServices = async (ids: string[]) => {
    if (!result) return;
    
    const areAllInCart = ids.every(id => selectedServices.some(s => s.id === id));
    let updatedIds = selectedServices.map(s => s.id);
    
    if (areAllInCart) {
      updatedIds = updatedIds.filter(id => !ids.includes(id));
    } else {
      ids.forEach(id => {
        if (!updatedIds.includes(id)) {
          updatedIds.push(id);
        }
      });

      // Overlap and Duplicate Price Prevention:
      // If the client requests both Bikini - Full (Penis or Vagina) and Butt - Full, swap out Brazilian to prevent duplicate fees!
      const hasBikiniFullPenis = updatedIds.includes('intimate-bikini-full-penis');
      const hasBikiniFullVagina = updatedIds.includes('intimate-bikini-full-vagina');
      const hasButtFull = updatedIds.includes('intimate-butt-full');

      if (hasButtFull && (hasBikiniFullPenis || hasBikiniFullVagina)) {
        updatedIds = updatedIds.filter(id => id !== 'intimate-brazilian-penis' && id !== 'intimate-brazilian-vagina');
      }
    }
    
    // Set updated IDs locally first so the Selected indicator is immediate
    setResult({
      ...result,
      selectedServiceIds: updatedIds
    });
    setApplied(true);

    // Apply updated list directly to parent's cart!
    const updatedServices = updatedIds
      .map(id => services.find(s => s.id === id))
      .filter((s): s is Service => !!s);
      
    onApplyServices(updatedServices);

    // Schedule automatic refresh in 3 seconds
    triggerBackgroundRefreshTimeout(updatedIds);
  };

  const getAnatomySwapAlternative = (id: string): { alternativeId: string; label: string } | null => {
    if (id === 'intimate-brazilian-vagina') return { alternativeId: 'intimate-brazilian-penis', label: 'Switch to (Penis)' };
    if (id === 'intimate-brazilian-penis') return { alternativeId: 'intimate-brazilian-vagina', label: 'Switch to (Vagina)' };
    if (id === 'intimate-bikini-full-vagina') return { alternativeId: 'intimate-bikini-full-penis', label: 'Switch to (Penis)' };
    if (id === 'intimate-bikini-full-penis') return { alternativeId: 'intimate-bikini-full-vagina', label: 'Switch to (Vagina)' };
    return null;
  };

  const handleSwapAnatomy = (currentId: string, alternativeId: string) => {
    if (!result) return;
    const updatedIds = selectedServices.map(s => s.id === currentId ? alternativeId : s.id);
    setResult({
      ...result,
      selectedServiceIds: updatedIds
    });
    setApplied(true);

    const updatedServices = updatedIds
      .map(id => services.find(s => s.id === id))
      .filter((s): s is Service => !!s);
    onApplyServices(updatedServices);
  };

  const handleApplyResult = () => {
    if (!result) return;
    
    const matchedServices = result.selectedServiceIds
      .map(id => services.find(s => s.id === id))
      .filter((s): s is Service => !!s);
      
    onApplyServices(matchedServices);
    setApplied(true);
  };

  const handleReset = () => {
    setNotes('');
    setResult(null);
    setError(null);
    setApplied(false);
    if (onSetContraindicationWarnings) {
      onSetContraindicationWarnings([]);
    }
  };

  const recommendedServices: Service[] = [];
  if (result && result.upsellSuggestions) {
    result.upsellSuggestions.forEach(suggestion => {
      const matched = findMatchingServicesForSuggestion(suggestion);
      matched.forEach(s => {
        const inCart = selectedServices.some(item => item.id === s.id);
        if (!inCart && !recommendedServices.some(existing => existing.id === s.id)) {
          recommendedServices.push(s);
        }
      });
    });
  }

  let colsCount = 2;
  if (windowWidth >= 1280) {
    colsCount = 8;
  } else if (windowWidth >= 1024) {
    colsCount = 6;
  } else if (windowWidth >= 768) {
    colsCount = 4;
  } else if (windowWidth >= 640) {
    colsCount = 3;
  }
  const maxItemsToShow = colsCount * 2;

  // Premium fallback candidates list of detailing and body wax add-ons to fill the screen nicely
  const FALLBACK_CANDIDATES = [
    'face-eyebrows',
    'face-nose',
    'face-ears',
    'body-underarm',
    'body-shoulder',
    'body-inner-thigh',
    'intimate-butt-strip',
    'body-stomach-full',
    'face-chin',
    'face-neck-front',
    'intimate-butt-full',
    'intimate-bikini-line',
    'body-chest-strip',
    'body-arms-half',
    'body-legs-lower'
  ];

  for (const fallbackId of FALLBACK_CANDIDATES) {
    // Fill up to maxItemsToShow to prevent empty gaps on wide displays
    if (recommendedServices.length >= maxItemsToShow) {
      break;
    }
    const inCart = selectedServices.some(s => s.id === fallbackId);
    const inRecommended = recommendedServices.some(s => s.id === fallbackId);
    if (!inCart && !inRecommended) {
      const matchedService = services.find(s => s.id === fallbackId);
      if (matchedService) {
        recommendedServices.push(matchedService);
      }
    }
  }

  const displayedRecommendedServices = recommendedServices.slice(0, maxItemsToShow);

  return (
    <div className="glass rounded-2xl p-6 shadow-2xl relative overflow-hidden font-sans" id="ai-intake-form-component">
      {/* Visual highlights */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#39ff14]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-5 h-5 text-[#39ff14] animate-pulse" />
          <h3 className="font-sans font-bold text-lg text-white tracking-wide">
            Intelligent Booking Consultant
          </h3>
        </div>
        <p className="text-xs text-gray-400">
          Describe the treatments you seek. Drew's intelligent model parses your preferences to pre-select matching services and suggest smart, premium grooming upgrades.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="input-stage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* suggestions queue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold block">
                  Tap to load popular combinations!
                </span>
                <span className="text-[9px] text-gray-500 font-mono">Instant input loading</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {SUGGESTIONS.map((s) => {
                  const isSelected = selectedComboIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSuggestClick(s.id, s.text)}
                      className={`p-3 border rounded-xl text-left transition duration-200 focus:outline-none group cursor-pointer flex flex-col justify-between h-full ${
                        isSelected 
                          ? 'bg-[#39ff14]/10 border-[#39ff14]/60 text-white shadow-[0_0_12px_rgba(57,255,20,0.15)] md:scale-[0.98]' 
                          : 'bg-black/40 hover:bg-white/5 border-white/5 hover:border-[#39ff14]/30'
                      }`}
                    >
                      <div>
                        <h5 className={`text-[11px] font-semibold transition duration-200 mb-0.5 flex items-center gap-1 ${
                          isSelected ? 'text-[#39ff14]' : 'text-gray-250 group-hover:text-[#39ff14]'
                        }`}>
                          {isSelected ? (
                            <Check className="w-3 h-3 text-[#39ff14] shrink-0" />
                          ) : (
                            <BookOpen className="w-3 h-3 text-[#39ff14] shrink-0" />
                          )}
                          {s.title}
                        </h5>
                        <p className={`text-[9.5px] leading-tight transition duration-200 ${
                          isSelected ? 'text-gray-300 font-medium' : 'text-gray-450'
                        }`}>
                          {s.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* main notes area */}
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setApplied(false); }}
                placeholder="Examples: 'I am looking for a full chest trim and nose hair wax. I apply daily retinol cream on my eyebrows so please use sensitive wax there...'"
                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#39ff14] transition-all resize-none shadow-inner"
              />
              <div className="absolute bottom-2 right-2 text-[9px] font-mono text-gray-500">
                {notes.length} chars
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/25 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* CTA action button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleScanNotes}
                disabled={isLoading || !notes.trim()}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#39ff14] text-black font-semibold text-xs hover:bg-green-400 shadow-md shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                    <span>Analyzing Notes via AI...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Scan with AI Operator</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result-stage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* result report header */}
            <div className="p-4 rounded-xl bg-purple-950/10 border border-[#39ff14]/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#39ff14] animate-ping" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#39ff14] font-semibold">
                    Consultation Completed
                  </span>
                </div>
                {result.sandbox && (
                  <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded uppercase font-mono">
                    Sandbox Offline Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-200 leading-relaxed italic">
                 "{result.explanation}"
              </p>
            </div>

            {/* Smart Upsell Recommendations */}
            {result.upsellSuggestions && result.upsellSuggestions.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-1.5" id="recommended-addons-header">
                  {isRefreshingUpsells ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" /> Finding more recommendations...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Recommended Add-ons
                    </>
                  )}
                </span>
                <div 
                  className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 transition-all duration-300 ${isRefreshingUpsells ? 'opacity-55 pointer-events-none' : 'opacity-100'}`}
                  id="recommended-addons-grid"
                >
                  {displayedRecommendedServices.map((service) => {
                    const allAdded = selectedServices.some(s => s.id === service.id);

                    return (
                      <div 
                        key={service.id}
                        id={`add-on-card-${service.id}`}
                        onClick={() => {
                          if (!isRefreshingUpsells) {
                            toggleUpsellServices([service.id]);
                          }
                        }}
                        className={`p-3 border rounded-xl text-center flex flex-col items-center justify-between gap-1.5 min-h-[78px] shadow-sm transition-all duration-300 group ${
                          !isRefreshingUpsells ? 'cursor-pointer select-none' : ''
                        } ${
                          allAdded 
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-medium' 
                            : 'bg-black/45 border-white/5 hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/5 text-gray-200'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1 w-full flex-grow justify-center">
                          <div className="flex items-center gap-1">
                            {service.category === 'Manscaping' ? (
                              <span className="text-[7.5px] font-mono leading-none tracking-widest uppercase font-extrabold text-[#D4AF37] px-1 py-0.5 bg-[#D4AF37]/5 border border-[#D4AF37]/25 rounded">
                                Trim
                              </span>
                            ) : (
                              <span className="text-[7.5px] font-mono leading-none tracking-widest uppercase font-extrabold text-emerald-400 px-1 py-0.5 bg-emerald-500/5 border border-emerald-500/20 rounded">
                                Wax
                              </span>
                            )}
                          </div>
                          <span className={`text-[10.5px] font-semibold text-center leading-tight line-clamp-2 transition-all duration-200 mt-1 ${
                            allAdded ? 'text-emerald-400 font-bold' : 'text-gray-300 group-hover:text-[#39ff14]'
                          }`}>
                            {service.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-1 justify-center w-full">
                          <span className="text-[10px] font-mono font-medium text-gray-400">
                            ${service.price.toFixed(0)}
                          </span>
                          {allAdded ? (
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <Plus className="w-3 h-3 text-amber-500/80 group-hover:text-amber-400 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Matched treatments display */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 font-semibold block">
                Detected Services
              </span>
              
              {result.selectedServiceIds && result.selectedServiceIds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[195px] overflow-y-auto pr-1">
                  {result.selectedServiceIds.map(srvId => {
                    const serviceObj = services.find(s => s.id === srvId);
                    if (!serviceObj) return null;
                    const swapAlternative = getAnatomySwapAlternative(srvId);

                    return (
                      <div 
                        key={serviceObj.id} 
                        className="p-3 bg-black/40 border border-white/10 rounded-xl flex flex-col gap-2.5 group hover:border-[#39ff14]/30 transition duration-300"
                      >
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {serviceObj.category === 'Manscaping' ? (
                                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-1 py-0.5 rounded leading-none">
                                  manscape
                                </span>
                              ) : (
                                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1 py-0.5 rounded leading-none">
                                  wax
                                </span>
                              )}
                              <h4 className="text-xs font-bold text-gray-200 group-hover:text-[#39ff14] transition duration-200 my-0">
                                {serviceObj.name}
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 block uppercase tracking-wide">
                              {serviceObj.duration} min
                            </span>
                          </div>
                          <span className="text-[#39ff14] font-semibold text-xs shrink-0 bg-black/40 px-2 py-1 rounded border border-gray-800">
                            ${serviceObj.price.toFixed(2)}
                          </span>
                        </div>

                        {swapAlternative && (
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between w-full gap-2">
                            <span className="text-[9px] text-amber-400 font-mono flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" />
                              Select correct anatomy:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSwapAnatomy(srvId, swapAlternative.alternativeId)}
                              className="text-[9px] font-bold text-[#39ff14] hover:text-black bg-[#39ff14]/15 hover:bg-[#39ff14] border border-[#39ff14]/30 hover:border-transparent px-2 py-0.5 rounded transition duration-205 flex items-center gap-1 cursor-pointer select-none"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>{swapAlternative.label}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center rounded-xl bg-[#0c0d12]/50 border border-dashed border-gray-800 text-xs text-gray-500">
                  No treatments uniquely matched. Try detailing specific body zones or hair goals.
                </div>
              )}
            </div>

            {/* Bottom Actions flow */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/5">
              <button
                onClick={handleReset}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white transition py-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Start Over
              </button>

              {result.selectedServiceIds && result.selectedServiceIds.length > 0 && (
                <button
                  onClick={handleApplyResult}
                  disabled={applied}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    applied
                      ? 'bg-transparent text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#39ff14] text-black hover:bg-green-400 shadow-md shadow-[0_0_15px_rgba(57,255,20,0.3)]'
                  }`}
                >
                  {applied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Services Applied to Reservation!</span>
                    </>
                  ) : (
                    <>
                      <HeartHandshake className="w-4 h-4" />
                      <span>Pre-fill Selected Services</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
