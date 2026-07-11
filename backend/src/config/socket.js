const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // Auth every socket connection the same way we auth HTTP requests —
  // client sends the access token during the handshake, not as a cookie
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication token missing"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded; // { id, role }
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.user.id}, role: ${socket.user.role})`);

    // Client explicitly joins the scheduler view they're currently looking at.
    // Room key = doctor + date, so updates only reach users viewing that exact slot grid —
    // not a blind broadcast to everyone connected.
    socket.on("scheduler:join", ({ doctorId, date }) => {
      const room = `doctor:${doctorId}:date:${date}`;
      socket.join(room);
    });

    socket.on("scheduler:leave", ({ doctorId, date }) => {
      const room = `doctor:${doctorId}:date:${date}`;
      socket.leave(room);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Services import this to emit events, without needing a reference
// to server.js — avoids a circular require between server.js and services.
const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized yet");
  return io;
};

module.exports = { initSocket, getIO };