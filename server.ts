import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { initSocket, io } from "./socket";
import type { Socket } from "socket.io";

import registerRouter from "./routes/auth.registrationRoutes";
import emailVerificationRoutes from "./routes/auth.registrationRoutes";
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

dotenv.config();

const app = express();
const server = http.createServer(app); // potrzebne do socket.io
initSocket(server); // 👈 uruchamiamy socket.io

// Middleware
app.use(express.json());
app.use(cors());

// Logger
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  if (Object.keys(req.body).length) console.log("Body:", req.body);
  next();
};
app.use(requestLogger);

// ROUTES
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
app.use("/api/verification", emailVerificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Nie znaleziono endpointu" });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Błąd serwera:", err.message);
  res.status(500).json({ error: "Błąd serwera" });
});

// SOCKET.IO event handlers
io.on("connection", (socket: Socket) => {
  console.log(`✅ Użytkownik połączony: ${socket.id}`);

  socket.on("joinRoom", (eventId: string) => {
    socket.join(eventId);
    console.log(`➡️ Dołączono do pokoju: ${eventId}`);
  });

  socket.on("sendMessage", ({ eventId, content, sender }) => {
    const message = {
      sender,
      content,
      timestamp: new Date().toISOString(),
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

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
});

app.post("/api/test", (req, res) => {
  console.log("💥 TESTOWA TRASA działa", req.body);
  res.status(200).json({ success: true });
});
