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
exports.leaveEvent = void 0;
const client_1 = require("@prisma/client");
const expo_server_sdk_1 = require("expo-server-sdk");
const prisma = new client_1.PrismaClient();
const expo = new expo_server_sdk_1.Expo();
const leaveEvent = (userId, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma.user.findUnique({
        where: { id: userId },
        select: { userName: true },
    });
    if (!user)
        throw new Error("Użytkownik nie istnieje.");
    const participation = yield prisma.eventParticipant.findUnique({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
    });
    if (!participation) {
        throw new Error("Użytkownik nie jest zapisany na to wydarzenie.");
    }
    yield prisma.eventParticipant.delete({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
    });
    const event = yield prisma.event.findUnique({
        where: { id: eventId },
        include: {
            creator: { select: { userName: true } },
        },
    });
    if (!event)
        throw new Error("Wydarzenie nie istnieje.");
    const joinedCount = yield prisma.eventParticipant.count({
        where: { eventId },
    });
    const interests = yield prisma.userInterest.findMany({
        where: {
            activity: event.activity,
            userId: { not: userId },
        },
    });
    const userIds = interests.map((i) => i.userId);
    const tokens = yield prisma.pushToken.findMany({
        where: {
            userId: { in: userIds },
        },
    });
    const fullAddress = event.address || event.location || "nieznana lokalizacja";
    const messages = tokens
        .filter((t) => expo_server_sdk_1.Expo.isExpoPushToken(t.token))
        .map((t) => ({
        to: t.token,
        sound: "default",
        title: `🚪 ${user.userName} opuścił/a wydarzenie: ${event.activity}`,
        body: `📍 ${fullAddress}\nUczestników: ${joinedCount} / ${event.maxParticipants}`,
        data: {
            eventId: event.id,
            activity: event.activity,
        },
    }));
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
        yield expo.sendPushNotificationsAsync(chunk);
    }
    return { message: "Użytkownik opuścił wydarzenie." };
});
exports.leaveEvent = leaveEvent;
