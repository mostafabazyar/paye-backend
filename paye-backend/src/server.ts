import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profileRoutes";
import userRoutes from "./routes/userRoutes";
import requestRoutes from "./routes/requestRoutes";
import chatRoutes from "./routes/chat.routes";
import { setupChatSocket } from "./socket/chat.socket";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Define allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://78.31.235.12",
  "http://78.31.235.12:3000",
  "http://78.31.235.12:5000",
  "https://78.31.235.12",
  "http://10.10.10.144:3000",
  "http://10.10.10.144:5000"
];

// Socket.IO CORS configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  },
});

// Express CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`Blocked CORS request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Length", "X-Kuma-Revision"]
  })
);

app.options('*', cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/chat", chatRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Paye Backend Running" });
});

setupChatSocket(io);

// Listen on all network interfaces
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Network: http://78.31.235.12:${PORT}`);
  console.log(`📍 Network: http://10.10.10.144:${PORT}`);
  console.log(`✅ Allowed CORS origins:`, allowedOrigins);
});
