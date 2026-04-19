import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import complaintRoutes from "./routes/complaints.js";

dotenv.config();
const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use("/api/complaints", complaintRoutes);

app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({ data: null, error: err.message || "Internal server error", message: "Request failed" });
});

async function start() {
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(process.env.PORT || 3002, () => process.stdout.write("Grievance service running on 3002\n"));
}

start().catch((error) => {
  process.stderr.write(`Startup failed: ${error.message}\n`);
  process.exit(1);
});
