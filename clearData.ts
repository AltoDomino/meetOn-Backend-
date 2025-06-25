// // scripts/clearData.ts
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function clearData() {
//   try {
//     await prisma.notification.deleteMany();
//     await prisma.pushToken.deleteMany();
//     await prisma.userInterest.deleteMany();
//     await prisma.event.deleteMany();
//     await prisma.user.deleteMany();

//     console.log('✅ Wszystkie dane zostały usunięte.');
//   } catch (error) {
//     console.error('❌ Błąd usuwania danych:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// clearData();
