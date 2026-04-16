import "dotenv/config";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import env from "./config/env.js";
import router from "./routes/index.js";
import authRoutes from "./routes/authRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { connectDB } from "./config/db.js";
import { startScheduler } from "./utils/scheduler.js";
import { setIO } from "./utils/socket.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== "production") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use(router);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  startScheduler();

  const PORT = process.env.PORT || 5000;
  const NODE_ENV = process.env.NODE_ENV || "development";

  // Create HTTP server so Socket.IO can share the same port
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.corsOrigin || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Make io accessible to controllers
  setIO(io);

  io.on("connection", (socket) => {
    // Owner joins a room named after their restaurantId
    socket.on("joinRestaurant", (restaurantId) => {
      socket.join(`restaurant:${restaurantId}`);
    });

    // Customer joins their personal room to receive order-status updates
    socket.on("joinUserRoom", (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on("disconnect", () => {});
  });

  httpServer.listen(PORT, () => {
    console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

