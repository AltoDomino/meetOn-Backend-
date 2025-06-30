import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

// ROUTES
import registerRouter from "./routes/auth.registrationRoutes";
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

dotenv.config({ path: "C:\\meetOn-Backend-\\.env" });

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT;

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

app.use("/api/events", eventListRoutes); // GET /api/events?userId=1
app.use("/api/event", EventRoutes);      // GET /api/event/joined
app.use("/api/join", EventJoinRoutes);
app.use("/api/leave", EventLeaveRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Nie znaleziono endpointu" });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Błąd serwera:", err.message);
  res.status(500).json({ error: "Błąd serwera" });
});

app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
});
