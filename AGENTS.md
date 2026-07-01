# Smooth Operator SF — AI Agent Training & Developer Guidelines

This file serves as the official source of truth and custom instructions for any AI agents editing or interacting with this codebase. The system automatically loads this file to train the booking consultant and align development work.

---

## 🎨 Styling & Brand System (Material 3 + Frosted Glass)
* **Visual Aesthetic:** Premium, magical, high-confidence styling.
* **Palette:** Smokey Lavender / Deep charcoal backgrounds with warm gold (`#D4AF37`) accent details, contrasted with high-visibility vibrant elements like bright neon green/amber where appropriate to highlight system selections.
* **Surfaces:** Floating cards, headers, and modals must always use a "Frosted Glass" back-drop blur (`backdrop-filter: blur(...)`) to maintain a luxury, premium look.
* **Vibe Pairings:** "Space Grotesk" display typography for titles, "Inter" for readable UI copy, and "JetBrains Mono" for programmatic indicators and pricing details.

---

## 📅 AI Appointment Consultant — Rules & Selection Logic

### 1. Genital & Anatomy Discernment (Penis vs. Vagina Defaulting)
* **Context:** Intimate waxing services (e.g., Brazilian, Bikini Full) are split based on anatomy (Penis or Vagina variants) due to differences in duration, required materials, and technical complexity.
* **Rule 1 (Data-driven Default):** Since the majority of Drew's clientele have penises, any ambiguous or unspecified intimate waxing requests **MUST default to the (Penis) service variant** first.
* **Rule 2 (Clarification Instruction):** When selecting the default (Penis) variant for an ambiguous request, the AI consultant **MUST** output this exact friendly notice inside the `explanation` response:
  > *"Since intimate waxing varies by anatomy, I pre-selected the (Penis) option for now. Please feel free to toggle it to (Vagina) below if that fits you better so Drew can reserve the perfect time!"*
* **Rule 3 (Anatomy Toggle):** The UI must always render a clean swap button allowing the client to instantly switch the selected anatomical variant (e.g., swapping `Brazilian (Penis)` to `Brazilian (Vagina)` and vice-versa) with a single tap.

### 2. Spatial Overlap Prevention (Algorithmic Logic)
* **Context:** The booking system prevents duplicate area charges and overlap prices via smart service grouping.
* **The Brazilian Supremacy:** If a client requests both "Bikini Full" and "Butt Strip" (front and rear intimate cheeks/crease), automatically merge or represent them together as a unified **Brazilian** ($90 value) rather than double charging.
* **Overlap Pairing & No Double Cheeks charges:** If a client requests the glutes/cheeks area and a Brazilian, recommend **Bikini - Full (Penis/Vagina) + Butt - Full**. The Brazilian already covers the perineum/butt strip; pairing it with `Butt - Full` causes dual-overlapping charges for the butt strip. `Bikini - Full` + `Butt - Full` covers the entire posterior and groin flawlessly with zero duplicate fees. Explain this smart, cost-effective choice proudly in the consultant's feedback.
* **Inclusion Rules:**
  * **Full Legs:** Automatically includes Inner Thigh coverage.
  * **Full Face:** Automatically includes Eyebrows, Nose, and Ears waxing details to keep the client's look neat.
* **Body Proximity Pairings (Smart Cross-Selling):**
  * **Chest:** If a client requests a Chest service, the system must recommend adding **Stomach - Full** and **Shoulder Waxing** to form a seamless, athletic neck-to-waistline torso transition.

### 3. The Sanitary 15 (Buffer Calculus)
* **Context:** Every appointment requires a clean workspace turnaround before the next client arrives.
* **Rule:** The system must automatically and silently append an **invisible 15-minute sanitization/cleaning buffer** to the total aggregated slot duration when checking availability or saving the appointment to Drew's Google Calendar. This buffer must remain strictly hidden from the customer-facing frontend.

### 4. Operational Sequencing Rule
* **Rule:** Maintain proper service state flags. Waxing configurations must always be prioritized to execute completely in full before manscaping (clipper detailing) workflows begin.

---

## 🔒 Security, Compliance, & Care Instructions

* **Stripe Cards Policy:** Capturing user cards via Stripe SetupIntents is strictly for securing bookings against last-minute cancellations. No upfront charges are made. PCI compliance must be maintained; raw details are never allowed into application state or Firestore.
* **Mandatory Intake Guards:** A strict multi-step gate must be finished before proceeding to payment:
  1. **Age Validation:** Enforce an 18+ restriction via date of birth input verification and an ID document upload preview.
  2. **Skincare Safety Gate:** Force a real-time modal warning for any facial service selection. If a client flags active use of Retin-A, Accutane, or active Retinol within 7 days, programmatically advise against the facial service while suggesting body alternatives.
  3. **Canvas-style Digital NDA signature pad** and cancellation policy reviews.
* **High-Fidelity PDF Waiver Archive:** All completed digital NDAs must be written to Google Docs, exported as authenticated PDF binaries complete with client Signatures, IP Address, and browser User-Agent audit trails, and filed securely in Drew's non-disclosable Drive folder.
* **Post-Care & Engagement Automation:** Confirmation flows and retention jobs must remind users of critical post-wax care milestones (e.g., 24h no workout, 48h water exposure, 72h exfoliation limits) and the 3.5 to 4-week window to preserve hair-growth synchronicities.
