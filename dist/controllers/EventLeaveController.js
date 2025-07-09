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
exports.leaveEventController = void 0;
const EventLeaveService_1 = require("../services/Event/EventLeaveService");
const socket_1 = require("../socket");
const leaveEventController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, eventId } = req.body;
    if (!userId || !eventId) {
        return res.status(400).json({ error: "Brakuje userId lub eventId." });
    }
    try {
        const result = yield (0, EventLeaveService_1.leaveEvent)(Number(userId), Number(eventId));
        // Emituj do pokoju eventu info o zmianie uczestników
        socket_1.io.to(eventId.toString()).emit("participantLeft", { userId, eventId });
        res.status(200).json(result);
    }
    catch (err) {
        console.error("❌ Błąd opuszczania wydarzenia:", err);
        res.status(403).json({ error: err.message });
    }
});
exports.leaveEventController = leaveEventController;
