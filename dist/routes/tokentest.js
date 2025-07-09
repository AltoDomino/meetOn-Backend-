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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/tokentest.ts
const express_1 = __importDefault(require("express"));
const expo_server_sdk_1 = require("expo-server-sdk");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const expo = new expo_server_sdk_1.Expo();
const prisma = new client_1.PrismaClient();
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, message } = req.body;
    console.log("Req body:", req.body);
    if (!userId) {
        return res.status(400).json({ error: "Brak userId w zapytaniu" });
    }
    try {
        const tokenRecord = yield prisma.pushToken.findUnique({
            where: { userId: Number(userId) },
        });
        if (!tokenRecord || !expo_server_sdk_1.Expo.isExpoPushToken(tokenRecord.token)) {
            return res.status(400).json({ error: "Brak prawidłowego tokena push" });
        }
        const notification = {
            to: tokenRecord.token,
            sound: "default",
            title: "Test powiadomienia",
            body: message || "To jest testowe powiadomienie",
        };
        const chunks = expo.chunkPushNotifications([notification]);
        for (const chunk of chunks) {
            yield expo.sendPushNotificationsAsync(chunk);
        }
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.error("Błąd push:", err);
        res.status(500).json({ error: "Błąd wysyłki" });
    }
}));
exports.default = router;
