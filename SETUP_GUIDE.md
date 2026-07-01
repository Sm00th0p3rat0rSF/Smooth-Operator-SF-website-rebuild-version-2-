# Smooth Operator SF — Production Setup & Hosting Guide 💆‍♂️✨

Welcome to your premium booking and operations system, Drew! This guide is designed specifically for you. Even if you are not an engineer, following these simple steps will allow you to successfully run, host, and connect your new booking system to **Google Calendar**, **Firebase Firestore**, and **Stripe**.

---

## 🎨 Creative Concept: The Dreamscape Experience
Every pixel of your app is designed to look like a **luxurious physical studio**:
- **Smokey Lavender Backgrounds**: Provide a soothing, high-faith, dream-like atmosphere.
- **Micro-Pulsating Lavender & Indigo Blobs**: Bring depth and movement, making the digital storefront feel alive.
- **Neon Green Highlights (#39ff14) with Radiant Glows**: Guide your clients through the booking journey like high-confidence signs to prompt actions.

---

## ⚙️ How the System Works (Under the Hood)

Your booking system is elegant but hides highly robust rules:

1. **The Human Body Map Selection**: Customers select areas of their body graphically (Face, Chest, Intimate Zone, Legs, etc.) on an interactive silhouette. The cart automatically groups these.
2. **Invisible Turnaround Buffer**: When a client picks services adding up to, say, **40 minutes**, the system automatically and silently appends **15 minutes** of sanitation/cleaning buffer. Drew gets **55 minutes** blocked off on his calendar, but the client only sees the official 40-minute duration.
3. **The Multi-Step Gate**:
   - **Age Gate**: Confirms the client is 18+ for intimate waxing.
   - **Skincare Safety**: Confirms the client is not on skin-thinning drugs (Accutane, Retin-A).
   - **Digital Non-Disclosure (NDA)**: Signs an elegant contract with a typed signature pad to maintain ultimate privacy.
4. **No-Show Card Holds (Stripe Elements)**: Card details are collected securely via Stripe Elements. The system **never** charges clients on checkout. It requests a secure *Pre-authorization Hold token* (`SetupIntent`). If a client doesn't show up, you have the hold registered safely without storing credit cards on your own database (100% PCI security).
5. **Drew's Admin Dashboard (Google Log In)**: You sign in using your official Smooth Operator SF Google Account. You can see all booked appointments, click **Accept** to automatically invite them and drop the booking with the 15-minute hidden buffer in your **Google Calendar**, or trigger Vacation holds.

---

## 🚀 Step 1: Create Your Firebase Database (Free Tier)
Firebase acts as your secure storage container, saving all customer appointments, intake shapes, and signed NDAs.

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Name your project (e.g., `smooth-operator-sf`) and click **Continue**. Disabling Google Analytics for now is fine to keep it simple.
3. Once the project is active, click the **Web icon (`</>`)** on the main dashboard to register a web app. Name it `website-booking`.
4. Firebase will show you a configuration block that looks like this:
   ```json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "smooth-operator-sf.firebaseapp.com",
     "projectId": "smooth-operator-sf",
     "storageBucket": "smooth-operator-sf.firebasestorage.app",
     "messagingSenderId": "...",
     "appId": "..."
   }
   ```
5. Paste these values directly inside your project file: `/firebase-applet-config.json` (this tells your website how to talk securely to your database).
6. In the left navigation sidebar of your Firebase console, click **Firestore Database** and then click **Create Database**. Choose **Start in Production Mode** and select your region (e.g., US-West or US-East).

---

## 🔑 Step 2: Set Up Google Login & Clean Google Workspace Sync
To allow you to log in as the Administrator and securely synchronize bookings with your entire Google Workspace:

1. In your Firebase console sidebar, click **Build** -> **Authentication** -> **Get Started**.
2. Choose **Google** as your sign-in provider, click **Enable**, select your support email (`admin@smoothoperatorsf.com`), and click **Save**.
3. Next, navigate to your live application homepage. Locate the floating gold **Workspace Sync Hub** lock shield in the bottom right corner (or enter the `/admin` dash).
4. Click **Authorize Google Workspace** to authenticate with your official Google Account (`admin@smoothoperatorsf.com`).
5. **Fresh Start Initialization**: Upon login, the app bypasses messy Drive searches and automatically establishes a beautiful organizational directory structure on your Google Drive:
   - **`Smooth Operator SF Studio Hub`** (Master parent folder in Google Drive)
     - `Smooth Operator SF - Appointments Ledger` (Unified Google Spreadsheet with dynamic Tabs for `Appointments Ledger`, `Prepaid Packages`, and `Contacts Directory` CRM)
     - `Smooth Operator SF NDA & Safety Waiver Vault` (Private subdirectory for signed waiver text documents)
     - `Smooth Operator SF - Client Intake & Consent Form` (Freshly launched customer-facing Google registration Form)
6. This connection automatically maps accepted bookings directly to your Google Calendar, displaying the correct aggregated duration block plus your hidden 15-minute cleaning buffers, rendering perfectly on your Google Pixel "At a Glance" widgets, Pixel watches, and Android accessories!

---

## 💳 Step 3: Get Your Stripe Secrets (Pre-Auth Holds)
To protect your business against last-minute cancellations without charging people upfront:

1. Log into your [Stripe Dashboard](https://dashboard.stripe.com/).
2. Switch to **Developers** on the top right, then select **API Keys**.
3. You will see two keys:
   - **Publishable Key** (starts with `pk_live_...` or `pk_test_...`): Used by your website frontend to secure Stripe Elements.
   - **Secret Key** (starts with `sk_live_...` or `sk_test_...`): Kept hidden from public view.
4. Input your publishable key inside your main configuration variables file or `.env` under `VITE_STRIPE_PUBLISHABLE_KEY`. This initializes the beautiful credit card hold element securely.

---

## 🌐 Step 4: Simple Hosting & Google Sites Embedding (www.smoothoperatorsf.com)

Since your application compiles into a single set of responsive, lightning-fast static files, you can host your studio booking screen on premium, secure platforms.

As you are using **Google Sites** for your primary website content (e.g. at `www.smoothoperatorsf.com`), you can maintain Google Sites as your beautiful, easy-to-edit content storefront, and **cleanly embed this premium booking portal directly inside Google Sites as a full-bleed widget!**

Here is the step-by-step blueprint to do this flawlessly:

### 1. Host the Interactive Booking Portal
Google Sites is a static, low-code website builder and cannot run custom server code (like Stripe credit card holds or Google Workspace folder syncs) natively. Therefore, you first host this applet on a secure, free-tier hosting platform (like **Google Cloud Run** or **Render**) to give it a public live address (e.g. `booking.smoothoperatorsf.com` or `smooth-operator-booking.onrender.com`).

*   **Option A: Google Cloud Run (Recommended — Google Native)**: Run your full-stack app directly on Google Cloud (details in the `HOSTING_GUIDE.md`).
*   **Option B: Render.com (Easiest)**: Upload your repository or ZIP to Render.com.

---

### 2. Embed the Booking Portal in Google Sites
Once your app is live on its secondary booking address, you can embed it inside your main Google Sites pages with zero coding:

1.  Log into your **Google Sites Dashboard** (`sites.google.com`) using Drew's official profile.
2.  Open or edit your **Smooth Operator SF** website project.
3.  Navigate to your **"Book Now"** page, or create a new page named **"Book Online"**.
4.  In the right-hand sidebar, select **Insert** and click **Embed (`<>`)**.
5.  In the popup window, stay on the **By URL** tab and paste your live hosted booking URL (e.g., `https://smooth-operator-booking.onrender.com` or your designated booking subdomain).
6.  Google Sites will automatically fetch a live, interactive preview of the layout. Click **Insert**.
7.  **Sizing Grid Adjustments (Crucial!)**:
    *   Click and grab the blue handles on the inserted frame.
    *   Drag the frame **all the way to the left and right margins** so it covers the full width of your page.
    *   Drag the bottom handle **downwards** until the entire interactive checkout, body silhouette map, and calendar grid are fully visible, avoiding any ugly double scrollbars.
8.  In Google Sites, click **Publish** on the top right.

*Now your clients get the ultimate, premium Material 3 experience with responsive body mapping, Stripe credit holds, and Calendar sync, operating entirely within your main Google Sites storefront!*

---

## 🔒 Step 5: How Drew Accesses the Admin Center
Your admin operations suite is built directly into the app so you do not need double systems:
1. Open your live website.
2. Go to `/admin` in your URL bar (or click the subtle lock layout in the footer of your main page).
3. Click **Sign in with Google**. Sign in with your registered Google email (`admin@smoothoperatorsf.com`).
4. Once verified, you will enter your control dashboard. Here, you can:
   - View pending appointment proposals from clients.
   - See their signed NDA forms, age-gate checks, and skincare records.
   - Toggle **Vacation / Break Mode** to instantly grey out days and select hours that customers cannot choose on the front end!
   - Accept bookings, which instantly pushes them into your central calendar with your 15-minute hidden cleaning block!

---

## 🛡️ Essential Care Support Contacts
If you need any adjustments or if you have specific operational questions as you link your private APIs, know that you are supported. Your livelihood is paramount, and this code is fully realized to deploy tomorrow. Enjoy your gorgeous, dreamscape Smooth Operator SF booking system! 💆‍♂️✨
