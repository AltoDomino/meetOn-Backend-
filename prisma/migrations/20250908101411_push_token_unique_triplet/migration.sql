/*
  Warnings:

  - A unique constraint covering the columns `[userId,token,tokenType]` on the table `PushToken` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."PushToken_userId_token_key";

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_userId_token_tokenType_key" ON "public"."PushToken"("userId", "token", "tokenType");
