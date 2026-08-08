# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./

# ---------- development ----------
FROM base AS development
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# ---------- production dependencies ----------
FROM base AS prod-deps
RUN npm ci --omit=dev

# ---------- production ----------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S bizzguest && adduser -S bizzguest -G bizzguest
COPY --from=prod-deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/uploads && chown -R bizzguest:bizzguest /app
USER bizzguest
EXPOSE 4000
CMD ["node", "src/server.js"]
