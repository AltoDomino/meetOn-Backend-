"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function clearDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🧹 Czyszczenie bazy danych...");
        yield prisma.eventParticipant.deleteMany();
        yield prisma.event.deleteMany();
        yield prisma.userInterest.deleteMany();
        yield prisma.pushToken.deleteMany();
        yield prisma.notification.deleteMany();
        yield prisma.friendship.deleteMany();
        yield prisma.user.deleteMany();
        console.log("✅ Baza danych została wyczyszczona");
        yield prisma.$disconnect();
    });
}
clearDatabase().catch((err) => {
    console.error("❌ Błąd czyszczenia:", err);
    prisma.$disconnect();
});
