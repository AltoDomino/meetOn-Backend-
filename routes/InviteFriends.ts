import express from "express";
import {
  handleSendFriendRequest,
  handleAcceptFriendRequest,
  handleGetFriends,
  handleGetFriendRequests
} from "../controllers/InviteFriendController";

const router = express.Router();

router.post("/send", handleSendFriendRequest);
router.post("/accept", handleAcceptFriendRequest);
router.get("/requests/:userId", handleGetFriendRequests);
router.get("/:userId", handleGetFriends);

export default router;
