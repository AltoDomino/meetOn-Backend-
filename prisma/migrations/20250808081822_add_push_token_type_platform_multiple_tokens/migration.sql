/*
  Warnings:

  - A unique constraint covering the columns `[userId,token]` on the table `PushToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `PushToken` table without a default value. This is not possible if the table is not empty.

  Fixes applied:
  - DEFAULT NOW() for updatedAt + backfill.
  - Backfill tokenType to 'expo' for starych rekordów.
  - Dedup (userId, token) przed dodaniem UNIQUE.
*/

-- CreateEnum
CREATE TYPE "PushTokenType" AS ENUM ('expo', 'fcm');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('android', 'ios', 'web');

-- DropIndex (stary unique po userId)
DROP INDEX IF EXISTS "PushToken_userId_key";

-- AlterTable: dodajemy kolumny z defaultami gdzie potrzeba
ALTER TABLE "PushToken"
  ADD COLUMN IF NOT EXISTS "platform" "Platform",
  ADD COLUMN IF NOT EXISTS "tokenType" "PushTokenType" NOT NULL DEFAULT 'expo',
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Backfill dla istniejących rekordów
UPDATE "PushToken"
SET
  "tokenType" = 'expo'
WHERE "tokenType" IS NULL;

UPDATE "PushToken"
SET
  "updatedAt" = NOW()
WHERE "updatedAt" IS NULL;

-- Dedup duplikatów (userId, token) zostawiamy najmniejszy id
DELETE FROM "PushToken" pt
USING (
  SELECT MIN(id) AS keep_id, "userId", "token"
  FROM "PushToken"
  GROUP BY "userId", "token"
) k
WHERE pt."userId" = k."userId"
  AND pt."token" = k."token"
  AND pt.id <> k.keep_id;

-- Indexy
CREATE INDEX IF NOT EXISTS "PushToken_userId_idx" ON "PushToken"("userId");

-- UNIQUE po (userId, token)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'PushToken_userId_token_key'
  ) THEN
    CREATE UNIQUE INDEX "PushToken_userId_token_key" ON "PushToken"("userId", "token");
  END IF;
END$$;
