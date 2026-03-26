FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY server/package.json ./server/

RUN npm ci --workspace=packages/shared --workspace=server

# Build shared package
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared

# Build server
COPY server/ ./server/
RUN cd server && npx prisma generate
RUN npm run build --workspace=server

# Production image
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/shared/package.json ./packages/shared/
COPY --from=base /app/server/dist ./server/dist
COPY --from=base /app/server/package.json ./server/
COPY --from=base /app/server/prisma ./server/prisma
COPY --from=base /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "cd server && npx prisma migrate deploy && node dist/index.js"]
