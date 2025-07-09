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
exports.getJoinedEventsController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getJoinedEventsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.query.userId);
    if (!userId)
        return res.status(400).json({ error: "Brak userId" });
    try {
        const now = new Date();
        // 1️⃣ Wydarzenia, do których dołączył jako uczestnik
        const joinedEvents = yield prisma.eventParticipant.findMany({
            where: {
                userId,
                event: {
                    endDate: { gt: now },
                },
            },
            include: {
                event: {
                    include: {
                        creator: { select: { userName: true } },
                        eventParticipants: {
                            include: { user: { select: { gender: true } } },
                        },
                    },
                },
            },
        });
        // 2️⃣ Wydarzenia, które sam stworzył (jako twórca)
        const createdEvents = yield prisma.event.findMany({
            where: {
                creatorId: userId,
                endDate: { gt: now },
            },
            include: {
                creator: { select: { userName: true } },
                eventParticipants: {
                    include: { user: { select: { gender: true } } },
                },
            },
        });
        // 3️⃣ Mergowanie i mapowanie
        const allEvents = [...joinedEvents.map((e) => e.event), ...createdEvents];
        const uniqueEventsMap = new Map();
        allEvents.forEach((event) => {
            uniqueEventsMap.set(event.id, {
                id: event.id,
                activity: event.activity,
                location: event.location,
                startDate: event.startDate,
                endDate: event.endDate,
                creator: event.creator,
                spots: event.maxParticipants,
                participantsCount: event.eventParticipants.length,
                isUserJoined: event.eventParticipants.some((p) => p.userId === userId),
                isCreator: event.creatorId === userId,
            });
        });
        const result = Array.from(uniqueEventsMap.values());
        console.log("📦 Wynik /api/event/joined:", result);
        res.json(result);
    }
    catch (err) {
        console.error("❌ Błąd pobierania wydarzeń:", err);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
exports.getJoinedEventsController = getJoinedEventsController;
