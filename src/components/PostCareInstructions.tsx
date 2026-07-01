import React from 'react';
import { HeartHandshake, ShieldAlert, Sparkles } from 'lucide-react';

interface PostCareInstructionsProps {
  layout?: 'standard' | 'success';
}

export default function PostCareInstructions({ layout = 'standard' }: PostCareInstructionsProps) {
  if (layout === 'success') {
    return (
      <div className="glass-accent p-5 rounded-2xl text-left space-y-3 max-w-md mx-auto border-[#39ff14]/20 shadow-lg" id="post-care-success-card">
        <h5 className="text-xs font-mono text-[#39ff14] uppercase tracking-widest font-bold flex items-center gap-1.5 drop-shadow-[0_0_4px_rgba(57,255,20,0.3)]">
          💆‍♂️ Essential Post-Wax Care Guidelines
        </h5>
        <ul className="text-xs text-gray-100 space-y-2 border-[#1a1329] leading-relaxed font-sans">
          <li className="flex items-start gap-1.5">
            <span className="text-[#39ff14] font-bold shrink-0">1.</span>
            <span><strong>Rest active sweat:</strong> No strenuous workouts or sweaty activities for 24 hours.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#39ff14] font-bold shrink-0">2.</span>
            <span><strong>No hot immersion:</strong> Skip public pools, hot tubs, steam rooms, or hot baths for 48 hours.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#39ff14] font-bold shrink-0">3.</span>
            <span><strong>Exfoliation & hydration:</strong> Do NOT exfoliate for 3 days. After 3 days, exfoliate gently 3x a week & moisturize regularly to entirely block bumps or painful ingrown hairs.</span>
          </li>
          <li className="flex items-start gap-1.5 pt-1.5 border-t border-white/10 font-medium text-lime-400">
            <span className="text-lime-300 font-semibold shrink-0">⚠️</span>
            <span><strong>The 4-Week Cycle Constraint:</strong> Be sure to book your return waxing within 4 weeks. Waiting longer resets hair growth cycles and makes sessions feel like your first time!</span>
          </li>
        </ul>
      </div>
    );
  }

  // Standard multi-section dashboard block layout
  return (
    <div className="space-y-5 rounded-2xl bg-white/5 border border-white/10 p-5 leading-relaxed text-xs" id="post-care-standard-panel">
      <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
        <HeartHandshake className="w-5 h-5 text-[#39ff14] drop-shadow-[0_0_4px_rgba(57,255,20,0.4)]" />
        <span className="font-sans font-bold text-white text-[11px] uppercase tracking-wider block">Official Post-Waxing Preservation Guidelines</span>
      </div>

      <p className="text-gray-300 font-medium leading-relaxed">
        Waxing pulls hair directly from the root, leaving pores fully exposed. Adhering tightly to our official post-waxing regimen protects against irritation, bacteria, and bumps:
      </p>

      <div className="space-y-3 font-mono text-[10.5px]">
        <div className="p-3 bg-[#07080b]/50 rounded-xl border border-white/5 space-y-1">
          <span className="text-[#39ff14] font-bold block uppercase tracking-widest">🚨 First 24 Hours (Immediate Lock)</span>
          <p className="text-gray-400 leading-relaxed">Strictly no sweaty activities or workouts. Open pores + hot sweat create a breeding ground for folliculitis (bacterial bumps).</p>
        </div>

        <div className="p-3 bg-[#07080b]/50 rounded-xl border border-white/5 space-y-1">
          <span className="text-[#39ff14] font-bold block uppercase tracking-widest">💦 48 Hour Shield (Water Warning)</span>
          <p className="text-gray-400 leading-relaxed">Avoid public pools, jacuzzis, steam rooms, saunas, and hot baths. Only quick lukewarm showers using natural unfragranced soaps are permitted.</p>
        </div>

        <div className="p-3 bg-[#07080b]/50 rounded-xl border border-white/5 space-y-1">
          <span className="text-[#39ff14] font-bold block uppercase tracking-widest">🧽 72 Hour Barrier (Exfoliation Hold)</span>
          <p className="text-gray-400 leading-relaxed">Do not exfoliate or dry-brush. Allow skin’s micro-barrier to seal completely before applying any abrasive physical or chemical scrubs.</p>
        </div>

        <div className="p-3 bg-[#07080b]/50 border border-dashed border-[#39ff14]/20 rounded-xl space-y-1 shadow-[0_0_12px_rgba(57,255,20,0.05)]">
          <span className="text-[#39ff14] font-bold block uppercase tracking-widest">✨ Long Term Retention Plan</span>
          <p className="text-gray-400 leading-relaxed">After 3 days, exfoliate gently 3 times a week and keep the skin deeply moisturized. This guides the new fine hairs back out of the follicles, eliminating ingrowns.</p>
          <p className="text-[#39ff14]/90 font-semibold leading-relaxed mt-1">Re-book every 4 weeks! Delaying reset cycles makes secondary sessions reactively feel like your very first time again.</p>
        </div>
      </div>
    </div>
  );
}
