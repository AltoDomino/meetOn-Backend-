import { Server } from "socket.io";

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(",") || "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"], // 👈 stabilność połączenia
  });

  return io;
};

export { io };
