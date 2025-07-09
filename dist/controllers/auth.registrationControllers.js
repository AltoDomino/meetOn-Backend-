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
exports.getRegister = void 0;
const auth_registrationserice_1 = require("../services/auth.registrationserice");
const getRegister = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userName, email, password, gender, age } = req.body;
        if (!userName || !email || !password || !gender || !age) {
            return res.status(400).json({ message: "Wszystkie pola są wymagane." });
        }
        const user = yield (0, auth_registrationserice_1.register)(userName, email, password, gender, age);
        res.status(201).json({ message: "Użytkownik zarejestrowany", user });
    }
    catch (error) {
        next(error);
    }
});
exports.getRegister = getRegister;
