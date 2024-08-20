FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

#
# Define build args
#

# URL to database
ARG databaseurl

# Public SUPABASE URL
ARG supaurl

# Supabase anonomous key
ARG supakey

# Supabase service role key
ARG supaservicekey

# Supabase password
ARG supapass

# Public URL
ARG publicurl=http://localhost:3000/

#
# Define environment variables
#

ENV DATABASE_URL=$databaseurl

ENV NEXT_PUBLIC_SUPABASE_URL=$supaurl

ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$supakey

ENV SUPABASE_SERVICE_ROLE_KEY=$supaservicekey

ENV supapass=$supapass

ENV NEXT_PUBLIC_URL=$publicurl

RUN echo $databaseurl

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

#
# Define build args
#

# URL to database
ARG databaseurl

# Public SUPABASE URL
ARG supaurl

# Supabase anonomous key
ARG supakey

# Supabase service role key
ARG supaservicekey

# Supabase password
ARG supapass

# Public URL
ARG publicurl=http://localhost:3000/

#
# Define environment variables
#

ENV DATABASE_URL=$databaseurl

ENV NEXT_PUBLIC_SUPABASE_URL=$supaurl

ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$supakey

ENV SUPABASE_SERVICE_ROLE_KEY=$supaservicekey

ENV supapass=$supapass

ENV NEXT_PUBLIC_URL=$publicurl

RUN echo $databaseurl

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD HOSTNAME="0.0.0.0" node server.js