"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const InviteFriendController_1 = require("../controllers/InviteFriendController");
const router = express_1.default.Router();
router.post("/send", InviteFriendController_1.handleSendFriendRequest);
router.post("/accept", InviteFriendController_1.handleAcceptFriendRequest);
router.get("/requests/:userId", InviteFriendController_1.handleGetFriendRequests);
router.get("/:userId", InviteFriendController_1.handleGetFriends);
exports.default = router;
