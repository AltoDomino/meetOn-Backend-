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
exports.createEventController = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const expo = new expo_server_sdk_1.Expo();
const createEventController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { location, address, startDate, endDate, activity, creatorId, spots, genderSplit, minAge, maxAge, } = req.body;
    try {
        const parsedStart = new Date(startDate);
        const parsedEnd = new Date(endDate);
        const now = new Date();
        if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
            return res.status(400).json({ error: "Nieprawidłowy format daty." });
        }
        if (parsedStart <= now) {
            return res.status(400).json({ error: "Data rozpoczęcia musi być w przyszłości." });
        }
        if (parsedEnd <= parsedStart) {
            return res.status(400).json({ error: "Data zakończenia musi być po rozpoczęciu." });
        }
        const event = yield prisma.event.create({
            data: {
                location,
                address,
                startDate: parsedStart,
                endDate: parsedEnd,
                activity,
                creatorId: Number(creatorId),
                maxParticipants: Number(spots),
                genderBalance: genderSplit !== null && genderSplit !== void 0 ? genderSplit : false,
                minAge: minAge !== null && minAge !== void 0 ? minAge : 0,
                maxAge: maxAge !== null && maxAge !== void 0 ? maxAge : 99,
            },
        });
        const creator = yield prisma.user.findUnique({
            where: { id: Number(creatorId) },
            select: { userName: true, avatarUrl: true },
        });
        const userName = (_a = creator === null || creator === void 0 ? void 0 : creator.userName) !== null && _a !== void 0 ? _a : "Użytkownik";
        const avatarUrl = (_b = creator === null || creator === void 0 ? void 0 : creator.avatarUrl) !== null && _b !== void 0 ? _b : null;
        const joinedCount = yield prisma.eventParticipant.count({
            where: { eventId: event.id },
        });
        const interests = yield prisma.user.findMany({
            where: Object.assign(Object.assign({ userInterests: {
                    some: {
                        activity,
                    },
                } }, (event.minAge !== null && event.maxAge !== null
                ? {
                    age: {
                        gte: event.minAge,
                        lte: event.maxAge,
                    },
                }
                : {})), { id: {
                    not: Number(creatorId),
                } }),
        });
        const userIds = interests.map((user) => user.id);
        const tokens = yield prisma.pushToken.findMany({
            where: { userId: { in: userIds } },
        });
        const fullAddress = address || location || "nieokreślona lokalizacja";
        const messages = tokens
            .filter((t) => expo_server_sdk_1.Expo.isExpoPushToken(t.token))
            .map((t) => ({
            to: t.token,
            sound: "default",
            title: `${userName} zaprasza na ${activity}!`,
            body: `📍 ${fullAddress}\n👥 Uczestnicy: ${joinedCount} / ${spots}`,
            data: {
                activity,
                location,
                address,
                maxParticipants: spots,
                creatorName: userName,
                creatorAvatar: avatarUrl,
            },
        }));
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            yield expo.sendPushNotificationsAsync(chunk);
        }
        yield Promise.all(userIds.map((userId) => prisma.notification.create({
            data: {
                userId,
                message: `${userName} stworzył wydarzenie: ${activity}`,
            },
        })));
        res.status(201).json(event);
    }
    catch (err) {
        console.error("❌ Błąd tworzenia wydarzenia:", err);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
exports.createEventController = createEventController;
