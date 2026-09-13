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

//Admin Routes
import adminAuthRoutes from "./routes/admin/adminAuth.routes";
import adminRoutes from "./routes/admin/admin.routes";
import adminUserRoutes from "./routes/admin/adminUser.routes";
import adminListingRoutes from "./routes/admin/adminListing.routes";
import adminRequestRoutes from "./routes/admin/adminRequest.routes";
import adminImpersonationRoutes from "./routes/admin/adminImpersonation.routes";
import adminManagementRoutes from "./routes/admin/adminManagement.routes";
import adminAuditRoutes from "./routes/admin/adminAudit.routes";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Define allowed origins - ADD YOUR OTP VIEWER URL
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",  // OTP Viewer
  "http://localhost:3005",  // Admin Viewer
  "http://localhost:5000",
  "http://78.31.235.12",
  "http://78.31.235.12:3000",
  "http://78.31.235.12:3001",  // OTP Viewer
  "http://78.31.235.12:3005",  // admin Viewer
  "http://78.31.235.12:5000",
  "https://78.31.235.12",
  "http://10.10.10.144:3000",
  "http://10.10.10.144:3001",  // OTP Viewer
  "http://10.10.10.144:3005",  // admin Viewer
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

// ✅ UNCOMMENT THIS - Express CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if the origin is allowed
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`❌ Blocked CORS request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Length", "X-Kuma-Revision"]
  })
);

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/chat", chatRoutes);
// Admin Routes
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/listings", adminListingRoutes);
app.use("/api/admin/requests", adminRequestRoutes);
app.use("/api/admin/impersonation", adminImpersonationRoutes);
app.use("/api/admin/admins", adminManagementRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/audit-logs", adminAuditRoutes);

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