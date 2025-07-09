"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const eventListController_1 = require("../controllers/eventListController");
const router = express_1.default.Router();
router.get("/", eventListController_1.getFilteredEvents);
exports.default = router;
