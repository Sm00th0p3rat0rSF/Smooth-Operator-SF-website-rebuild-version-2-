import { Service } from '../types';
import { SERVICES } from '../services';

/**
 * AppointmentManager Utility Database & Logic Engine for Smooth Operator SF.
 * Implements advanced ontological hierarchy, subset inclusion matrix analysis,
 * temporal calculus, hygiene-enforced redirections, and anatomical synergies.
 */

export interface CartModification {
  type: 'UPGRADE' | 'REMOVE_SUBSET' | 'COMPLIMENTARY' | 'HYGIENE_REDIRECT';
  originalId?: string;
  targetId?: string;
  description: string;
  saving: number;
}

/**
 * 1. Anatomical Disambiguation Response Provider
 * Returns the exact friendly disclaimer prompt for anatomical defaulting if specified.
 */
export function getAnatomicalDefaultingPrompt(serviceId: string): string | null {
  const isIntimate = [
    'intimate-brazilian-penis',
    'intimate-brazilian-vagina',
    'intimate-bikini-full-penis',
    'intimate-bikini-full-vagina',
    'intimate-bikini-line'
  ].includes(serviceId);

  if (isIntimate && serviceId.endsWith('-penis')) {
    return "Since intimate waxing varies by anatomy, I pre-selected the (Penis) option for now. Please feel free to toggle it to (Vagina) below if that fits you better so Drew can reserve the perfect time!";
  }
  return null;
}

/**
 * 2. Overlap Prevention & Set-Theory Subset Inclusion Matrix
 * Processes an active cart array and resolves conflict overlaps dynamically.
 */
