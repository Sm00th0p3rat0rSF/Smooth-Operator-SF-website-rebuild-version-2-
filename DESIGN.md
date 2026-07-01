# 💎 Smooth Operator SF — Comprehensive Design & Architecture Specification
*Master System Blueprint & Technical Specification*

This document serves as the official, unified design specification for the **Smooth Operator SF** booking and operations platform. It contains the exact technical architecture, state machines, business algorithms, visual design specs, and security rules.

---

## 🎨 1. Visual & Aesthetic Identity System

The user interface follows a custom **Premium Luxury & Confidence** aesthetic, rejecting generic templates and "AI slop" indicators (such as telemetry overlays, online status badges, or terminal output simulation) in favor of high-end tactile elegance.

### 🎨 Color Palette & Accents
*   **Base Background Canvas:** Deep Midnight Purple (`#06040a`) styled with layered ambient radial glows:
    -   Top Left: Deep Violet Glow (`rgba(135, 90, 240, 0.09)`)
    -   Bottom Right: Neon Green Glow (`rgba(57, 255, 20, 0.08)`)
*   **Active Neon Green Accent:** Highly vibrant, glowing Neon Green (`#39ff14`) used to indicate active client selections, checkboxes, hover triggers, and primary call-to-actions.
*   **Secondary Warm Gold Accent:** Noble Warm Gold (`#D4AF37`) used for headers, badges, warning icons, and delicate system details.
*   **Text Hierarchy:** Pristine White (`#ffffff`) for high contrast, paired with Creamy Silver-Grey (`#e5e7eb`, `#9ca3af`) for readable secondary copy.

### 🫧 Surfaces & Layering (Smokey Lavender Glass)
*   **The Muted Glass Engine:** Floating cards, overlay dialogs, and navigation headers implement a high-depth backdrop blur filter with luxurious transparency layers:
    -   `glass`: Rich, muted smokey lavender (`rgba(33, 27, 48, 0.76)`) outlined with a delicate lavender border (`rgba(168, 142, 224, 0.16)`) and `24px` backdrop blur.
    -   `glass-dark`: Deep midnight smokey lavender (`rgba(22, 18, 32, 0.90)`) for sub-regions and input backing.
    -   `glass-light`: Lighter translucent smokey lavender (`rgba(56, 48, 77, 0.62)`) for highlighting cards.
*   **The Rotating Constellation Header:** A custom vector-drawn canvas in the header renders gold star coordinates that gently rotate on randomized orbital paths, reflecting an elegant celestial aesthetic.

### ✍️ Typography Pairings
*   **Titles & Headings:** `Space Grotesk` (sans-serif, wide, geometric, tech-forward, tracking-tight).
*   **Readability Copy:** `Inter` (sans-serif, clean, proportional, spacious).
*   **Data & System Indicators:** `JetBrains Mono` (monospace, clear characters, high density for prices, buffer intervals, and dates).

---

## 📅 2. Interactive Body Map & Intelligent Set-Theory Engines

To provide a modern visual workflow, the application features an **Interactive Human Body Map** allowing clients to visually select target grooming zones directly from front and rear physical figure models.

### A. Core SVG Spot Coordinate Geometry & Views
*   **The Silhouette Stage:** A container holding absolute positioned photorealistic model layers (`Frontview.png` / `backview.png`) and an SVG coordinate overlay (`0 0 100 220` viewport space).
*   **Grid Calibration:** Displays a fine layout reference grid to fit targeted hotspots perfectly aligned with the biological contours:
    -   `face`: Coordinates `(50, 28)`
    -   `chest`: Coordinates `(50, 58)` (Front view only)
    -   `stomach`: Coordinates `(50, 82)` (Front view only)
    -   `arms`: Coordinates `(24, 80)`
    -   `intimate`: Coordinates `(50, 112)` (Front view only, defaults to active hotspot on load)
    -   `legs`: Coordinates `(40, 160)`
    -   `shoulders`: Coordinates `(28, 62)` (Back view only)
    -   `back`: Coordinates `(50, 72)` (Back view only)
    -   `butt`: Coordinates `(50, 114)` (Back view only, defaults to active hotspot on load)

### B. Hotspot Interactions & Responsive States
*   **Interactive Hotspot Rings:** Rendered as SVG groups with a visual center point (`r = 2.2` styled with active neon green stroke) and an invisible double-sized click target for high touch precision on mobile screens.
*   **Glowing Ambient Waves:** On hover or active selection, hotspots activate a smooth, glowing background animation utilizing a radial gradient (`#39ff14`) pulsing dynamically between `1.3x` and `2.2x` radius values.
*   **Dual-View Synced Defaulting:** Swapping from Front to Back view automatically shifts active selections to `butt`. Swapping from Back to Front view automatically defaults active selections back to `intimate`.
*   **Zone Selection Card:** The right panel displays a responsive layout reflecting active hotspot details, listing specific services categorized under `manscape` or `wax`, including duration indices, descriptions, and instantaneous cart additions.

## 📅 3. AI Appointment Consultant & Algorithmic Set-Theory Matrices

To prevent redundant charges, double-billing, and skin injuries, the booking system handles inputs using a set-theory intersection matrix.

### A. Intimate Anatomy Defaulting & Selection Toggle
*   **Context:** Intimate waxing (e.g., Brazilian, Bikini Full) is split based on anatomy (Penis or Vagina variants) due to technical complexity and material differences.
*   **Rule 1 (The Penis Default):** Any ambiguous, un-specified, or raw query for an intimate waxing service automatically defaults to the **(Penis)** variant first.
*   **Rule 2 (Reassuring Context Note):** Upon defaulting to the (Penis) variant, the consultant engine must output this exact helpful friendly notice:
    > *"Since intimate waxing varies by anatomy, I pre-selected the (Penis) option for now. Please feel free to toggle it to (Vagina) below if that fits you better so Drew can reserve the perfect time!"*
