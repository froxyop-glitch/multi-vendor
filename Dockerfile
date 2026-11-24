FROM node:20-alpine AS builder
WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy prisma schema and build scripts
COPY backend/prisma ./prisma
COPY backend/scripts ./scripts
RUN node scripts/generate-prisma.js

# Copy typescript config and source code
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy compiled files and data
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY backend/prisma ./prisma
COPY backend/data ./data

EXPOSE 5000
CMD ["node", "dist/server.js"]
