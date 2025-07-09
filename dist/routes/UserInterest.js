"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserInterest_1 = require("../controllers/UserInterest");
const router = express_1.default.Router();
router.patch("/:userId", UserInterest_1.saveInterestsController);
router.get("/:userId", UserInterest_1.getInterestsController);
exports.default = router;
