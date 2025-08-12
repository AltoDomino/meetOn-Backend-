// src/server.ts
import "dotenv/config"; // ← załaduj .env NAJWCZEŚNIEJ
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import http from "http";
import type { Socket } from "socket.io";
import { initSocket, io } from "./socket";

// ROUTES
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
// jeśli masz init FCM:
import "./services/NotificationServices/lib/firebaseAdmin";

const app = express();
const server = http.createServer(app);

// ===== Socket.IO boot =====
initSocket(server);

// ===== Middleware =====
app.use(express.json({ limit: "1mb" }));

// CORS: ustaw origin z .env (lista rozdzielona przecinkami) albo "*"
const allowedOrigins =
  process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean) ?? ["*"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Logger żądań
const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  if (Object.keys(req.body ?? {}).length) {
    console.log("Body:", req.body);
  }
  next();
};
app.use(requestLogger);

// ===== Healthcheck =====
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

// ===== ROUTES =====
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
app.use("/api/verification", emailVerificationRoutes);

// ===== 404 handler =====
app.use((_req, res) => {
  res.status(404).json({ error: "Nie znaleziono endpointu" });
});

// ===== Error handler =====
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Błąd serwera:", err);
  res.status(500).json({ error: "Błąd serwera" });
});

// ===== SOCKET.IO events =====
io.on("connection", (socket: Socket) => {
  console.log(`✅ Użytkownik połączony: ${socket.id}`);

  socket.on("joinRoom", (eventId: string) => {
    if (!eventId) return;
    socket.join(eventId);
    console.log(`➡️ Dołączono do pokoju: ${eventId}`);
  });

  socket.on("sendMessage", ({ eventId, content, sender }: { eventId: string; content: string; sender: string }) => {
    if (!eventId || !content || !sender) return;

    const message = {
      sender,
      content,
      timestamp: new Date().toISOString(),
      roomId: eventId, 
    };

    io.to(eventId).emit("message", message);
    console.log(`💬 Wiadomość od ${sender} w ${eventId}: ${content}`);
  });

  socket.on("leaveRoom", (eventId: string) => {
    socket.leave(eventId);
    console.log(`⬅️ Opuścił pokój: ${eventId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Rozłączono: ${socket.id}`);
  });
});

// ===== Start server =====
const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
  console.log(
    `[BOOT] JWT_SECRET present: ${!!process.env.JWT_SECRET} len=${process.env.JWT_SECRET?.length || 0} exp=${process.env.JWT_EXPIRES ?? "7d"}`
  );
});