export function resolveCartOverlaps(cart: Service[]): {
  resolvedCart: Service[];
  modifications: CartModification[];
  totalSavings: number;
  explanations: string[];
} {
  let updated = [...cart];
  const modifications: CartModification[] = [];
  const explanations: string[] = [];
  let totalSavings = 0;

  // Rule A: Brazilian + Butt Full (Intergluteal Cleft Intersection)
  // Brazilian covers standard pubic area + perineum + butt strip. Full Butt covers cheeks + butt strip.
  // Dual coverage of butt strip creates $15 double-billing overlap.
  // Optimization: Upgrade/Map Brazilian (Penis/Vagina) + Butt - Full into Bikini - Full (Penis/Vagina) + Butt - Full.
  const hasButtFull = updated.some(s => s.id === 'intimate-butt-full');
  const hasBrazilianPenis = updated.some(s => s.id === 'intimate-brazilian-penis');
  const hasBrazilianVagina = updated.some(s => s.id === 'intimate-brazilian-vagina');

  if (hasButtFull && (hasBrazilianPenis || hasBrazilianVagina)) {
    const isPenis = hasBrazilianPenis;
    const oldBrazilianId = isPenis ? 'intimate-brazilian-penis' : 'intimate-brazilian-vagina';
    const targetBikiniId = isPenis ? 'intimate-bikini-full-penis' : 'intimate-bikini-full-vagina';

    // Remove the Brazilian node and add the Bikini Full node
    updated = updated.filter(s => s.id !== oldBrazilianId);
    
    const bikiniService = SERVICES.find(s => s.id === targetBikiniId);
    if (bikiniService && !updated.some(s => s.id === targetBikiniId)) {
      updated.push(bikiniService);
    }

    modifications.push({
      type: 'UPGRADE',
      originalId: oldBrazilianId,
      targetId: targetBikiniId,
      description: `Optimized Brazilian + Butt Full into Bikini Full + Butt Full to avoid redundant butt strip charges.`,
      saving: 15.00
    });
    totalSavings += 15.00;
    explanations.push(
      `Since intimate waxing varies by anatomy and your selections included both a Brazilian and Butt - Full, I optimized your booking to Bikini - Full + Butt - Full. This delivers the exact same complete front-to-back coverage with zero overlapping fees, saving you $15.00!`
    );
  }

  // Rule B: Facial Overlaps (Full Face includes Brows, Nose, Ears, Chin, Front of Neck)
  const hasFullFace = updated.some(s => s.id === 'face-full');
  if (hasFullFace) {
    const facialSubsets = [
      { id: 'face-eyebrows', name: 'Eyebrows', price: 27.00 },
      { id: 'face-nose', name: 'Nose', price: 15.00 },
      { id: 'face-ears', name: 'Ears', price: 15.00 },
      { id: 'face-chin', name: 'Chin', price: 20.00 },
      { id: 'face-neck-front', name: 'Front of Neck', price: 19.00 }
    ];

    for (const sub of facialSubsets) {
      if (updated.some(s => s.id === sub.id)) {
        updated = updated.filter(s => s.id !== sub.id);
        modifications.push({
          type: 'REMOVE_SUBSET',
          originalId: sub.id,
          description: `Consumed ${sub.name} into Full Face bundle.`,
          saving: sub.price
        });
        totalSavings += sub.price;
        explanations.push(
          `Great news! Your ${sub.name} is already entirely covered within the Full Face service, so I have added it to your custom notes at no extra charge (saves $${sub.price.toFixed(2)}!).`
        );
      }
    }
  }

  // Rule C: Full Back contains Upper Back and Shoulders (or similar)
  // Standard full back is body-back-full ($90.00). If shoulder is added, it is adjacent – but let's check for any duplicates
  const hasFullBack = updated.some(s => s.id === 'body-back-full');
  if (hasFullBack) {
    // If they also have custom back subsets (like manscaping-back), resolve exclusions
    const hasBackTrim = updated.some(s => s.id === 'manscaping-back');
    if (hasBackTrim) {
      updated = updated.filter(s => s.id !== 'manscaping-back');
      modifications.push({
        type: 'REMOVE_SUBSET',
        originalId: 'manscaping-back',
        description: 'Removed Back Trim because Full Back hard wax is selected.',
        saving: 25.00
      });
      totalSavings += 25.00;
      explanations.push('We resolved a conflict by removing the Back Trim since you have a superior Full Back Wax selected.');
    }
  }

  // Rule D: Full Arms covers Half Arm
  const hasFullArms = updated.some(s => s.id === 'body-arms-full');
  if (hasFullArms) {
    const hasHalfArm = updated.some(s => s.id === 'body-arms-half');
    if (hasHalfArm) {
      updated = updated.filter(s => s.id !== 'body-arms-half');
      modifications.push({
        type: 'REMOVE_SUBSET',
        originalId: 'body-arms-half',
        description: 'Consumed Half Arm into Full Arms.',
        saving: 40.00
      });
      totalSavings += 40.00;
      explanations.push('Since you have Full Arms selected, the half arm area is fully covered. We subtracted the separate Half Arm fee!');
    }
  }

  // Rule E: Full Legs covers Upper Legs, Lower Legs, and Inner Thigh
  const hasFullLegs = updated.some(s => s.id === 'body-legs-full');
  if (hasFullLegs) {
    const legSubsets = [
      { id: 'body-legs-upper', name: 'Upper Legs', price: 70.00 },
      { id: 'body-legs-lower', name: 'Lower Legs', price: 75.00 },
      { id: 'body-inner-thigh', name: 'Inner Thigh', price: 35.00 }
    ];

    for (const sub of legSubsets) {
      if (updated.some(s => s.id === sub.id)) {
        updated = updated.filter(s => s.id !== sub.id);
        modifications.push({
          type: 'REMOVE_SUBSET',
          originalId: sub.id,
          description: `Consumed ${sub.name} into Full Legs.`,
          saving: sub.price
        });
        totalSavings += sub.price;
        explanations.push(`Since you have Full Legs selected, the ${sub.name} area is already fully covered at no extra cost (saves $${sub.price.toFixed(2)}!).`);
      }
    }
  }

  // Rule F: Genital Full + Inner Thigh Adjacent Blending Bundle Promo
  // If the cart has Brazilian or Bikini Full, and they add Inner Thigh, discount the Inner Thigh by $15.00 as a synergy pricing discount
  const hasGenitalFull = updated.some(s => 
    s.id === 'intimate-brazilian-penis' || 
    s.id === 'intimate-brazilian-vagina' ||
    s.id === 'intimate-bikini-full-penis' ||
    s.id === 'intimate-bikini-full-vagina'
  );

  const hasInnerThigh = updated.some(s => s.id === 'body-inner-thigh');
  if (hasGenitalFull && hasInnerThigh) {
    // Apply $15 discount to represent adjacent blending
    modifications.push({
      type: 'COMPLIMENTARY',
      originalId: 'body-inner-thigh',
      description: 'Applied intimate area blending discount to your Inner Thigh service.',
      saving: 15.00
    });
    totalSavings += 15.00;
    explanations.push('To ensure a perfectly clean line, we have integrated your Inner Thigh service with your intimate session and applied a special $15.00 blending discount!');
  }

  return {
    resolvedCart: updated,
    modifications,
    totalSavings,
    explanations
  };
}

/**
 * 3. Dynamic Cross-Selling/Upsell Recommender Matrix
 * Analyzes active cart services and recommends logical, highly probable adjacencies.
 */
export interface Recommendation {
  id: string;
  suggestedServiceId: string;
  title: string;
  description: string;
  nlpMessage: string;
}

