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
exports.getFilteredEvents = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getFilteredEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.query.userId);
    const ownOnly = req.query.ownOnly === "true";
    if (!userId) {
        return res.status(400).json({ error: "Brak userId" });
    }
    try {
        // 🔹 Wydarzenia stworzone przez użytkownika
        if (ownOnly) {
            const ownEvents = yield prisma.event.findMany({
                where: { creatorId: userId },
                include: {
                    creator: { select: { userName: true } },
                },
            });
            const formatted = yield Promise.all(ownEvents.map((event) => __awaiter(void 0, void 0, void 0, function* () {
                const participants = yield prisma.eventParticipant.findMany({
                    where: { eventId: event.id },
                });
                return {
                    id: event.id,
                    activity: event.activity,
                    location: event.location,
                    startDate: event.startDate,
                    endDate: event.endDate,
                    creator: event.creator,
                    spots: event.maxParticipants,
                    participantsCount: participants.length,
                    isUserJoined: true,
                    isCreator: true,
                };
            })));
            return res.json(formatted);
        }
        // 🔹 Pobierz wiek użytkownika
        const user = yield prisma.user.findUnique({
            where: { id: userId },
            select: { age: true },
        });
        if (!user || user.age === null) {
            return res.status(400).json({ error: "Brak informacji o wieku użytkownika." });
        }
        // 🔹 Pobierz zainteresowania użytkownika
        const interests = yield prisma.userInterest.findMany({
            where: { userId },
        });
        const interestNames = interests.map((i) => i.activity);
        // 🔹 Pobierz wydarzenia zgodne z zainteresowaniami i wiekiem
        const matchingEvents = yield prisma.event.findMany({
            where: {
                activity: { in: interestNames },
                creatorId: { not: userId },
                minAge: { lte: user.age },
                maxAge: { gte: user.age },
            },
            include: {
                creator: { select: { userName: true } },
            },
        });
        // 🔹 Pobierz wydarzenia, do których user dołączył
        const joinedEventLinks = yield prisma.eventParticipant.findMany({
            where: { userId },
        });
        const joinedEventIds = joinedEventLinks.map((ep) => ep.eventId);
        const joinedEvents = yield prisma.event.findMany({
            where: {
                id: { in: joinedEventIds },
                creatorId: { not: userId },
            },
            include: {
                creator: { select: { userName: true } },
            },
        });
        // 🔹 Połącz wydarzenia: zainteresowania + dołączone (bez duplikatów)
        const eventMap = new Map();
        const processEvent = (event, isJoined) => __awaiter(void 0, void 0, void 0, function* () {
            const participants = yield prisma.eventParticipant.findMany({
                where: { eventId: event.id },
            });
            eventMap.set(event.id, {
                id: event.id,
                activity: event.activity,
                location: event.location,
                startDate: event.startDate,
                endDate: event.endDate,
                creator: event.creator,
                spots: event.maxParticipants,
                participantsCount: participants.length,
                isUserJoined: isJoined,
                isCreator: false,
            });
        });
        yield Promise.all(matchingEvents.map((event) => processEvent(event, false)));
        yield Promise.all(joinedEvents.map((event) => processEvent(event, true)));
        const formatted = Array.from(eventMap.values()).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        res.json(formatted);
    }
    catch (err) {
        console.error("❌ Błąd filtrowania wydarzeń:", err);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
exports.getFilteredEvents = getFilteredEvents;
