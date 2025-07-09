"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const createEventController_1 = require("../controllers/createEventController");
const DeleteEventController_1 = require("../controllers/DeleteEventController");
const GetEventDetailsController_1 = require("../controllers/GetEventDetailsController");
const getJoinedEventsController_1 = require("../controllers/getJoinedEventsController");
const router = express_1.default.Router();
router.get("/joined", getJoinedEventsController_1.getJoinedEventsController);
router.post("/create", createEventController_1.createEventController);
router.delete("/:eventId", DeleteEventController_1.deleteEventController);
router.get("/:id/details", GetEventDetailsController_1.getEventDetailsController);
exports.default = router;
