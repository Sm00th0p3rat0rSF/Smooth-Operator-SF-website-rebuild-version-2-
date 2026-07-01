# Smooth Operator SF — Production Launch & Hosting Guide 💆‍♂️✨

Welcome to your production-ready launch guide, Drew! This guide is customized specifically to your architecture for **Smooth Operator SF**, aligning with the **Firebase logic** for robust state management and securely keeping your master clinical ledger in **Google Sheets (Worksheets)**. 

Because your booking system is a highly robust full-stack solution (combining a **React client** with an **Express.js server** in `server.ts` to manage Stripe SetupIntents, Google Calendar inserts, Gmail alerts, and Google Contacts sync), standard static hosts cannot run the backend code. 

To keep your infrastructure unified within the Google ecosystem, we will host the application using **Firebase Hosting + Google Cloud Run (as the server background)**. This is Google's recommended, highly optimized path that lets you connect your Workspace domain (`www.smoothoperatorsf.com`) and scales down to $0.00 when no clients are booking!

---

## 🏗️ The Architecture Overview

Your booking platform operates on high-efficiency, serverless primitives:
1. **Frontend Assets (Firebase Hosting)**: Delivers your HTML, assets, and modern React client across Google's high-speed CDN global servers.
2. **Backend Server (Google Cloud Run / Cloud Functions)**: Runs your Express.js server (`server.ts`) which interfaces with Google Workspace, maps calendar busy times, and handles admin permissions.
3. **Durable Online State (Firebase Firestore)**: Stores secure client details, pre-authorizations, verification flags, and signed safety waivers.
4. **Operations Ledger (Google Worksheet)**: Automatically syncs active entries to your `Appointments Ledger` and `Contacts Directory` sheet tabs in your Google Drive at runtime!

---

## 🛠️ Step-by-Step Hosting Guide

### 📋 Phase 1: Local Code Assembly and Credentials Check
Before deploying, ensure that your client keys and environmental parameters are safely in place.

1. **Verify your Firebase Configuration File**:
   * Ensure your specialized `/firebase-applet-config.json` is located in the root of your project directory. It should contain your exact project keys:
     ```json
     {
       "apiKey": "AIzaSy...",
       "authDomain": "smooth-operator-sf.firebaseapp.com",
       "projectId": "smooth-operator-sf",
       "storageBucket": "smooth-operator-sf.appspot.com",
       "messagingSenderId": "...",
       "appId": "..."
     }
     ```
2. **Set your Environment Variables**:
   * Create or update the `.env` file at the root. Include your Stripe setup parameters:
     ```env
     VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YourStripeKeyHere
     NODE_ENV=production
     ```

---

### 🌐 Phase 2: Deploying the Backend & API Server to Google Cloud Run
Since Firebase is fully integrated with Google Cloud (GCP), deploying your Express server to Google Cloud Run takes minutes and stays inside your single Google billing account.

1. **Export Your App**:
   * Open the Settings panel in Google AI Studio, select **Export Code**, and download the custom ZIP file of your codebase or push it directly to your **GitHub** account.
