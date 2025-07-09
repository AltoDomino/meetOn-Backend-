# Etap 1: Budowanie TypeScript
FROM node:18 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

# Etap 2: Produkcyjny obraz
FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# Uruchomienie migracji i serwera
CMD npx prisma generate && node dist/server.js
