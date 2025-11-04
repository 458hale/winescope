# ==============================================================================
# Dockerfile - API Service (ARM64 Native)
# ==============================================================================
# This Dockerfile builds the WineScope API service optimized for ARM64.
# For Apple Silicon, this runs natively without Rosetta 2 for best performance.
#
# Build command:
#   docker build -t winescope-api:latest -f apps/api/Dockerfile .
#
# Run command:
#   docker run -p 3000:3000 winescope-api:latest
# ==============================================================================

# ==============================================================================
# Stage 1: Dependencies - Install all dependencies with pnpm
# ==============================================================================
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ==============================================================================
# Stage 2: Builder - Build the NestJS application
# ==============================================================================
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the API application
RUN pnpm run build api

# ==============================================================================
# Stage 3: Debug - Development image with debugger support
# ==============================================================================
FROM node:22-alpine AS debug

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code (will be overridden by volume mount in docker-compose.yml)
COPY . .

# Expose application port and debugger port
EXPOSE 3000 9229

# Set development environment
ENV NODE_ENV=development

# Start the application in debug mode
CMD ["pnpm", "run", "start:debug", "api"]

# ==============================================================================
# Stage 4: Production - Final lightweight image
# ==============================================================================
FROM node:22-alpine AS production

# Install pnpm for production dependencies
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile && \
    pnpm store prune

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose application port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/apps/api/main.js"]
