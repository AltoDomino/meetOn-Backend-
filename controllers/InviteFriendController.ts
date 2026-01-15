import { Request, Response } from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  getFriendRequests,
  removeFriend,
  rejectFriendRequest,
  cancelFriendRequest, // opcjonalnie - jeśli nie chcesz /cancel w routerze, usuń ten import
} from "../services/InviteFriendService";

export const handleSendFriendRequest = async (req: Request, res: Response) => {
  const { senderId, receiverName } = req.body;

  if (!senderId || !receiverName) {
    return res.status(400).json({ error: "Brakuje danych." });
  }

  try {
    const result = await sendFriendRequest(Number(senderId), String(receiverName));
    return res.status(201).json(result);
  } catch (error: any) {
    console.error("❌ Błąd zaproszenia:", error);
    return res.status(500).json({ error: error.message || "Błąd serwera" });
  }
};

export const handleAcceptFriendRequest = async (req: Request, res: Response) => {
  const { senderId, receiverId } = req.body;

  if (!senderId || !receiverId) {
    return res.status(400).json({ error: "Brak danych." });
  }

  try {
    const friendship = await acceptFriendRequest(Number(senderId), Number(receiverId));
    return res.status(200).json(friendship);
  } catch (error: any) {
    console.error("❌ Błąd akceptowania zaproszenia:", error);
    return res.status(500).json({ error: error.message || "Błąd serwera" });
  }
};

export const handleGetFriends = async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: "Brak userId." });
  }

  try {
    const friends = await getFriends(userId);
    return res.status(200).json(friends);
  } catch (error: any) {
    console.error("❌ Błąd pobierania znajomych:", error);
    return res.status(500).json({ error: error.message || "Błąd serwera" });
  }
};

export const handleGetFriendRequests = async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: "Brak userId." });
  }

  try {
    const requests = await getFriendRequests(userId);
    return res.status(200).json(requests);
  } catch (error: any) {
    console.error("❌ Błąd pobierania zaproszeń:", error);
    return res.status(500).json({ error: error.message || "Błąd serwera" });
  }
};

/**
 * ✅ USUŃ ZNAJOMEGO
 * POST /api/invite-friends/remove
 * body: { userId, friendId }
 */
export const handleRemoveFriend = async (req: Request, res: Response) => {
  const { userId, friendId } = req.body;

  if (!userId || !friendId) {
    return res.status(400).json({ error: "Brak danych." });
  }

  try {
    const result = await removeFriend(Number(userId), Number(friendId));
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Błąd usuwania znajomego:", error);
    return res.status(400).json({ error: error.message || "Błąd serwera" });
  }
};

/**
 * ✅ ODRZUĆ ZAPROSZENIE (recipient usuwa PENDING)
 * POST /api/invite-friends/reject
 * body: { userId, requesterId }
 *
 * userId = ID odbiorcy (ten co odrzuca)
 * requesterId = ID nadawcy (ten co wysłał)
 */
export const handleRejectFriendRequest = async (req: Request, res: Response) => {
  const { userId, requesterId } = req.body;

  if (!userId || !requesterId) {
    return res.status(400).json({ error: "Brak danych." });
  }

  try {
    const result = await rejectFriendRequest(Number(userId), Number(requesterId));
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Błąd odrzucenia zaproszenia:", error);
    return res.status(400).json({ error: error.message || "Błąd serwera" });
  }
};

/**
 * ✅ (OPCJONALNIE) ANULUJ ZAPROSZENIE (requester usuwa PENDING)
 * POST /api/invite-friends/cancel
 * body: { userId, recipientId }
 *
 * userId = ID nadawcy (ten co anuluję)
 * recipientId = ID odbiorcy
 */
export const handleCancelFriendRequest = async (req: Request, res: Response) => {
  const { userId, recipientId } = req.body;

  if (!userId || !recipientId) {
    return res.status(400).json({ error: "Brak danych." });
  }

  try {
    const result = await cancelFriendRequest(Number(userId), Number(recipientId));
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Błąd anulowania zaproszenia:", error);
    return res.status(400).json({ error: error.message || "Błąd serwera" });
  }
};

// (jeśli gdzieś tego używasz)
export { getFriends };
