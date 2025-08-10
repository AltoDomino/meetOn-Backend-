# Etap 1: Budowanie TypeScript
FROM node:18 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Generujemy klienta Prisma po instalacji paczek i migracjach
RUN npx prisma generate

# Budujemy TypeScript -> JavaScript
RUN npm run build

# Etap 2: Produkcyjny obraz
FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --only=production

# Kopiujemy skompilowany kod i pliki Prisma z buildera
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

EXPOSE 3000

ENV NODE_ENV=production
ENV FRONTEND_URL=${FRONTEND_URL}

CMD ["node", "dist/server.js"]
