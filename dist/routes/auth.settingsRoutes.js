"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SettingsController_1 = require("../controllers/SettingsController");
const router = express_1.default.Router();
router.put("/profile", SettingsController_1.updateUserProfile);
router.get("/profile/:id", SettingsController_1.getUserProfile);
exports.default = router;
