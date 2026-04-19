import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.json({ data: { status: "ok", service: "auth" }, error: null, message: "Healthy" });
});

app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({ data: null, error: err.message || "Internal server error", message: "Request failed" });
});

async function start() {
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => {
    process.stdout.write(`Auth service running on ${port}\n`);
  });
}

start().catch((error) => {
  process.stderr.write(`Startup failed: ${error.message}\n`);
  process.exit(1);
});