*   **Rule 3 (Instant Toggle):** The UI renders an anatomy-swap switch allowing clients to instantly toggle between `Penis` and `Vagina` anatomical variants with a single tap.

### B. Spatial Overlap Prevention (Double-Billing Matrix)
The booking engine monitors items in the user's cart and automatically resolves overlaps to avoid charging twice for overlapping areas:
1.  **The Brazilian Supremacy:** If a client chooses both **Bikini Full** and **Butt Strip** (intergluteal cleft), they are automatically merged into a single **Brazilian** ($90.00 value) rather than double-charging.
2.  **The Cheek-to-Strip Overlap Guard:** 
    *   *The Conflict:* A Brazilian covers the pubic zone + perineum + butt strip. A Butt - Full covers the gluteal cheeks + butt strip. Booking both causes double-billing for the butt strip.
    *   *The Smart Resolution:* The engine intercepts this intersection and replaces the selection with **Bikini - Full (Penis/Vagina) + Butt - Full**. This guarantees gap-free, front-to-back coverage with zero duplicate fees, saving the client **$15.00** instantly. A clear explanation of this cost-effective choice is displayed in the billing breakdown.

### C. Container Inclusion Truncations (Subsets)
The cart automatically audits nested sub-zones and replaces them with parent bundles to keep the checkout neat:
*   **Full Face:** Automatically consumes and replaces separate items for: *Eyebrows, Nose, Ears, Chin, and Front of Neck*.
*   **Full Legs:** Automatically consumes and replaces: *Upper Legs, Lower Legs, and Inner Thigh*.
*   **Full Back:** Automatically consumes and replaces back trimming adjustments.
*   **Full Arms:** Automatically consumes and replaces: *Half Arm*.

### D. Hygiene Safety Clipper Lock (Butt Strip Enforcement)
*   **Rule:** Mechanical clippers are strictly prohibited in the intergluteal cleft (butt strip) due to laceration risks.
*   **Action:** If a client selects a trimming/detailing mode and pairs it with a butt strip/cleft service, the system automatically overrides the cleft service to **sanitized hard wax**, flashing an reassuring safety notice.

---

## 🔒 3. Mandatory Security & Intake Gates

Before a client can access Stripe card tokenization, they must complete a multi-stage gatekeeping sequence:
1.  **Age Verification Check:** Input fields validating the client is **18 years or older** by verifying their Date of Birth, with a high-fidelity ID upload preview.
2.  **Skincare Safety Gate:** A real-time modal warning pops up if any facial waxing service is selected. If the client indicates active use of **Retin-A, Accutane, or active Retinols within 7 days**, the system blocks facial wax and suggests body waxing/grooming alternatives.
3.  **Digital client NDA & Signature:** A HTML5 Canvas-based signature pad allows clients to write their handwritten consent signature.
4.  **Cancellation Policy Commitment:** Clients must check a box agreeing to 24-hour late cancellation and no-show policies.

---

## 💳 4. Secure Zero-Upfront Tokenization (Stripe Cards)
*   No upfront charges are processed at the time of booking.
*   The system uses **Stripe Elements SetupIntents** to safely authorize and lock the client's credit card credentials into Stripe's secure PCI-compliant vault.
*   This secures the appointment block against last-minute cancellations without locking client capital beforehand. Raw card details are never processed or saved in client state or Firestore.

---

## 🕒 5. The Invisible Turnaround Buffer (Sanitary 15)
*   **Calculation:** The total duration of all selected services is calculated by aggregating individual service times.
*   **The Buffer:** The booking system silently appends an **invisible 15-minute sanitization/prep buffer** to the end of the total block.
*   **Visibility:** This buffer is completely hidden from client-facing checkout screens, but is written to Google Calendar to ensure Drew has time to sanitize the room before the next client.

---

## 💻 6. Google Workspace & Ledger Sync Hub

When authorized by the administrator (`admin@smoothoperatorsf.com`), the application interacts with Google Workspace APIs to set up a clean folder structure inside Drew's Google Drive:

1.  **Master Folder:** `Smooth Operator SF Studio Hub`
2.  **Nested Safety Vault:** `Smooth Operator SF NDA & Safety Waiver Vault` (storing signed client NDA waivers in PDF format, complete with signature, IP address, and browser User-Agent audit logs).
3.  **Unified Business Ledger:** A central Google Sheet (`Smooth Operator SF - Appointments Ledger`) with three dedicated live-sync tabs:
    *   `Appointments Ledger` (appointment records, times, status, payment details)
    *   `Prepaid Packages` (credit balances, sessions remaining)
    *   `Contacts Directory` (customer profiles, anatomy records, wax vs trim preferences)
4.  **Intake Form:** A custom generated Google Form (`Smooth Operator SF - Client Intake & Consent Form`) is established within the directory for offline patient onboarding.

---

## 🚀 7. Aftercare & Engagement Engine

Upon approval of an appointment, the aftercare pipeline dispatches automatic care reminders:
*   **Immediate (24h/48h/72h) Guidelines:** Reminds clients of critical milestones: no high-friction workouts (24h), no pool/steam water contact (48h), and no strong chemical exfoliators (72h).
*   **The 4-Week Retention Loop:** Dispatches a gentle check-in at 3.5 weeks to prompt hair-growth synchronization and secure a recurring booking.
