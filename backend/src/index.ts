import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";
import profileRoutes from "./routes/profile";
import applicationRoutes from "./routes/applications";
import notificationRoutes from "./routes/notifications";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
