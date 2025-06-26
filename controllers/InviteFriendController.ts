import { Request, Response } from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  getFriendRequests
} from "../services/InviteFriendService"

export const handleSendFriendRequest = async (req: Request, res: Response) => {
  const { senderId, receiverName } = req.body;
  if (!senderId || !receiverName)
    return res.status(400).json({ error: "Brakuje danych." });

  try {
    const result = await sendFriendRequest(senderId, receiverName);
    res.status(201).json(result);
  } catch (error: any) {
    console.error("❌ Błąd zaproszenia:", error);
    res.status(500).json({ error: error.message || "Błąd serwera" });
  }
};

export const handleAcceptFriendRequest = async (req: Request, res: Response) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) return res.status(400).json({ error: "Brak danych." });

  try {
    const friendship = await acceptFriendRequest(senderId, receiverId);
    res.status(200).json(friendship);
  } catch (error) {
    console.error("❌ Błąd akceptowania zaproszenia:", error);
    res.status(500).json({ error: "Błąd serwera" });
  }
};

export const handleGetFriends = async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  if (!userId) return res.status(400).json({ error: "Brak userId." });

  try {
    const friends = await getFriends(userId);
    res.status(200).json(friends);
  } catch (error) {
    console.error("❌ Błąd pobierania znajomych:", error);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
export const handleGetFriendRequests = async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  if (!userId) return res.status(400).json({ error: "Brak userId." });

  try {
    const requests = await getFriendRequests(userId);
res.status(200).json(requests);
  } catch (error) {
    console.error("❌ Błąd pobierania zaproszeń:", error);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
export { getFriends };

