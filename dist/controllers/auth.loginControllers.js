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
exports.getLogin = void 0;
const auth_loginService_1 = require("../services/auth.loginService");
const getLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield (0, auth_loginService_1.login)(email, password);
        if (!user) {
            return res.status(401).json({ message: "Niepoprawny email lub hasło" });
        }
        return res.status(200).json({
            userId: user.id, // 👈 TU BYŁO BRAK
            userName: user.userName,
            email: user.email,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getLogin = getLogin;
