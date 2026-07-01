# 🚀 Emergent Master Build Prompt — Smooth Operator SF

Copy the prompt below to instruct **Emergent** (or any advanced AI agent) to build this entire luxury full-stack booking and studio management application from scratch.

---

```text
You are an elite, full-stack software engineer and lead designer. Build "Smooth Operator SF", a high-end luxury client booking and workspace administration system for an intimate grooming/waxing studio. The app must run on Node.js/TypeScript using Express, React 19, Tailwind CSS v4, Framer Motion, and Firebase. 

Follow these absolute rules, technical systems, and visual guidelines:

=========================================
1. VISUAL SYSTEM & BRAND PHILOSOPHY
=========================================
* Theme: Material 3 + Smokey Lavender Frosted Glass. Do not use generic white cards or generic purple gradients. No tech-larping indicators (e.g., no telemetry logs, online status indicators, container info, or mock terminal lines).
* Color Palette:
  - Base Background Canvas: Deep Midnight Purple (#06040a) styled with ambient layered radial glows: a deep violet glow (rgba(135, 90, 240, 0.09)) in the top-left and a neon green glow (rgba(57, 255, 20, 0.08)) in the bottom-right.
  - Active Accent Color: Glowing Neon Green (#39ff14) for client selections, checkboxes, glowing button shadows, and primary CTAs.
  - Secondary Accent Color: Noble Warm Gold (#D4AF37) for premium headers, warning icons, and delicate label highlights.
* Font Pairings:
  - Display/Titles: Space Grotesk (sans-serif, tracked-tight, geometric-tech).
  - Body/Interface Copy: Inter (proportional, modern sans-serif).
  - Pricing/Time/Technical: JetBrains Mono (monospaced).
* CSS Classes & Elements:
  - glass: Rich, muted smokey lavender (rgba(33, 27, 48, 0.76)) with an elegant lavender border (rgba(168, 142, 224, 0.16)) and 24px backdrop-filter blur.
  - glass-dark: Deep midnight smokey lavender (rgba(22, 18, 32, 0.90)) for input backgrounds and nested containers.
  - glass-light: Translucent smokey lavender (rgba(56, 48, 77, 0.62)) for card highlights.
  - Header Banner: Render a rotating celestial animation containing elegant golden star vector elements spinning on randomized orbital paths.

=========================================
2. THE AI APPOINTMENT CONSULTANT & CART ENGINE
=========================================
Build an interactive appointment scheduler featuring a conversational AI assistant block alongside a structured service picker categorized into: Face, Torso, Limbs, Grooming/Manscaping, and Intimate.

Implement these precise logic matrices:
- Anatomy Defaulting:
  * Intimate waxing is split by anatomy (Penis vs. Vagina). Any ambiguous or unspecified intimate grooming request (e.g., "wax my private area") MUST default to the "Penis" variant first.
  * When defaulted, the AI consultant block must output this exact message:
    "Since intimate waxing varies by anatomy, I pre-selected the (Penis) option for now. Please feel free to toggle it to (Vagina) below if that fits you better so Drew can reserve the perfect time!"
  * The UI must render a highly visual, premium toggle switch to instantly swap the intimate anatomy variant between Penis and Vagina.
- Spatial Overlap Prevention (Double-billing rules):
  * The Brazilian Supremacy: If a client selects both "Bikini Full" and "Butt Strip", automatically merge them in the cart as a unified "Brazilian" ($90.00 value) to avoid duplicate fees.
  * The Cheek-to-Strip Overlap Guard: If a client requests both "Butt - Full" (gluteal cheeks + butt strip) and "Brazilian" (which already includes the butt strip), intercept this and replace the selection with "Bikini - Full + Butt - Full". This provides front-to-back coverage with zero redundant butt-strip fees, saving the client $15.00 instantly. Explain this cost-effective, smart choice clearly in the pricing details.
- Container Inclusion Truncations:
  * Full Face: Consumes and replaces Eyebrows, Nose, Ears, Chin, and Front of Neck.
  * Full Legs: Consumes and replaces Upper Legs, Lower Legs, and Inner Thigh.
  * Full Back: Consumes and replaces Back Trimming.
  * Full Arms: Consumes and replaces Half Arm.
- Hygiene Clipper Lock:
  * Trimming/manscaping clippers are strictly prohibited in the intergluteal cleft (butt strip) due to severe skin laceration risks.
  * If a client pairs a clipper/trimming service with a butt strip/cleft service, automatically override the cleft service to "sanitized hard wax", flashing a reassuring safety alert detailing the safety reasons.

=========================================
3. INTERACTIVE HUMAN BODY MAP DIAGRAM
=========================================
Build an interactive 2D anatomical silhouette selector to allow clients to select grooming zones directly from front/back figures:
- Layout and Assets:
  * Use front and back photographic images as model backgrounds (Frontview.png and backview.png) layered under a responsive SVG canvas (using a calibrated viewBox="0 0 100 220").
  * Implement front/back view controllers that smoothly transition opacity states of model layers.
- SVG Spot Coordinates:
  * Map circular hotspots at biological coordinates: face (50, 28), chest (50, 58), stomach (50, 82), arms (24, 80), legs (40, 160), shoulders (28, 62), back (50, 72), intimate (50, 112 - Front View), and butt (50, 114 - Back View).
- Micro-interactions:
  * Hotspot rings should have a small visual pointer center (r=2.2) and a generous invisible touch overlay to facilitate easy tap selection on mobile screens.
  * Active or hovered hotspots must show an animated radial pulse gradient (#39ff14) breathing dynamically.
  * Swapping views must automatically focus relevant target zones (e.g. Front View centers on "intimate", Back View centers on "butt").
- Zone Selection Card:
  * Render a sidebar or adjacent context card displaying services within the active zone. Categorize services under "manscape" (gold label) and "wax" (green label), showing prices, duration times, descriptions, and a direct "Add to Book" cart button.

=========================================
4. MANDATORY SECURITY & INTAKE GATES
=========================================
Before a client can access Stripe card tokenization, they must complete an interactive multi-step compliance sequence in this order:
1. Age Gate: Enforce an 18+ limit via date of birth input, plus a mock ID card photo upload preview.
2. Skincare Safety Gate: If a facial service is selected, prompt a modal asking about Accutane, Retin-A, or active Retinols within 7 days. If checked, advise against facial waxing and suggest body waxing or grooming alternatives.
3. Canvas Signature Pad: Embed a fully functioning canvas-based signature pad allowing clients to sign their digital NDA.
4. Cancellation policy: Client must check a box agreeing to 24h cancellation penalties.

=========================================
5. STRIPE ZERO-UPFRONT TOKENIZATION
=========================================
* Capture client card details using a Stripe Elements SetupIntent. No upfront charge is processed.
* This secures the booking block against last-minute no-shows. Raw card details are kept strictly PCI-compliant—never entering application state or Firestore.

=========================================
6. THE INVISIBLE TURNAROUND BUFFER (SANITARY 15)
=========================================
* For every appointment request, aggregate the total selected service times.
* Automatically and silently append an invisible 15-minute sanitization/cleaning buffer to the total slot duration.
* This buffer must remain strictly hidden from the customer-facing frontend, but is saved and written to Drew's Google Calendar event.

=========================================
7. STAFF DASHBOARD & WORKSPACE LEDGER SYNC HUB
=========================================
Implement a secure staff route (/admin) restricted exclusively to verified administrator accounts (admin@smoothoperatorsf.com).

Provide these administrative interfaces:
- Pending Proposal Queue: Displays upcoming client bookings with submitted signatures, age checks, and skin safety cards. Admin can click "Approve" or "Decline".
  * Approving an appointment instantly dispatches a calendar invite and schedules a Google Calendar block matching the aggregated duration plus the invisible 15-minute buffer.
- Workspace Sync Hub: A floating lock widget (or admin panel button) to authorize Google Workspace OAuth.
  * Upon first-time authorization, the system establishes a clean nested folder hierarchy in Drew's Google Drive:
    - Master Directory Folder: "Smooth Operator SF Studio Hub"
    - Subfolder Vault: "Smooth Operator SF NDA & Safety Waiver Vault" (securing signed NDAs as compiled PDFs containing signatures, client IP address, and browser User-Agent audit trails).
    - Spreadsheet Ledger: "Smooth Operator SF - Appointments Ledger" with three active syncing tabs: "Appointments Ledger", "Prepaid Packages", and "Contacts Directory".
    - Standard Intake Form: "Smooth Operator SF - Client Intake & Consent Form" (created and nested in the master directory).

=========================================
8. AFTERCARE & ENGAGEMENT ENGINE
=========================================
Upon approval of a booking, automatically initialize two automation triggers:
* Immediate care guidelines: Dispatched with critical care milestones (24h no friction workouts, 48h no pool/steam contact, 72h no chemical exfoliators).
* The 4-Week Retention Loop: Schedules a gentle loyalty reminder at 3.5 weeks to synchronise hair-growth cycles.

=========================================
9. TECH ARCHITECTURE & COMPILATION PIPELINE
================================================
- Build a full-stack SPA. Place backend server endpoints in server.ts (Express v4) and frontend code under /src.
- Route all database, Google Workspace, and Stripe API requests through Express api routes (/api/*) to protect API keys.
- Set up process.env.GEMINI_API_KEY for server-side AI requests.
- Configure scripts in package.json:
  * "dev": "tsx server.ts"
  * "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs"
  * "start": "node dist/server.cjs"
- Express server must mount Vite as middleware in development, and serve the static /dist directory on all SPA fallback routes in production, binding to host "0.0.0.0" and port 3000.
```
