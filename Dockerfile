# --- BASE ---
FROM node:18-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .

# --- BUILDER ---
FROM base AS builder
RUN npm run build

# --- PRODUCTION ---
FROM node:18-alpine AS production
WORKDIR /app

COPY --from=builder /app/package.json .
COPY --from=builder /app/package-lock.json .
COPY --from=builder /app/dist ./dist

RUN npm install --omit=dev

EXPOSE ${PORT}

CMD [ "npm", "start" ]