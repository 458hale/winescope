# ==============================================================================
# Dockerfile - Crawler Service (AMD64 with curl-impersonate)
# ==============================================================================
# This Dockerfile forces AMD64 platform for all stages to ensure
# curl-impersonate binaries work correctly.
#
# Build command:
#   docker build --platform linux/amd64 -t winescope-crawler:latest -f apps/crawler/Dockerfile .
#
# Run command:
#   docker run -p 3001:3001 winescope-crawler:latest
#
# Note: On Apple Silicon, this will use Rosetta 2 emulation but ensures
# curl-impersonate works correctly.
# ==============================================================================

# ==============================================================================
# Stage 1: Dependencies - Install all dependencies with pnpm
# ==============================================================================
FROM --platform=linux/amd64 node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all package.json files for workspace apps
COPY apps/api/package.json ./apps/api/
COPY apps/crawler/package.json ./apps/crawler/

# Install dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ==============================================================================
# Stage 2: Builder - Build the NestJS application
# ==============================================================================
FROM --platform=linux/amd64 node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Copy entrypoint script for development
COPY docker-entrypoint-dev.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint-dev.sh

# Build the Crawler application using pnpm filter
WORKDIR /app/apps/crawler
RUN pnpm exec nest build

# Create symlink for dev mode compatibility (webpack outputs to ./dist, but NestJS expects ../../dist/apps/crawler)
RUN mkdir -p /app/dist/apps && ln -sf /app/apps/crawler/dist /app/dist/apps/crawler

# Set entrypoint for development mode
ENTRYPOINT ["/usr/local/bin/docker-entrypoint-dev.sh"]

# ==============================================================================
# Stage 3: curl-impersonate - Prepare curl-impersonate binaries
# ==============================================================================
FROM --platform=linux/amd64 lwthiker/curl-impersonate:0.6-chrome-alpine AS curl-impersonate

# This stage provides the curl-impersonate binaries
# All binaries will be AMD64 architecture

# ==============================================================================
# Stage 4: Production - Final lightweight image
# ==============================================================================
FROM --platform=linux/amd64 node:22-alpine AS production

# Install pnpm for production dependencies
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all package.json files for workspace apps
COPY apps/api/package.json ./apps/api/
COPY apps/crawler/package.json ./apps/crawler/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile && \
    pnpm store prune

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/apps/crawler/dist ./dist

# Copy curl-impersonate binaries from curl-impersonate stage
COPY --from=curl-impersonate /usr/local/bin/curl-impersonate-chrome /usr/local/bin/
COPY --from=curl-impersonate /usr/local/bin/curl_chrome* /usr/local/bin/
COPY --from=curl-impersonate /usr/local/lib/libcurl-impersonate* /usr/local/lib/

# Create symlink for easier access
RUN ln -sf /usr/local/bin/curl_chrome116 /usr/local/bin/curl-chrome

# Set library path for curl-impersonate
ENV LD_LIBRARY_PATH=/usr/local/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}

# Switch to non-root user
USER nestjs

# Expose crawler service port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production

# Health check using curl-impersonate
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl-chrome --version && node -e "require('http').get('http://localhost:3001/crawl/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the crawler service
CMD ["node", "dist/main.js"]
