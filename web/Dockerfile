# ============================================
# EPR SaaS - Next.js Frontend Dockerfile
# Multi-stage build for optimized production image
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Build arguments for Next.js public env vars (embedded at build time)
ARG NEXT_PUBLIC_BROWSER_API_URL
ARG NEXT_PUBLIC_BROWSER_CHATBOT_URL
ARG NEXT_PUBLIC_APP_URL

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application with public env vars
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_BROWSER_API_URL=$NEXT_PUBLIC_BROWSER_API_URL
ENV NEXT_PUBLIC_BROWSER_CHATBOT_URL=$NEXT_PUBLIC_BROWSER_CHATBOT_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN corepack enable pnpm && pnpm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
