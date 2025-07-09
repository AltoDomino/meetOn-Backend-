"use strict";
// controllers/UserInterest.ts
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
exports.getInterestsController = exports.saveInterestsController = void 0;
const UserInterest_1 = require("../services/UserInterest");
const saveInterestsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.params.userId);
    const { interests } = req.body;
    if (!userId || !Array.isArray(interests)) {
        return res.status(400).json({ error: "Brakuje danych wejściowych" });
    }
    try {
        yield (0, UserInterest_1.saveUserInterests)(userId, interests);
        return res.status(200).json({ message: "Zainteresowania zapisane" });
    }
    catch (error) {
        console.error("❌ Błąd zapisu zainteresowań:", error);
        return res.status(500).json({ error: "Wewnętrzny błąd serwera" });
    }
});
exports.saveInterestsController = saveInterestsController;
const getInterestsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.params.userId);
    if (!userId) {
        return res.status(400).json({ error: "Brakuje userId" });
    }
    try {
        const interests = yield (0, UserInterest_1.getUserInterests)(userId);
        return res.status(200).json(interests);
    }
    catch (error) {
        console.error("Błąd pobierania zainteresowań:", error);
        return res.status(500).json({ error: "Błąd serwera" });
    }
});
exports.getInterestsController = getInterestsController;
