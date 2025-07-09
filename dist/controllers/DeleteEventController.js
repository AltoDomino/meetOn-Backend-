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
exports.deleteEventController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const deleteEventController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = Number(req.params.eventId);
    const userId = Number(req.body.userId);
    try {
        const event = yield prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return res.status(404).json({ error: "Wydarzenie nie istnieje" });
        }
        if (event.creatorId !== userId) {
            return res.status(403).json({ error: "Tylko twórca może usunąć wydarzenie" });
        }
        // Pobierz uczestników wydarzenia
        const participants = yield prisma.eventParticipant.findMany({
            where: { eventId },
        });
        if (participants.length > 1) {
            return res
                .status(400)
                .json({ error: "Nie można usunąć wydarzenia z innymi uczestnikami" });
        }
        // Usuń uczestnictwa (na wypadek, gdyby było potrzebne)
        yield prisma.eventParticipant.deleteMany({
            where: { eventId },
        });
        // Usuń wydarzenie
        yield prisma.event.delete({
            where: { id: eventId },
        });
        res.status(200).json({ message: "Wydarzenie usunięte" });
    }
    catch (err) {
        console.error("❌ Błąd usuwania eventu:", err);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
exports.deleteEventController = deleteEventController;
