# 👑 Smooth Operator SF — Operator's Setup & Operations Handbook
*Official Operations & Configuration Guide for Drew and Studio Personnel*

Welcome to the **Smooth Operator SF Booking & Staff Management Ecosystem**. This system was meticulously crafted to align with modern full-stack web standards, offering high-end **Material 3 Frosted Glass UI** aesthetics, advanced client screening safeties, zero-redundant-charge booking matrices, and Google Workspace integrations.

Below is your comprehensive handbook detailing how to manage the system, configure its API hooks, and understand the internal execution engines.

---

## 🎨 1. Visual & Aesthetic Philosophy
The interface was custom-styled based on a **Premium Luxury & Confidence** theme, departing from standard low-quality layouts:
*   **Color Palette**: Deep Charcoal canvases, paired with warmth contrast using noble Gold (`#D4AF37`) accents and highly active Neon Amber/Green references for system status.
*   **Layering**: Built using a frosted glass backdrop blur mechanism (`backdrop-filter: blur(...)`) to emulate real-world tactile depth.
*   **The Sparkling Logo**: Features elegant vector-drawn star particles rotating on randomized orbit trajectories to draw dynamic attention to your high-end brand name.

---

## 🔒 2. Mandatory Intake Gate & Safety Controls
Before allowing any customer to access Stripe token collectors, they are programmatically guided through a secure four-tier compliance sequence:
1.  **Age Verification**: Clears and validates that the client is 18 years or older for private intimate sessions.
2.  **Chemical Checklist (Skin Safety)**: Explicitly asks the client if they are using Accutane, Retin-A, or active retinols on target zones to avoid mechanical skin lifting.
3.  **Digital Client NDA & Signature**: Features a canvas-based handwritten signature pad providing full, binding confidentiality agreements.
4.  **Cancellation Policy Acknowledgement**: Securely commits the client to the 24-hour look-ahead ruleset.

---

## 📅 3. Real-Time Overlap Prevention & Set-Theory Subset Matrix
The application handles multi-selection booking conflicts using a set-theory intersection matrix to protect clients from redundant double-charges:

### A. Intimate Anatomical Defaults & Sparing Alternatives
*   **Ambiguity Defaulting**: An anatomical toggle automatically splits intimate services (Penis or Vagina variants). If an ambiguous request arrives, the engine **defaults to the (Penis) variant** and shows this reassuring disclaimer:
    > *"Since intimate waxing varies by anatomy, I pre-selected the (Penis) option for now. Please feel free to toggle it to (Vagina) below if that fits you better so Drew can reserve the perfect time!"*
*   **Intimate Set Rules**: The system allows only **one** intimate service per slot. Selecting another intimately scoped item replaces the current choice.

### B. Double-Billing Intersections (Brazilian + Butt Full)
*   **The Conflict**: A Brazilian covers the pubic area **plus** the perineum and the butt strip. A Butt Full covers the cheeks **plus** the butt strip. Booking both results in redundant charges for the butt strip.
*   **Resolution**: When both are in the cart, the system swaps them out for **Bikini - Full + Butt - Full**. This guarantees flawless, gap-free, front-to-back coverage with zero duplicate fees, saving the client **$15.00** instantly!

### C. Container Inclusion Truncations (Subsets)
The client cart automatically audits itself and drops redundant, smaller fees into the parent bundle:
*   **Full Face**: Consumes Eyebrows, Nose, Ears, Chin, and Front of Neck.
*   **Full Legs**: Consumes Upper Legs, Lower Legs, and Inner Thigh.
*   **Full Back**: Consumes and replaces back trimming adjustments.
*   **Full Arms**: Consumes Half Arm.

---

## 🛡️ 4. Hygiene Safety Enforcement
To protect your clients and enforce sanitary standards, **mechanical clippers are strictly prohibited in the intergluteal cleft (butt strip)**.
*   If a client tries to pair a trimming mode with a butt cleft service, the engine catches this and automatically switches the butt strip subset to **sanitized hard wax**, issuing an reassuring safeguard warning to keep them safe from nicks or lacerations.

---

## 🕒 5. The Invisible Turnaround Buffer
To support the busy schedule of the studio, every service session requires room cleanup, sanitation, and preparation:
*   The system aggregates the exact duration of each element.
*   **Behind the scenes, the system silently appends a 15-minute sanitization/prep buffer to the total event duration.**
*   This buffer is completely hidden from the client but is written directly to **Google Calendar** so Drew never experiences back-to-back bookings with zero time to reset.

---

## 💻 6. Step-by-Step Setup Guide

To fully connect this live system to your studio operations, execute these steps:

### Step A: Connect Google Workspace & Automated Folder Structuring
Your system has been upgraded to **automatically organize your entire Google Workspace**. Instead of scattering files in your top-level Google Drive, the sync engine creates a cohesive, beautiful corporate hierarchy on Drew's account:
1. **The Master Directory (`Smooth Operator SF Studio Hub`)**: The system automatically creates a central directory folder in your Google Drive on authorization.
2. **Appointments & Business Ledger**: Inside the master folder, it initializes a central Google Sheet (`Smooth Operator SF - Appointments Ledger`) complete with three live syncing tabs:
    *   `Appointments Ledger` (complete automated checkouts and tracking stats)
    *   `Prepaid Packages` (prepaid sessions tracking)
    *   `Contacts Directory` (customer contact profiles and preferences)
3. **The Secure Vault Folder**: Programmatically nested inside the main directory, the `Smooth Operator SF NDA & Safety Waiver Vault` folder securely archives every signed client NDA and verification check as a discrete document.
4. **Interactive Consent Form**: A brand-new custom pre-visit registration Google Form (`Smooth Operator SF - Client Intake & Consent Form`) is generated fresh and placed clean inside your studio folder.

To activate this sync:
1.  Navigate to your live app and open the **Workspace Sync Hub** floating lock button in the bottom right corner (or sign in via `/admin`).
2.  Click **Authorize Google Workspace** to log in with Drew's Google account (`admin@smoothoperatorsf.com`).
3.  The system starts **completely fresh**, instantly initializing, branding, and nestedly structuralizing all assets listed above. You get zero duplicates and zero manual setup burden!

### Step B: Setup Firebase & Auth
The database runs server-side via Node, keeping client signatures, appointment dates, and holiday bookings secure. Ensure Firestore is provisioned in your Firebase console.

### Step C: Stripe Zero-Upfront Tokenization (Anti-Cancellation)
Card inputs are built using **Stripe Elements SetupIntents**.
*   This verifies and holds the card secure on Stripe's PCI-compliant vaults.
*   Clients are **not** charged at booking. It simply locks their credentials so your cancellation policies can be fully enforced. Stripe token keys are saved server-side—never in raw form on-screen.

---

## 🌿 7. Aftercare & Loyalty Automation
Once an appointment proposal is approved in the Pending queue, the aftercare automation pipeline triggers:
*   **Immediate 24-48-72h Care Guidelines**: Sends a mobile reminder containing rules on high sweat limits (24h), direct pool/steam contact limits (48h), and hard chemical exfoliation limits (72h).
*   **The 4-Week Sync Loop**: At the 3.5-week mark, an automated reminder is sent to keep hair growth synchronized, preserving the painless nature of regular appointments.
