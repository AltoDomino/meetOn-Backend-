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
import EventRoutes from "./routes/EventRoutes"; // Główne endpointy wydarzeń
import InviteFriends from "./routes/InviteFriends";
import EventJoinRoutes from "./routes/EventJoinRoutes";
import EventLeaveRoutes from "./routes/EventLeaveRoutes";

dotenv.config({ path: "C:\\meetOn-Backend-\\.env" });

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT;

// Logger (opcjonalny)
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

// Wydarzenia
app.use("/api/events", eventListRoutes); // np. GET /api/events?userId=1&ownOnly=false
app.use("/api/event", EventRoutes)    // np. GET /api/events/:id/details, POST, DELETE

app.use("/api/join", EventJoinRoutes);
app.use("/api/leave", EventLeaveRoutes);

// app.use(serverErrorHandler); // middleware błędów (opcjonalnie)
// app.use(notFoundHandler);    // middleware 404 (opcjonalnie)

app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
});
