import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    workerId: { type: String, required: true, index: true },
    platform: { type: String, required: true },
    text: { type: String, required: true, minlength: 10 },
    tags: { type: [String], default: [] },
    clusterLabel: { type: String, default: "General Complaint" },
    status: { type: String, enum: ["open", "under_review", "resolved"], default: "open" },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export default mongoose.model("Complaint", complaintSchema);
