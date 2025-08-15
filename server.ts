// src/server.ts
import "dotenv/config"; // wczytaj .env NAJWCZEŚNIEJ
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import http from "http";
import type { Socket } from "socket.io";
import { initSocket, io } from "./socket";

// ===== ROUTES =====
import registerRouter from "./routes/auth.registrationRoutes";
import emailVerificationRoutes from "./routes/auth.verificationRoutes";
import loginRouter from "./routes/auth.loginRoutes";
import userInterestRoutes from "./routes/UserInterest";
import notificationRoutes from "./routes/notificationRoutes";
import pushTokenRoutes from "./routes/pushTokenRoutes";
import tokentest from "./routes/tokentest";
import eventListRoutes from "./routes/eventListRoutes";
import EventRoutes from "./routes/EventRoutes";
import InviteFriends from "./routes/InviteFriends";
import EventJoinRoutes from "./routes/EventJoinRoutes";
import EventLeaveRoutes from "./routes/EventLeaveRoutes";
import AvatarRoutes from "./routes/AvatarRoutes";
import settingsRoutes from "./routes/auth.settingsRoutes";
import notificationPreference from "./routes/notificationPreference";
import "./services/NotificationServices/lib/firebaseAdmin";

// ⬇️ RANKINGI
import rankRoutes from "./routes/rankRoutes";

// ===== App / Server =====
const app = express();
const server = http.createServer(app);
initSocket(server);

// ===== Middleware =====
app.use(express.json({ limit: "1mb" }));
// (opcjonalnie) jeśli gdzieś używasz application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// CORS
const allowedOrigins =
  process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean) ?? ["*"];

// UWAGA: credentials + "*" nie jest dozwolone -> wyłączamy credentials, gdy wildcard
const isWildcard = allowedOrigins.length === 1 && allowedOrigins[0] === "*";
app.use(
  cors({
    origin: isWildcard ? "*" : allowedOrigins,
    credentials: !isWildcard, // tylko jeśli nie wildcard
  })
);

// Logger
const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
  const origin = req.headers.origin ?? "-";
  console.log(`${req.method} ${req.url} :: origin=${origin}`);
  if (Object.keys(req.body ?? {}).length) console.log("Body:", req.body);
  next();
};
app.use(requestLogger);

// Healthcheck
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

// ===== ROUTES MOUNT =====
app.use("/api/registration", registerRouter);
app.use("/api/login", loginRouter);
app.use("/api/interests", userInterestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/push-token", pushTokenRoutes);
app.use("/api/test-push", tokentest);
app.use("/api/invite-friends", InviteFriends);
app.use("/api/events", eventListRoutes);
app.use("/api/event", EventRoutes);
app.use("/api/join", EventJoinRoutes);
app.use("/api/leave", EventLeaveRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/avatar", AvatarRoutes);
app.use("/api/user", settingsRoutes);
app.use("/api/users", notificationPreference);
app.use("/api/rank", rankRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: "Nie znaleziono endpointu" }));

// Error
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Błąd serwera:", err);
  res.status(500).json({ error: "Błąd serwera" });
});

// ======= SOCKET.IO with backlog =======
type ChatMsg = {
  sender: string;
  content: string;
  timestamp: string;
  roomId: string; // dm:112_113 lub eventId
};

// roomId -> ostatnie wiadomości
const roomHistory = new Map<string, ChatMsg[]>();
const MAX_HISTORY = Number(process.env.CHAT_HISTORY_SIZE ?? 50);

io.on("connection", (socket: Socket) => {
  console.log(`✅ Użytkownik połączony: ${socket.id}`);

  socket.on("joinRoom", (eventId: string) => {
    if (!eventId) return;
    socket.join(eventId);
    console.log(`➡️ Dołączono do pokoju: ${eventId}`);

    // odeślij backlog TYLKO do dołączającego
    const hist = roomHistory.get(eventId) ?? [];
    if (hist.length) {
      socket.emit("history", { roomId: eventId, messages: hist });
    }
  });

  socket.on(
    "sendMessage",
    ({ eventId, content, sender }: { eventId: string; content: string; sender: string }) => {
      if (!eventId || !content || !sender) return;

      const msg: ChatMsg = {
        sender,
        content,
        timestamp: new Date().toISOString(),
        roomId: eventId,
      };

      // zapisz do backlogu
      const arr = roomHistory.get(eventId) ?? [];
      arr.push(msg);
      if (arr.length > MAX_HISTORY) arr.shift();
      roomHistory.set(eventId, arr);

      io.to(eventId).emit("message", msg);
      console.log(`💬 Wiadomość od ${sender} w ${eventId}: ${content}`);
    }
  );

  socket.on("leaveRoom", (eventId: string) => {
    if (!eventId) return;
    socket.leave(eventId);
    console.log(`⬅️ Opuścił pokój: ${eventId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Rozłączono: ${socket.id}`);
  });
});

// ===== Start =====
const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
  console.log(
    `[BOOT] JWT_SECRET present: ${!!process.env.JWT_SECRET} len=${process.env.JWT_SECRET?.length || 0} exp=${process.env.JWT_EXPIRES ?? "7d"}`
  );
});
