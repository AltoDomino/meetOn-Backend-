"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_loginControllers_1 = require("../controllers/auth.loginControllers");
const router = express_1.default.Router();
router.post("/", auth_loginControllers_1.getLogin);
exports.default = router;
