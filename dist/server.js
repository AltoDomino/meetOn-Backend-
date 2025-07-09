"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const socket_1 = require("./socket"); // 👈 socket init
// ROUTES
const auth_registrationRoutes_1 = __importDefault(require("./routes/auth.registrationRoutes"));
const auth_loginRoutes_1 = __importDefault(require("./routes/auth.loginRoutes"));
const UserInterest_1 = __importDefault(require("./routes/UserInterest"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const pushTokenRoutes_1 = __importDefault(require("./routes/pushTokenRoutes"));
const tokentest_1 = __importDefault(require("./routes/tokentest"));
const eventListRoutes_1 = __importDefault(require("./routes/eventListRoutes"));
const EventRoutes_1 = __importDefault(require("./routes/EventRoutes"));
const InviteFriends_1 = __importDefault(require("./routes/InviteFriends"));
const EventJoinRoutes_1 = __importDefault(require("./routes/EventJoinRoutes"));
const EventLeaveRoutes_1 = __importDefault(require("./routes/EventLeaveRoutes"));
const AvatarRoutes_1 = __importDefault(require("./routes/AvatarRoutes"));
const auth_settingsRoutes_1 = __importDefault(require("./routes/auth.settingsRoutes"));
dotenv_1.default.config({ path: "C:\\meetOn-Backend-\\.env" });
const app = (0, express_1.default)();
const server = http_1.default.createServer(app); // potrzebne do socket.io
(0, socket_1.initSocket)(server); // 👈 uruchamiamy socket.io
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Logger
const requestLogger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (Object.keys(req.body).length)
        console.log("Body:", req.body);
    next();
};
app.use(requestLogger);
// ROUTES
app.use("/api/registration", auth_registrationRoutes_1.default);
app.use("/api/login", auth_loginRoutes_1.default);
app.use("/api/interests", UserInterest_1.default);
app.use("/api/notifications", notificationRoutes_1.default);
app.use("/api/push-token", pushTokenRoutes_1.default);
app.use("/api/test-push", tokentest_1.default);
app.use("/api/invite-friends", InviteFriends_1.default);
app.use("/api/events", eventListRoutes_1.default);
app.use("/api/event", EventRoutes_1.default);
app.use("/api/join", EventJoinRoutes_1.default);
app.use("/api/leave", EventLeaveRoutes_1.default);
app.use("/uploads", express_1.default.static("uploads"));
app.use("/api/avatar", AvatarRoutes_1.default);
app.use("/api/user", auth_settingsRoutes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Nie znaleziono endpointu" });
});
// Error handler
app.use((err, req, res, next) => {
    console.error("❌ Błąd serwera:", err.message);
    res.status(500).json({ error: "Błąd serwera" });
});
// SOCKET.IO event handlers
socket_1.io.on("connection", (socket) => {
    console.log(`✅ Użytkownik połączony: ${socket.id}`);
    socket.on("joinRoom", (eventId) => {
        socket.join(eventId);
        console.log(`➡️ Dołączono do pokoju: ${eventId}`);
    });
    socket.on("sendMessage", ({ eventId, content, sender }) => {
        const message = {
            sender,
            content,
            timestamp: new Date().toISOString(),
        };
        socket_1.io.to(eventId).emit("message", message);
        console.log(`💬 Wiadomość od ${sender} w ${eventId}: ${content}`);
    });
    socket.on("leaveRoom", (eventId) => {
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
