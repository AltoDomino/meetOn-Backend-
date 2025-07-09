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
exports.uploadAvatarController = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// 📁 Ustawienia przechowywania plików
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const dir = "./uploads/avatars";
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `avatar_${Date.now()}${ext}`);
    },
});
const upload = (0, multer_1.default)({ storage });
// 📤 Middleware + logika
exports.uploadAvatarController = [
    upload.single("avatar"),
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = Number(req.body.userId);
        if (!req.file || !userId) {
            return res.status(400).json({ error: "Brakuje pliku lub userId." });
        }
        const relativePath = `/uploads/avatars/${req.file.filename}`;
        const avatarUrl = `${req.protocol}://${req.get("host")}${relativePath}`;
        try {
            yield prisma.user.update({
                where: { id: userId },
                data: { avatarUrl },
            });
            return res.status(200).json({ avatarUrl });
        }
        catch (error) {
            console.error("❌ Błąd aktualizacji avatara:", error);
            return res.status(500).json({ error: "Błąd serwera przy zapisie avatara." });
        }
    }),
];
