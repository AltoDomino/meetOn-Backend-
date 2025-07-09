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
exports.joinEventController = void 0;
const EventJoinService_1 = require("../services/Event/EventJoinService");
const socket_1 = require("../socket");
const joinEventController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, eventId } = req.body;
    if (!userId || !eventId) {
        return res.status(400).json({ error: "Brak userId lub eventId" });
    }
    try {
        const result = yield (0, EventJoinService_1.joinEvent)(Number(userId), Number(eventId));
        // Emituj aktualizację do wszystkich w pokoju wydarzenia
        socket_1.io.to(eventId.toString()).emit("participantJoined", { userId, eventId });
        res.status(201).json(result);
    }
    catch (error) {
        console.error("❌ Błąd dołączania do wydarzenia:", error);
        res.status(500).json({ error: error.message });
    }
});
exports.joinEventController = joinEventController;
