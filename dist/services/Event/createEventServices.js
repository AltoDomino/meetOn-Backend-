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
exports.createEvent = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createEvent = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield prisma.event.create({
        data: {
            location: data.location,
            address: data.address,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            activity: data.activity,
            creatorId: data.creatorId,
            maxParticipants: data.spots,
            genderBalance: (_a = data.genderBalance) !== null && _a !== void 0 ? _a : false,
        },
    });
    console.log("📝 Event zapisany:", result);
    return result;
});
exports.createEvent = createEvent;
