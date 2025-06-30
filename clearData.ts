import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log("🧹 Czyszczenie bazy danych...");

await prisma.eventParticipant.deleteMany();
await prisma.event.deleteMany();
await prisma.userInterest.deleteMany();
await prisma.pushToken.deleteMany();
await prisma.notification.deleteMany();
await prisma.friendship.deleteMany();
await prisma.user.deleteMany();


  console.log("✅ Baza danych została wyczyszczona");
  await prisma.$disconnect();
}

clearDatabase().catch((err) => {
  console.error("❌ Błąd czyszczenia:", err);
  prisma.$disconnect();
});
