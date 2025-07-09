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
exports.getEventDetailsController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getEventDetailsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = Number(req.params.id);
    if (!eventId) {
        return res.status(400).json({ error: "Brak eventId w adresie URL" });
    }
    try {
        const event = yield prisma.event.findUnique({
            where: { id: eventId },
            include: {
                creator: {
                    select: { userName: true },
                },
            },
        });
        if (!event) {
            return res.status(404).json({ error: "Wydarzenie nie istnieje" });
        }
        const eventParticipants = yield prisma.eventParticipant.findMany({
            where: { eventId },
            include: {
                user: {
                    select: {
                        id: true,
                        userName: true,
                        avatarUrl: true,
                        description: true,
                    },
                },
            },
        });
        // 🔄 Mapa uczestników na podstawie relacji user
        const participants = eventParticipants.map((ep) => ({
            id: ep.user.id,
            userName: ep.user.userName,
            avatar: ep.user.avatarUrl,
            description: ep.user.description,
        }));
        const formattedEvent = {
            id: event.id,
            activity: event.activity,
            location: event.location,
            startDate: event.startDate,
            endDate: event.endDate,
            creator: event.creator,
            participantsCount: participants.length,
            maxParticipants: event.maxParticipants,
            participants,
        };
        res.status(200).json(formattedEvent);
    }
    catch (err) {
        console.error("❌ Błąd pobierania szczegółów wydarzenia:", err);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
exports.getEventDetailsController = getEventDetailsController;
