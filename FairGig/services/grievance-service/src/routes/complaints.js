import express from "express";
import jwt from "jsonwebtoken";
import Complaint from "../models/Complaint.js";
import { clusterComplaint, extractTags } from "../utils/clustering.js";

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ data: null, error: "Unauthorized", message: "Missing token" });
    }
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (_error) {
    return res.status(401).json({ data: null, error: "Unauthorized", message: "Invalid token" });
  }
};

router.post(
  "/",
  verifyToken,
  asyncHandler(async (req, res) => {
    const { platform, text } = req.body;
    if (!text || text.length < 10) {
      return res.status(400).json({ data: null, error: "Validation failed", message: "Complaint text must be at least 10 characters" });
    }
    const complaint = await Complaint.create({
      workerId: req.user.userId,
      platform,
      text,
      tags: extractTags(text),
      clusterLabel: clusterComplaint(text)
    });
    return res.status(201).json({ data: complaint, error: null, message: "Complaint submitted" });
  })
);

router.get(
  "/",
  verifyToken,
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const query = {};
    if (req.user.role === "worker") {
      query.workerId = req.user.userId;
    } else if (req.query.workerId) {
      query.workerId = req.query.workerId;
    }
    if (req.query.clusterLabel) query.clusterLabel = req.query.clusterLabel;
    if (req.query.status) query.status = req.query.status;
    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.json({ data: { complaints, total, page, totalPages: Math.ceil(total / limit) }, error: null, message: "Complaints fetched" });
  })
);

router.get(
  "/clusters",
  verifyToken,
  asyncHandler(async (_req, res) => {
    const rows = await Complaint.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$clusterLabel",
          count: { $sum: 1 },
          platforms: { $addToSet: "$platform" },
          recentComplaint: { $first: "$text" }
        }
      },
      { $sort: { count: -1 } }
    ]);
    return res.json({
      data: { clusters: rows.map((row) => ({ label: row._id, count: row.count, platforms: row.platforms, recentComplaint: row.recentComplaint })) },
      error: null,
      message: "Cluster summary fetched"
    });
  })
);

router.put(
  "/:id/status",
  verifyToken,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "advocate") {
      return res.status(403).json({ data: null, error: "Forbidden", message: "Only advocates can update complaint status" });
    }
    const updated = await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    return res.json({ data: updated, error: null, message: "Complaint status updated" });
  })
);

export default router;
