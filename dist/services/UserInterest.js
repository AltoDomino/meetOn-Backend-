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
exports.getUserInterests = exports.saveUserInterests = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const saveUserInterests = (userId, activities) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Usuwam stare zainteresowania użytkownika ID:", userId);
    yield prisma.userInterest.deleteMany({
        where: { userId }
    });
    const data = activities.map((activity) => ({
        userId,
        activity
    }));
    console.log("Zapisuję nowe zainteresowania:", data);
    const result = yield prisma.userInterest.createMany({
        data
    });
    console.log("Wynik zapisu:", result);
    return result;
});
exports.saveUserInterests = saveUserInterests;
const getUserInterests = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma.userInterest.findMany({
        where: { userId }
    });
});
exports.getUserInterests = getUserInterests;
