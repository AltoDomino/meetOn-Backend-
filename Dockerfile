# -------- Etap 1: Build (TypeScript -> JavaScript) --------
FROM node:20-alpine AS builder

WORKDIR /app

# 1) Szybszy cache warstw
COPY package*.json ./
RUN npm ci

# 2) Potrzebujemy schematu do generowania Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# 3) Reszta źródeł i build TS
COPY . .
RUN npm run build


# -------- Etap 2: Production --------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# (opcjonalnie) wstrzyknięcie zmiennej środowiskowej przy buildzie:
# docker build --build-arg FRONTEND_URL=https://twoj-front.pl ...
ARG FRONTEND_URL
ENV FRONTEND_URL=${FRONTEND_URL}

# 1) Zainstaluj wyłącznie prod-deps
#    Kopiujemy też 'prisma' PRZED instalacją, aby postinstall @prisma/client
#    mógł od razu wygenerować klienta w tym etapie.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

# 2) Skopiuj zbuildowany kod z etapu builder
COPY --from=builder /app/dist ./dist

# (UWAGA) Nie kopiujemy node_modules z buildera.
# Prisma Client został wygenerowany w tym etapie podczas `npm ci --omit=dev`
# dzięki temu binarki silnika pasują do obrazu (linux-musl).

EXPOSE 3000

CMD ["node", "dist/server.js"]
