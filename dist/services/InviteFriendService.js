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
exports.getFriendRequests = exports.getFriends = exports.acceptFriendRequest = exports.sendFriendRequest = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const sendFriendRequest = (senderId, receiverName) => __awaiter(void 0, void 0, void 0, function* () {
    const receiver = yield prisma.user.findUnique({
        where: { userName: receiverName },
    });
    if (!receiver)
        throw new Error("Użytkownik nie istnieje");
    if (receiver.id === senderId)
        throw new Error("Nie możesz wysłać zaproszenia do siebie");
    return yield prisma.friendship.create({
        data: {
            requesterId: senderId,
            recipientId: receiver.id,
            status: "PENDING",
        },
    });
});
exports.sendFriendRequest = sendFriendRequest;
const acceptFriendRequest = (senderId, receiverId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma.friendship.updateMany({
        where: {
            requesterId: senderId,
            recipientId: receiverId,
            status: "PENDING",
        },
        data: {
            status: "ACCEPTED",
        },
    });
});
exports.acceptFriendRequest = acceptFriendRequest;
const getFriends = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const friendships = yield prisma.friendship.findMany({
        where: {
            OR: [
                { requesterId: userId, status: "ACCEPTED" },
                { recipientId: userId, status: "ACCEPTED" },
            ],
        },
        include: {
            requester: { select: { id: true, userName: true } },
            recipient: { select: { id: true, userName: true } },
        },
    });
    return friendships.map((f) => f.requesterId === userId ? f.recipient : f.requester);
});
exports.getFriends = getFriends;
const getFriendRequests = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const requests = yield prisma.friendship.findMany({
        where: {
            recipientId: userId,
            status: "PENDING",
        },
        include: {
            requester: {
                select: {
                    id: true,
                    userName: true,
                },
            },
        },
    });
    return requests.map((r) => ({
        requesterId: r.requester.id,
        userName: r.requester.userName,
    }));
});
exports.getFriendRequests = getFriendRequests;
