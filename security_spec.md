# Security Specification & Adversarial Threat Modeling
## Smooth Operator SF - Firestore Hardening

This document outlines the security architecture, critical data invariants, and adversarial test scenarios used to protect Smooth Operator SF's database assets.

---

### Part 1: Strategic Data Invariants

1. **Bookings (`/bookings/{bookingId}`)**:
   - Status transitions must be strictly linear: `pending` -> `accepted` | `declined`.
   - Creation is open to public, but initial status MUST be `pending`.
   - Contact email, phone, name, price, and duration are immutable after confirmation. Only Drew (Admin) can transition the status or append calendar integration keys (`googleEventId`).
   - Clients confirm age (Must be 18+) and NDA sign status (`ndaSigned` == true) to create.

2. **Blockouts (`/blockouts/{blockoutId}`)**:
   - Only Drew/Admin (`admin@smoothoperatorsf.com`) is certified to write, update, or clear blockouts.
   - Public users can list/read them to gray out dates on the booking date picker.
   - Blockout reasons and date entries must match length and format specifications.

3. **Drew Calendar Busy Slots (`/drew_calendar_busy_slots/{slotId}`)**:
   - Only Drew (Admin) can synchronize busy lists.
   - Public users can list/read them to identify slots to suppress.

---

### Part 2: The "Dirty Dozen" Threat Payloads
These 12 scenarios test the limits of our Firestore fortress by attempting to inject invalid schemas, escalate permissions, or forge relational states.

#### Booking Threat Vectors
1. **The Spoofed Admin Override**: A regular user tries to write directly to `/bookings/maliciousId` with status = `"accepted"` to bypass Drew's visual queue.
2. **The PII Harvest List**: An unauthenticated scrap-crawl attempts to perform a raw collection-wide query (`list`) on `/bookings` to read client phone numbers and names.
3. **The Shadow Parameter Injection**: A user tries to inject a hidden variable `"isVerifiedClient": true` or `"overrideAmount": 0.00` during slot booking.
4. **The Ghost ID Poisoning**: A user tries to create a booking using a 10KB junk-character string as the `bookingId` to cause Denial of Wallet resource fatigue.
5. **The Retro Temp Tamper**: Bypassing client checks to create a booking with an invalid date (`"date": "1990-12-12"` or `"10-10-2026"`).
6. **The Minor-Age Waiver Forgery**: An underage client tries to set `"isOver18": false` while bypassing client-side gatekeepers, or setting `"isOver18": true` without `"ndaSigned": true`.
7. **The Status Jump Hijack**: An authenticated student tries to transition their own record from `pending` directly to `accepted` without Drew's consent.

#### Blockouts Threat Vectors
8. **The Schedule Sabotage Attack**: An anonymous user sends a DELETE command to `/blockouts/2026_06_15` to open up Drew's private rest day.
9. **The Arbitrary Vacation Insertion**: A client submits a POST request to list a private blockout on a holiday to prevent others from booking.
10. **The Blockout Content Bloat**: Drew's account session gets intercepted and a malicious body injects a 5MB payload into the `reason` field of a blockout.

#### Busy Slots Threat Vectors
11. **The Slot Eraser Sweep**: An unauthorized webhook deletes busy intervals from `drew_calendar_busy_slots` to induce double-bookings.
12. **The Arbitrary Busy-Inject Play**: A client registers artificial busy slots across Drew's entire schedule using the busy slots write endpoint.

---

### Part 3: Test Verification Specifications

The corresponding security filters in `/firestore.rules` are tested to verify that each of the "Dirty Dozen" payloads yields a rigid `PERMISSION_DENIED` error.

| Collection | Action | Payload Condition | Expected Output | Security Rule Enforcer |
| :--- | :--- | :--- | :--- | :--- |
| `bookings` | list | Request from Non-Admin | `PERMISSION_DENIED` | `allow list: if isAdmin();` |
| `bookings` | create | `status == "accepted"` | `PERMISSION_DENIED` | `incoming().status == "pending"` |
| `bookings` | create | Missing `isOver18` (true) | `PERMISSION_DENIED` | `data.isOver18 == true` |
| `bookings` | create | Invalid ID format | `PERMISSION_DENIED` | `isValidId(bookingId)` |
| `bookings` | update | Request from Non-Admin | `PERMISSION_DENIED` | `allow update: if isAdmin();` |
| `blockouts` | create | Request from Non-Admin | `PERMISSION_DENIED` | `allow write: if isAdmin();` |
| `blockouts` | delete | Request from Non-Admin | `PERMISSION_DENIED` | `allow delete: if isAdmin();` |
| `busy_slots` | write | Request from Non-Admin | `PERMISSION_DENIED` | `allow write: if isAdmin();` |
