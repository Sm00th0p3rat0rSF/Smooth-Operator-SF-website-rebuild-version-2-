# 🛠️ Smooth Operator SF — Build & Rebuild Engineering Guide

This document serves as the official compilation and build specification guide for the **Smooth Operator SF** application. This guide outlines how the application's unified full-stack architecture is compiled, bundled, and run in both development and production environments.

---

## 🏛️ Full-Stack Unified Architecture Overview

The application is structured as a **unified, single-port full-stack architecture**:
1. **Frontend (Vite + React 19 + Tailwind CSS v4 + Motion):** Compiled into highly optimized static HTML, CSS, and JS assets.
2. **Backend (Express v4 + TypeScript):** A Node-based server defined in `server.ts` that acts as the API Gateway (for calendar syncing, vault operations, etc.) and seamlessly serves static frontend files in production.
3. **Execution Port:** The entire application runs behind a single port (`3000`) for seamless container ingress compatibility.

---

## 📋 Prerequisites

To manually compile and build the application, ensure you have the following installed on your machine:
* **Node.js:** v20.x or higher (LTS recommended)
* **npm:** v10.x or higher
* *(Optional)* **Docker:** If building and running via containerized environments.

---

## 🚀 Local Build & Run Instructions

### 1. Install Dependencies
Run the following command to download and install all required packages (including development build dependencies like `esbuild` and `typescript`):
```bash
npm install
```

### 2. Run in Development Mode
To boot the developer server with real-time TypeScript execution:
```bash
npm run dev
```
* Under the hood, this runs `tsx server.ts`.
* `tsx` is an on-the-fly TypeScript executor that boots the backend immediately, mounting Vite's development middleware to enable instant UI previews and Hot Module Replacement (HMR) simulation.

### 3. Compile for Production
To build the optimized, production-ready bundle of the entire app:
```bash
npm run build
```
This triggers the compilation pipeline sequence detailed below.

### 4. Run the Production Build Locally
After a successful build, boot the optimized production server using:
```bash
npm run start
```
* Under the hood, this executes `node dist/server.cjs` on port `3000`.

---

## ⛓️ The Production Compilation Chain Explained

When you trigger `npm run build`, two key compilation steps execute in sequence:

```
                  ┌──────────────────────┐
                  │    npm run build     │
                  └──────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌────────────────────┐        ┌──────────────────────┐
   │    Vite Build      │        │    esbuild Server    │
   │  (Frontend Asset)  │        │  (Backend Bundler)   │
   └──────────┬─────────┘        └──────────┬───────────┘
              │                             │
              ▼                             ▼
   Compiles JSX/TS to HTML/     Bundles server.ts into CJS
   CSS/JS in: /dist             Output: /dist/server.cjs
              │                             │
              └──────────────┬──────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Ready for Production │
                  │  node dist/server.cjs│
                  └──────────────────────┘
```

### Step 1: Frontend Asset Compilation (`vite build`)
* Compiles all React files (JSX/TSX), processes Tailwind CSS v4 utility classes, and outputs minimized, cache-busted static files inside the `/dist` directory.

### Step 2: Backend Bundling (`esbuild server.ts ...`)
* Bundles `server.ts` into a unified CommonJS file (`/dist/server.cjs`).
* **Why esbuild is used:**
  * By resolving import paths at compile-time and outputting standard CommonJS (`.cjs`), it completely bypasses Node's strict runtime ES Module checks, leading to a robust startup.
  * The flag `--packages=external` is supplied to keep core standard npm libraries (like `express`) external to the bundle, ensuring safety and standard module resolutions.
  * Direct source maps are emitted with `--sourcemap` for simple diagnostics.

---

## 🐳 Containerized Production Build (Docker)

To ensure consistency in cloud environments, a dual-phase, highly optimized `Dockerfile` is provided in the project root.

### Build the Docker Image
Execute the following in your shell from the root directory:
```bash
docker build -t smooth-operator-sf .
```

### Run the Docker Container
Run the container locally, mapping port `3000`:
```bash
docker run -p 3000:3000 \
  -e GEMINI_API_KEY="your_api_key_here" \
  -e APP_URL="http://localhost:3000" \
  smooth-operator-sf
```

### Under the Hood: Dockerfile Walkthrough

```dockerfile
# ==========================================
# Phase 1: Build Stage (Full Node Toolchain)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Copy dependency manifests and run fresh install
COPY package*.json ./
RUN npm ci

# Copy full source and trigger the compilation sequence
COPY . .
RUN npm run build

# ==========================================
# Phase 2: Production Stage (Minimal Weight Runner)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Install ONLY production dependencies (excluding dev tools)
COPY package*.json ./
RUN npm ci --only=production

# Pull pre-compiled static frontend and server.cjs bundle from builder
COPY --from=builder /usr/src/app/dist ./dist

# Expose standard gateway port and execute
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 🧹 Housekeeping
To clear previous compilation build outputs and reset your workspace, execute:
```bash
npm run clean
```
This removes the `/dist` directory and any stray output files, allowing you to trigger a completely clean rebuild.
