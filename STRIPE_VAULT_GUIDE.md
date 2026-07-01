# 💳 Stripe In-App Card Vault & Payment Guide

This document describes how the card authorization and vault systems work inside the Smooth Operator SF booking portal. The system supports two distinct charging flows designed to secure bookings against "no-shows" or sudden cancellations without keeping sensitive payment details on local storage or Firestore databases.

---

## 🔍 Architecture & PCI-Compliance State

The Smooth Operator SF system operates under absolute security compliance:
1. **Zero Raw Numbers Store**: Raw credit card details (card numbers, CVV, expiry intervals) are **never** logged to the client state, saved inside Firestore, or sent to server-side telemetry.
2. **SetupIntents Tokenization**: Instead, card parameters are captured directly via Stripe's encrypted secure iframe components (Stripe Elements) or external payment gateways.
3. **No Upfront Charge**: Both modes enforce a **$0.00 zero-value pre-authorization hold**. The customer's credit card is validated, verified, and vaulted. It is *only* ever billed if the client violates the 24-hour studio cancellation policy or fails to attend.

---

## 🛠️ The Two Supported Processing Modes

Drew can toggle between these modes at any time inside the **Workspace Sync Hub** (located in the bottom right corner of the website or `/admin` dashboard panel):

### 1. In-App Vault Mode (Sandbox Tokenizer)
* **How It Works**: The card inputs are rendered as a custom-styled, elegant glass design block directly within Step 3 of our booking page.
* **Token Handshake**: When the client inputs their card details, Stripe tokenizes the information and returns a secure multi-use token ID (e.g., `tok_cardhold_preauth_...`).
* **Security Flow**: Only this sanitized token string is saved to the Firestore document inside the `stripeCardHoldToken` field.
* **Settlement**: Drew sees the billing token inside his Staff operations ledger but never views the raw financial parameters.

### 2. External Link Mode (Standard Stripe Link)
* **How It Works**: Tapping "Proceed to Pre-auth Hold" opens a beautiful, specialized Stripe Checkout page configured as a SetupIntent in a secure browser tab.
* **The Process**:
  1. The client is prompted to hit the gold action button: `"Open Secure Stripe Holding Link"`.
  2. This redirects the client to Drew's official payment setup URL (e.g., `https://book.stripe.com/smoothoperatorsf`).
  3. Once they confirm their card pre-authorization, they return to the booking portal, click the security checkbox, and complete their slot proposal.
* **Benefits**: Restricts 100% of the interface and browser environment tasks strictly to Stripe's own domains, yielding zero-friction trust for security-focused client demographic groups.

---

## 🛡️ Administrative Controls (Change Modes)

To switch modes, Drew completes these steps:
1. Open the website homepage and click the **Workspace Sync Hub** (Gold Lock button) in the bottom right corner.
2. Under the **Stripe Pre-Auth Gateway** box, toggle the active mode:
   * **External Link**: Paste your clean Checkout or Stripe Payment Link.
   * **In-App Vault**: Enables direct card holds directly within the applet.
3. Click **Save Stripe Settings**. The change is active immediately across all incoming client booking sessions!
