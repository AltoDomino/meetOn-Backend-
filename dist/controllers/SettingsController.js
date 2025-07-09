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
exports.getUserProfile = exports.updateUserProfile = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, userName, description, password } = req.body;
    if (!userId)
        return res.status(400).json({ error: "Brak userId" });
    try {
        const updatedUser = yield prisma.user.update({
            where: { id: userId },
            data: {
                userName,
                description,
            },
        });
        res.status(200).json(updatedUser);
    }
    catch (err) {
        console.error("❌ Błąd aktualizacji użytkownika:", err);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
exports.updateUserProfile = updateUserProfile;
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.params.id);
    if (!userId)
        return res.status(400).json({ error: "Brak ID użytkownika" });
    try {
        const user = yield prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, userName: true, avatarUrl: true, description: true },
        });
        if (!user)
            return res.status(404).json({ error: "Użytkownik nie istnieje" });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: "Błąd serwera" });
    }
});
exports.getUserProfile = getUserProfile;
