# ==========================================
# Phase 1: Build Stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy files necessary for installing dependencies
COPY package*.json ./

# Install all dependencies (including devDependencies required for the build process)
RUN npm ci

# Copy the rest of the application codebase
COPY . .

# Build both client static assets and bundle the Express server (dist/server.cjs)
RUN npm run build

# ==========================================
# Phase 2: Production Stage
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies for optimal runtime image weight
COPY package*.json ./
RUN npm ci --only=production

# Copy pre-built production files and the compiled CJS server from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the standard Cloud Run and internal Nginx mapping port
EXPOSE 3000

# Run the compiled central Express + Vite unified server
CMD ["npm", "run", "start"]