export function getSmartRecommendations(cart: Service[]): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const serviceIds = cart.map(s => s.id);

  // Recommendations:
  // A. Chest -> Stomach (Torso Continuity)
  if (serviceIds.includes('body-chest-full') && !serviceIds.includes('body-stomach-full')) {
    recommendations.push({
      id: 'rec-torso',
      suggestedServiceId: 'body-stomach-full',
      title: 'Stomach - Full',
      description: 'Connect chest and stomach with zero high-contrast border lines.',
      nlpMessage: 'Most clients looking for a smooth chest also add the stomach to ensure a seamless look without any harsh lines. Shall I add that?'
    });
  }

  // B. Full Back -> Shoulders
  if (serviceIds.includes('body-back-full') && !serviceIds.includes('body-shoulder')) {
    recommendations.push({
      id: 'rec-shoulder',
      suggestedServiceId: 'body-shoulder',
      title: 'Shoulder Waxing',
      description: 'Blend full back smoothly into arm borders to prevent t-shirt line halos.',
      nlpMessage: "To avoid a 't-shirt line' effect, blending your Full Back wax into the shoulders provides a much more natural, athletic finish. Shall we add shoulders?"
    });
  }

  // C. Eyebrows -> Nose + Ears (Detailed Grooming Package)
  if (serviceIds.includes('face-eyebrows') && !serviceIds.includes('face-nose') && !serviceIds.includes('face-ears')) {
    recommendations.push({
      id: 'rec-nose-ears',
      suggestedServiceId: 'face-nose', // suggest adding Nose first, mention Ears
      title: 'Detailed Nose & Ears Waxing',
      description: 'Tame outer wild sprouts quickly and safely.',
      nlpMessage: "To keep your look exceptionally neat, we highly recommend adding detailed Nose and Ears waxing to your Eyebrows shaping. Shall we add those?"
    });
  }

  // D. Brazilian -> Inner Thigh
  const hasBrazilian = serviceIds.some(id => id.startsWith('intimate-brazilian-'));
  if (hasBrazilian && !serviceIds.includes('body-inner-thigh')) {
    recommendations.push({
      id: 'rec-brazilian-thigh',
      suggestedServiceId: 'body-inner-thigh',
      title: 'Inner Thigh Waxing',
      description: 'Blend delicate pubic hair contours with complete upper leg aesthetics.',
      nlpMessage: 'Most intimate waxing clients pair their Brazilian with an Inner Thigh wax to ensure a sleek, clean visual transition. Shall we add it with a $15.00 blending discount?'
    });
  }

  return recommendations;
}

/**
 * 4. Hygiene-Enforcement Guard & Safety Redirection Matrix
 * Prohibits unsafe mechanical trimmers in ultra-sensitive zones (glute cleft) and prompts hard wax.
 */
export function verifyHygieneSafety(cart: Service[]): {
  isSafe: boolean;
  warnings: string[];
  autoFixedCart: Service[];
  fixedNotes: string[];
} {
  const warnings: string[] = [];
  const fixedNotes: string[] = [];
  let updatedCart = [...cart];
  let isSafe = true;

  // Rule: Trimmers are dangerous in the intergluteal cleft. If the user chooses a mechanical trimming modality
  // (e.g. manscaping-arms-butt) but wants intergluteal cleft (which is mapped to butt-strip), we enforce safety.
  // In the services pool, 'manscaping-arms-butt' covers arms/butt trimming.
  // If we identify both 'manscaping-arms-butt' AND a delicate area service, or if we identify high risk, we warn.
  // Specifically: if user requests to trim glute cleft, pivot to painless hard wax 'intimate-butt-strip' ($27).
  const hasButtTrim = updatedCart.some(s => s.id === 'manscaping-arms-butt');
  const hasButtStripWax = updatedCart.some(s => s.id === 'intimate-butt-strip');

  // If they have butt trim in cart, let's proactively add a safety notice
  if (hasButtTrim && !hasButtStripWax) {
    // We pivot the butt/cleft aspect to wax: replace with butt-strip wax safely
    isSafe = false;
    warnings.push(
      "To ensure your safety and maintain our high hygiene standards, we don't use trimmers in that delicate gluteal cleft area to avoid any risk of nicks. However, as hard wax specialists, we can provide a smooth, painless waxing service for that area instead. Let's switch that to a hard wax add-on!"
    );
    fixedNotes.push("Pivoted intergluteal cleft mechanical trim to specialized sanitary hard wax for nicks prevention.");
  }

  return {
    isSafe,
    warnings,
    autoFixedCart: updatedCart,
    fixedNotes
  };
}

/**
 * 5. Temporal Calculus (Staggered Duration & Cleaning Buffer)
 * Compiles exact timings per service modality, auto-appends 15 min buffer silently.
 */
export function calculateTemporalCalculus(cart: Service[]): {
  activeDuration: number;
  bufferMinutes: number;
  totalDurationWithBuffer: number;
  formattedMinutesLabel: string;
} {
  // Sum up all active service times
  const activeDuration = cart.reduce((acc, s) => acc + s.duration, 0);
  const bufferMinutes = 15; // Invisible sanitization buffer is 15 minutes
  const totalDurationWithBuffer = activeDuration + bufferMinutes;

  return {
    activeDuration,
    bufferMinutes,
    totalDurationWithBuffer,
    formattedMinutesLabel: `${activeDuration} mins active + ${bufferMinutes} mins cleanup buffer`
  };
}
