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
exports.joinEvent = void 0;
const client_1 = require("@prisma/client");
const expo_server_sdk_1 = require("expo-server-sdk");
const prisma = new client_1.PrismaClient();
const expo = new expo_server_sdk_1.Expo();
const joinEvent = (userId, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const alreadyJoined = yield prisma.eventParticipant.findUnique({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
    });
    if (alreadyJoined) {
        throw new Error("Użytkownik już dołączył do wydarzenia.");
    }
    const event = yield prisma.event.findUnique({
        where: { id: eventId },
        include: {
            creator: { select: { userName: true } },
            eventParticipants: { include: { user: true } },
        },
    });
    if (!event)
        throw new Error("Nie znaleziono wydarzenia.");
    const participants = event.eventParticipants;
    const totalSpots = event.maxParticipants;
    const currentCount = participants.length;
    if (currentCount >= totalSpots) {
        throw new Error("Brak miejsc w wydarzeniu.");
    }
    const joiningUser = yield prisma.user.findUnique({
        where: { id: userId },
        select: { gender: true, age: true, userName: true }, // ⬅️ Dodano userName
    });
    if (!joiningUser)
        throw new Error("Nie znaleziono użytkownika.");
    if (!joiningUser.gender)
        throw new Error("Brak informacji o płci użytkownika.");
    if (event.minAge !== null &&
        event.maxAge !== null &&
        (joiningUser.age === null ||
            joiningUser.age < event.minAge ||
            joiningUser.age > event.maxAge)) {
        throw new Error("Twój wiek nie mieści się w wymaganym zakresie wydarzenia.");
    }
    if (event.genderBalance) {
        const males = participants.filter((p) => { var _a; return ((_a = p.user) === null || _a === void 0 ? void 0 : _a.gender) === "male"; }).length;
        const females = participants.filter((p) => { var _a; return ((_a = p.user) === null || _a === void 0 ? void 0 : _a.gender) === "female"; }).length;
        const half = Math.floor(totalSpots / 2);
        const isOdd = totalSpots % 2 === 1;
        const allJoined = males + females;
        if (joiningUser.gender === "male") {
            if (males >= half && !(isOdd && allJoined === totalSpots - 1)) {
                throw new Error("Limit miejsc dla mężczyzn został osiągnięty.");
            }
        }
        if (joiningUser.gender === "female") {
            if (females >= half && !(isOdd && allJoined === totalSpots - 1)) {
                throw new Error("Limit miejsc dla kobiet został osiągnięty.");
            }
        }
    }
    yield prisma.eventParticipant.create({
        data: { userId, eventId },
    });
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
        title: `👤 ${joiningUser.userName} dołączył/a do wydarzenia: ${event.activity}`,
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
    return { message: "Dołączono do wydarzenia." };
});
exports.joinEvent = joinEvent;
