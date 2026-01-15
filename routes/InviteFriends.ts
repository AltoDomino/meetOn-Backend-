import express from "express";
import {
  handleSendFriendRequest,
  handleAcceptFriendRequest,
  handleGetFriends,
  handleGetFriendRequests,
  handleRemoveFriend,
  handleRejectFriendRequest,
  handleCancelFriendRequest,
} from "../controllers/InviteFriendController";

const router = express.Router();

router.post("/send", handleSendFriendRequest);
router.post("/accept", handleAcceptFriendRequest);

router.post("/remove", handleRemoveFriend);
router.post("/reject", handleRejectFriendRequest);
router.post("/cancel", handleCancelFriendRequest); // opcjonalnie

router.get("/requests/:userId", handleGetFriendRequests);
router.get("/:userId", handleGetFriends);

export default router;
