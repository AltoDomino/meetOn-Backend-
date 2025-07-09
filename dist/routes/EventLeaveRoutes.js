"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const EventLeaveController_1 = require("../controllers/EventLeaveController");
const router = express_1.default.Router();
router.post("/", EventLeaveController_1.leaveEventController);
exports.default = router;
