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
exports.getFriends = exports.handleGetFriendRequests = exports.handleGetFriends = exports.handleAcceptFriendRequest = exports.handleSendFriendRequest = void 0;
const InviteFriendService_1 = require("../services/InviteFriendService");
Object.defineProperty(exports, "getFriends", { enumerable: true, get: function () { return InviteFriendService_1.getFriends; } });
const handleSendFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { senderId, receiverName } = req.body;
    if (!senderId || !receiverName)
        return res.status(400).json({ error: "Brakuje danych." });
    try {
        const result = yield (0, InviteFriendService_1.sendFriendRequest)(senderId, receiverName);
        res.status(201).json(result);
    }
    catch (error) {
        console.error("❌ Błąd zaproszenia:", error);
        res.status(500).json({ error: error.message || "Błąd serwera" });
    }
});
exports.handleSendFriendRequest = handleSendFriendRequest;
const handleAcceptFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { senderId, receiverId } = req.body;
    if (!senderId || !receiverId)
        return res.status(400).json({ error: "Brak danych." });
    try {
        const friendship = yield (0, InviteFriendService_1.acceptFriendRequest)(senderId, receiverId);
        res.status(200).json(friendship);
    }
    catch (error) {
        console.error("❌ Błąd akceptowania zaproszenia:", error);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
exports.handleAcceptFriendRequest = handleAcceptFriendRequest;
const handleGetFriends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.params.userId);
    if (!userId)
        return res.status(400).json({ error: "Brak userId." });
    try {
        const friends = yield (0, InviteFriendService_1.getFriends)(userId);
        res.status(200).json(friends);
    }
    catch (error) {
        console.error("❌ Błąd pobierania znajomych:", error);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
exports.handleGetFriends = handleGetFriends;
const handleGetFriendRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.params.userId);
    if (!userId)
        return res.status(400).json({ error: "Brak userId." });
    try {
        const requests = yield (0, InviteFriendService_1.getFriendRequests)(userId);
        res.status(200).json(requests);
    }
    catch (error) {
        console.error("❌ Błąd pobierania zaproszeń:", error);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
exports.handleGetFriendRequests = handleGetFriendRequests;