2. **Access Google Cloud Console**:
   * Log into the [Google Cloud Console](https://console.cloud.google.com/) using your `admin@smoothoperatorsf.com` admin account.
3. **Enable API Libraries**:
   * Search for and enable the **Cloud Run API** and **Cloud Build API**.
4. **Deploy from Source**:
   * Navigate to the **Cloud Run** dashboard, and click **Create Service**.
   * Under "Source", select **Deploy from a source repository** and link your newly created GitHub repository.
   * Under **Build Configuration**, choose **Cloud Buildpack** to let GCP automatically read your `package.json`, compile your code, and bundle your Express app.
5. **Port & Hardware Allocation**:
   * Set the container Port to `3000` (this matches the port mapped in your `server.ts`).
   * Set **Ingress Control** to **Allow all traffic** and **Authentication** to **Allow unauthenticated invocations** so public users can access the checkout.
   * Click **Create/Deploy**. Google will output a secure service link (e.g., `https://smooth-operator-backend-xxxxxx.a.run.app`).

---

### 🎨 Phase 3: Setting Up Firebase Hosting to Serve Your Frontend
Firebase Hosting handles lighting-fast delivery of your React client while routing APIs seamlessly back to your server container.

1. **Install Firebase Command Line Interface (CLI)**:
   * Open your local terminal, and install the tools:
     ```bash
     npm install -g firebase-tools
     ```
   * Log into your Google workspace account:
     ```bash
     firebase login
     ```
2. **Initialize Firebase in Your Project Folder**:
   * Execute this command at the root directory:
     ```bash
     firebase init
     ```
   * **Select Features**: Select `Hosting: Configure files for Firebase Hosting...` using spacebar, and hit Enter.
   * **Project Choice**: Select your active project ID (`smooth-operator-sf`).
   * **Public Directory**: Type `dist` (this matches the production React output folder).
   * **Single-Page App Configuration**: Answer **Yes** to `"Configure as a single-page app"`.
   * **Overwrite Index**: Answer **No** to `"Overwrite dist/index.html"`.
3. **Configure the Rewrite Rules**:
   * Open the newly generated `firebase.json` file in your root folder. Update the rewrite array to direct all `/api/*` endpoints to your Cloud Run Express backend, while routing everything else to your static React client:
     ```json
     {
       "hosting": {
         "public": "dist",
         "ignore": [
           "firebase.json",
           "**/.*",
           "**/node_modules/**"
         ],
         "rewrites": [
           {
             "source": "/api/**",
             "run": {
               "serviceId": "smooth-operator-backend",
               "region": "us-east1"
             }
           },
           {
             "source": "**",
             "destination": "/index.html"
           }
         ]
       }
     }
     ```
4. **Deploy to Production**:
   * Bundle your React application locally and deploy it:
     ```bash
     npm run build
     firebase deploy --only hosting
     ```
   * Firebase will give you a high-performance URL (e.g., `https://smooth-operator-sf.web.app`).

---

### 🔑 Phase 4: Mapping Your Custom Workspace Domain
Keep your setup unified under your business domain. Since you have your custom domain (`www.smoothoperatorsf.com`) registered through Google Workspace, mapping it is fully automated.

1. Go to your **Firebase Console -> Build -> Hosting**.
2. Click **Add Custom Domain** on the main dashboard.
3. Type in your custom domain: `www.smoothoperatorsf.com` (and optionally `smoothoperatorsf.com` with a redirect).
4. Firebase will output verification instructions. Connect to your domain registrar (Google Domains/Workspace Admin panel) and add the provided:
   * **TXT record** (to verify ownership)
   * **A/AAAA records** (to map traffic directly to Firebase's global CDN ip addresses)
5. Google will automatically provision and renew a free **SSL certificate** for your domain within 2-24 hours!

---

### 🛡️ Phase 5: Hardening Firestore & Establishing Google Sheet Sync
Since customer state is persistent online but logs to Google Sheets for administration, connect the two pillars.

1. **Deploy Firestore Security Rules**:
   * Run the deployment command to push your pre-built `/firestore.rules` safely to your account, protecting client private details:
     ```bash
     firebase deploy --only firestore:rules
     ```
2. **Authorize the ledger Sync**:
   * Access your custom booking site, navigate to the secure admin page at `https://www.smoothoperatorsf.com/admin`, and log in using your Google Workspace handle (`admin@smoothoperatorsf.com`).
   * Grant Permissions to verify your Google Calendar API, Sheets API, and Gmail API.
   * **And that's it!** The system will automatically build your customized "Contacts Directory" with your **waxing** labels and log all appointment sequences with the hidden **15-minute sanitary buffer** right into your sheets ledger!

---

Drew, your system is now fully structured for a smooth, high-confidence launch. Whenever a client lands on your premium custom domain, they'll experience your Smokey Lavender design system, book using your smart non-overlapping overlap filters, and receive custom automated confirmation sequences! 💆‍♂️✨
