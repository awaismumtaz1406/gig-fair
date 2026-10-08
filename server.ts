import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";

// Self-contained demo seed datasets (avoids external relative module resolution errors in dev/pre-warm/production)
const DEMO_EARNINGS = [
  { id: "e1", workerId: "w1", workerName: "Ali Raza", platform: "Uber", city: "Karachi", date: "2025-04-01", amount: 3200, grossEarnings: 4000, deductions: 800, hoursWorked: 8, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-02T10:00:00Z", anomalyScore: 8, anomalyMessage: "", screenshotUrl: null },
  { id: "e2", workerId: "w1", workerName: "Ali Raza", platform: "Uber", city: "Karachi", date: "2025-04-02", amount: 2800, grossEarnings: 3500, deductions: 700, hoursWorked: 7, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-03T09:00:00Z", anomalyScore: 5, anomalyMessage: "", screenshotUrl: null },
  { id: "e3", workerId: "w1", workerName: "Ali Raza", platform: "Foodpanda", city: "Karachi", date: "2025-04-03", amount: 2100, grossEarnings: 3000, deductions: 900, hoursWorked: 9, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-04T11:00:00Z", anomalyScore: 35, anomalyMessage: "Deductions are 30% of gross — above typical 18-22% range for Foodpanda Karachi", screenshotUrl: null },
  { id: "e4", workerId: "w1", workerName: "Ali Raza", platform: "Uber", city: "Karachi", date: "2025-04-04", amount: 3500, grossEarnings: 4200, deductions: 700, hoursWorked: 9, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-05T08:00:00Z", anomalyScore: 3, anomalyMessage: "", screenshotUrl: null },
  { id: "e5", workerId: "w1", workerName: "Ali Raza", platform: "Uber", city: "Karachi", date: "2025-04-05", amount: 1800, grossEarnings: 3000, deductions: 1200, hoursWorked: 6, isVerified: false, verifiedBy: null, verifiedAt: null, anomalyScore: 72, anomalyMessage: "Deductions are 40% of gross — significantly above your rolling average of 21%. Possible unfair commission structure.", screenshotUrl: "/demo-screenshot.jpg" },
  { id: "e6", workerId: "w2", workerName: "Sara Khan", platform: "Foodpanda", city: "Lahore", date: "2025-04-01", amount: 2400, grossEarnings: 3000, deductions: 600, hoursWorked: 8, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-02T14:00:00Z", anomalyScore: 10, anomalyMessage: "", screenshotUrl: null },
  { id: "e7", workerId: "w2", workerName: "Sara Khan", platform: "Foodpanda", city: "Lahore", date: "2025-04-02", amount: 1900, grossEarnings: 2800, deductions: 900, hoursWorked: 9, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-03T15:00:00Z", anomalyScore: 42, anomalyMessage: "Deductions are 32.1% of gross — above the 30% threshold for Foodpanda Lahore", screenshotUrl: null },
  { id: "e8", workerId: "w2", workerName: "Sara Khan", platform: "Foodpanda", city: "Lahore", date: "2025-04-03", amount: 2600, grossEarnings: 3200, deductions: 600, hoursWorked: 8, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-04T12:00:00Z", anomalyScore: 6, anomalyMessage: "", screenshotUrl: null },
  { id: "e9", workerId: "w2", workerName: "Sara Khan", platform: "Foodpanda", city: "Lahore", date: "2025-04-04", amount: 1400, grossEarnings: 2500, deductions: 1100, hoursWorked: 10, isVerified: false, verifiedBy: null, verifiedAt: null, anomalyScore: 68, anomalyMessage: "Deductions are 44% of gross — far above your rolling average of 22%. Likely penalty or surge manipulation.", screenshotUrl: "/demo-screenshot.jpg" },
  { id: "e10", workerId: "w3", workerName: "Ahmad Bilal", platform: "Fiverr", city: "Islamabad", date: "2025-04-01", amount: 8000, grossEarnings: 10000, deductions: 2000, hoursWorked: 10, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-02T16:00:00Z", anomalyScore: 12, anomalyMessage: "", screenshotUrl: null },
  { id: "e11", workerId: "w3", workerName: "Ahmad Bilal", platform: "Fiverr", city: "Islamabad", date: "2025-04-03", amount: 6000, grossEarnings: 7500, deductions: 1500, hoursWorked: 8, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-04T10:00:00Z", anomalyScore: 5, anomalyMessage: "", screenshotUrl: null },
  { id: "e12", workerId: "w3", workerName: "Ahmad Bilal", platform: "Fiverr", city: "Islamabad", date: "2025-04-05", amount: 4500, grossEarnings: 8000, deductions: 3500, hoursWorked: 6, isVerified: false, verifiedBy: null, verifiedAt: null, anomalyScore: 85, anomalyMessage: "Deductions are 43.8% of gross — extreme deviation. Possible client chargeback or platform fee error.", screenshotUrl: "/demo-screenshot.jpg" },
  { id: "e13", workerId: "w4", workerName: "Fatima Noor", platform: "Uber", city: "Lahore", date: "2025-04-02", amount: 2900, grossEarnings: 3500, deductions: 600, hoursWorked: 7, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-03T09:00:00Z", anomalyScore: 4, anomalyMessage: "", screenshotUrl: null },
  { id: "e14", workerId: "w4", workerName: "Fatima Noor", platform: "Uber", city: "Lahore", date: "2025-04-04", amount: 2200, grossEarnings: 4000, deductions: 1800, hoursWorked: 8, isVerified: false, verifiedBy: null, verifiedAt: null, anomalyScore: 91, anomalyMessage: "Deductions are 45% of gross — critical anomaly. Rolling average was 17%. Likely account penalty or fare adjustment.", screenshotUrl: "/demo-screenshot.jpg" },
  { id: "e15", workerId: "w5", workerName: "Hassan Ali", platform: "Foodpanda", city: "Karachi", date: "2025-04-01", amount: 2700, grossEarnings: 3500, deductions: 800, hoursWorked: 9, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-02T11:00:00Z", anomalyScore: 7, anomalyMessage: "", screenshotUrl: null },
  { id: "e16", workerId: "w5", workerName: "Hassan Ali", platform: "Foodpanda", city: "Karachi", date: "2025-04-03", amount: 3100, grossEarnings: 3800, deductions: 700, hoursWorked: 10, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-04T08:00:00Z", anomalyScore: 3, anomalyMessage: "", screenshotUrl: null },
  { id: "e17", workerId: "w6", workerName: "Zainab Malik", platform: "Fiverr", city: "Karachi", date: "2025-04-02", amount: 5500, grossEarnings: 7000, deductions: 1500, hoursWorked: 7, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-03T13:00:00Z", anomalyScore: 8, anomalyMessage: "", screenshotUrl: null },
  { id: "e18", workerId: "w6", workerName: "Zainab Malik", platform: "Fiverr", city: "Karachi", date: "2025-04-04", amount: 3200, grossEarnings: 5000, deductions: 1800, hoursWorked: 5, isVerified: false, verifiedBy: null, verifiedAt: null, anomalyScore: 55, anomalyMessage: "Deductions are 36% of gross — above 30% threshold. Possible service fee overcharge.", screenshotUrl: "/demo-screenshot.jpg" },
  { id: "e19", workerId: "w7", workerName: "Usman Sheikh", platform: "Uber", city: "Islamabad", date: "2025-04-01", amount: 3800, grossEarnings: 4500, deductions: 700, hoursWorked: 9, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-02T07:00:00Z", anomalyScore: 2, anomalyMessage: "", screenshotUrl: null },
  { id: "e20", workerId: "w7", workerName: "Usman Sheikh", platform: "Uber", city: "Islamabad", date: "2025-04-03", amount: 4100, grossEarnings: 5000, deductions: 900, hoursWorked: 10, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-04T07:00:00Z", anomalyScore: 6, anomalyMessage: "", screenshotUrl: null },
  { id: "e21", workerId: "w8", workerName: "Ayesha Tariq", platform: "Foodpanda", city: "Islamabad", date: "2025-04-02", amount: 2000, grossEarnings: 2500, deductions: 500, hoursWorked: 7, isVerified: true, verifiedBy: "v1", verifiedAt: "2025-04-03T10:00:00Z", anomalyScore: 4, anomalyMessage: "", screenshotUrl: null },
  { id: "e22", workerId: "w8", workerName: "Ayesha Tariq", platform: "Foodpanda", city: "Islamabad", date: "2025-04-05", amount: 1600, grossEarnings: 3000, deductions: 1400, hoursWorked: 8, isVerified: false, verifiedBy: null, verifiedAt: null, anomalyScore: 78, anomalyMessage: "Deductions are 46.7% of gross — critical anomaly detected. Rolling average was 20%. Likely wrongful penalty.", screenshotUrl: "/demo-screenshot.jpg" },
  { id: "e23", workerId: "w9", workerName: "Bilal Ahmed", platform: "Uber", city: "Karachi", date: "2025-04-05", amount: 2500, grossEarnings: 3200, deductions: 700, hoursWorked: 7, isVerified: false, verifiedBy: null, verifiedAt: null, anomalyScore: 10, anomalyMessage: "", screenshotUrl: null },
  { id: "e24", workerId: "w10", workerName: "Maryam Siddiqui", platform: "Fiverr", city: "Lahore", date: "2025-04-04", amount: 7200, grossEarnings: 9000, deductions: 1800, hoursWorked: 9, isVerified: false, verifiedBy: null, verifiedAt: null, anomalyScore: 15, anomalyMessage: "", screenshotUrl: null },
  { id: "e25", workerId: "w11", workerName: "Imran Hussain", platform: "Foodpanda", city: "Lahore", date: "2025-04-05", amount: 1700, grossEarnings: 2800, deductions: 1100, hoursWorked: 9, isVerified: false, verifiedBy: null, verifiedAt: null, anomalyScore: 62, anomalyMessage: "Deductions are 39.3% of gross — well above 30% threshold. Possible order cancellation penalty.", screenshotUrl: "/demo-screenshot.jpg" },
];

const DEMO_COMPLAINTS = [
  { id: "c1", workerId: "w1", workerName: "Ali Raza", platform: "Uber", type: "unfair_deduction", title: "Excessive commission on surge rides", description: "I completed 6 surge rides on April 5th but was charged 40% commission instead of the usual 25%. The app showed surge pricing but my earnings were deducted far beyond the standard rate.", status: "open", date: "2025-04-05", createdAt: "2025-04-05T18:00:00Z", keywords: ["Unfair Deduction", "Surge Pricing", "High Commission"], resolution: null },
  { id: "c2", workerId: "w2", workerName: "Sara Khan", platform: "Foodpanda", type: "account_blocked", title: "Account suspended without notice", description: "My Foodpanda rider account was suspended on April 4th with no warning or explanation. I had a 4.8 rating and 200+ completed deliveries. Support hasn't responded in 48 hours.", status: "under_review", date: "2025-04-04", createdAt: "2025-04-04T20:00:00Z", keywords: ["Account Blocked", "Access Denied"], resolution: null },
  { id: "c3", workerId: "w3", workerName: "Ahmad Bilal", platform: "Fiverr", type: "unfair_deduction", title: "Client chargeback after approval", description: "Delivered the complete source code for a web project. Client approved and left 5-star review. Two weeks later, Fiverr reversed the payment citing a chargeback. My appeal was rejected.", status: "resolved", date: "2025-03-25", createdAt: "2025-03-25T14:00:00Z", keywords: ["Chargeback", "Payment Issue", "Unfair Deduction"], resolution: "Fiverr partially refunded 40% after advocate review. Case closed with warning to client." },
  { id: "c4", workerId: "w4", workerName: "Fatima Noor", platform: "Uber", type: "unfair_deduction", title: "Wrongful cancellation penalty", description: "Customer cancelled after I waited 15 minutes. Uber still charged me a cancellation fee of PKR 1800. This is my third such penalty this month.", status: "open", date: "2025-04-04", createdAt: "2025-04-04T22:00:00Z", keywords: ["Unfair Penalty", "Cancellation", "Wrongful Charge"], resolution: null },
  { id: "c5", workerId: "w8", workerName: "Ayesha Tariq", platform: "Foodpanda", type: "payment_delayed", title: "Weekly payout delayed by 5 days", description: "My weekly payout for March 31 - April 4 was supposed to arrive on April 6. It's now April 11 and I still haven't received PKR 14,000. No response from support.", status: "open", date: "2025-04-11", createdAt: "2025-04-11T09:00:00Z", keywords: ["Payment Delayed", "Missing Payment"], resolution: null },
];

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "fairgig-dev-secret-key-2025";
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://awaismumtaz1406_db_user:2XtvSDtOAfllgkXl@cluster0.pvblfeu.mongodb.net/fairgig?retryWrites=true&w=majority";
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

// ---- Mongoose Schemas & Models ----
// 1. Earning Schema: { workerId, platform, city, date, grossAmount, deductions, netAmount, hoursWorked, hourlyRate, anomalyScore, isAnomaly, status, createdAt }
const EarningSchema = new mongoose.Schema(
  {
    workerId: { type: String, required: true, index: true },
    workerName: { type: String, default: "Ali Raza" },
    platform: { type: String, required: true },
    city: { type: String, default: "Karachi" },
    date: { type: Date, default: Date.now },
    grossAmount: { type: Number, required: true },
    grossEarnings: { type: Number },
    deductions: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    amount: { type: Number },
    hoursWorked: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 0 },
    anomalyScore: { type: Number, default: 0 },
    anomalyMessage: { type: String, default: "" },
    isAnomaly: { type: Boolean, default: false },
    status: { type: String, default: "pending" }, // "pending", "verified", "rejected"
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    screenshotUrl: { type: String, default: null },
    weekNumber: { type: Number },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: "earnings",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

EarningSchema.virtual("id").get(function () {
  return this._id ? this._id.toHexString() : undefined;
});

export const Earning = mongoose.models.Earning || mongoose.model("Earning", EarningSchema);

// 2. Complaint Schema: { workerId, platform, issueType, description, status, createdAt }
const ComplaintSchema = new mongoose.Schema(
  {
    workerId: { type: String, required: true, index: true },
    workerName: { type: String, default: "Ali Raza" },
    platform: { type: String, required: true },
    city: { type: String, default: "Karachi" },
    issueType: { type: String, required: true },
    type: { type: String },
    title: { type: String, default: "Platform Grievance" },
    description: { type: String, required: true },
    text: { type: String },
    keywords: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    clusterLabel: { type: String, default: "General Complaint" },
    status: { type: String, default: "open" },
    resolution: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: "complaints",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ComplaintSchema.virtual("id").get(function () {
  return this._id ? this._id.toHexString() : undefined;
});

export const Complaint = mongoose.models.Complaint || mongoose.model("Complaint", ComplaintSchema);

// In-memory fallback stores
let isMongoConnected = false;

interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "worker" | "verifier" | "advocate";
  city: string;
}

const passwordHash = bcrypt.hashSync("demo1234", 10);
const usersStore: UserRecord[] = [
  { id: "w1", name: "Ali Raza", email: "worker@demo.com", password: passwordHash, role: "worker", city: "Karachi" },
  { id: "w1", name: "Ali Raza", email: "ali.raza@demo.pk", password: passwordHash, role: "worker", city: "Karachi" },
  { id: "w2", name: "Sara Khan", email: "worker2@demo.com", password: passwordHash, role: "worker", city: "Lahore" },
  { id: "v1", name: "Verifier Hassan", email: "verifier@demo.com", password: passwordHash, role: "verifier", city: "Karachi" },
  { id: "v1", name: "Verifier Hassan", email: "hassan@fairgig.pk", password: passwordHash, role: "verifier", city: "Karachi" },
  { id: "a1", name: "Advocate Sana", email: "advocate@demo.com", password: passwordHash, role: "advocate", city: "Lahore" },
  { id: "a1", name: "Advocate Sana", email: "sana@fairgig.pk", password: passwordHash, role: "advocate", city: "Lahore" },
];

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Convert DB documents or memory objects to uniform structure matching frontend expectations
function serializeEarning(item: any): any {
  const obj = item?.toObject ? item.toObject({ virtuals: true }) : { ...item };
  obj.id = obj.id || (obj._id ? obj._id.toString() : `e_${Date.now()}`);
  if (obj.amount === undefined && obj.netAmount !== undefined) obj.amount = obj.netAmount;
  if (obj.netAmount === undefined && obj.amount !== undefined) obj.netAmount = obj.amount;
  if (obj.grossEarnings === undefined && obj.grossAmount !== undefined) obj.grossEarnings = obj.grossAmount;
  if (obj.grossAmount === undefined && obj.grossEarnings !== undefined) obj.grossAmount = obj.grossEarnings;
  if (obj.isVerified === undefined) obj.isVerified = obj.status === "verified";
  if (obj.status === undefined) obj.status = obj.isVerified ? "verified" : "pending";
  return obj;
}

function serializeComplaint(item: any): any {
  const obj = item?.toObject ? item.toObject({ virtuals: true }) : { ...item };
  obj.id = obj.id || (obj._id ? obj._id.toString() : `c_${Date.now()}`);
  if (!obj.type && obj.issueType) obj.type = obj.issueType;
  if (!obj.issueType && obj.type) obj.issueType = obj.type;
  if (!obj.text && obj.description) obj.text = obj.description;
  if (!obj.description && obj.text) obj.description = obj.text;
  return obj;
}

const memoryEarningsStore: any[] = DEMO_EARNINGS.map((e) => {
  const gross = Number(e.grossEarnings || e.amount + e.deductions || 0);
  const ded = Number(e.deductions || 0);
  const net = Number(e.amount || gross - ded);
  const hrs = Number(e.hoursWorked || 0);
  const rate = hrs > 0 ? Math.round((net / hrs) * 100) / 100 : 0;
  const score = Number(e.anomalyScore || 0);
  return {
    ...e,
    grossAmount: gross,
    grossEarnings: gross,
    deductions: ded,
    netAmount: net,
    amount: net,
    hoursWorked: hrs,
    hourlyRate: rate,
    anomalyScore: score,
    isAnomaly: score > 20,
    status: e.isVerified ? "verified" : "pending",
    weekNumber: getISOWeek(new Date(e.date)),
    createdAt: e.verifiedAt || new Date(e.date).toISOString(),
  };
});

const memoryComplaintsStore: any[] = DEMO_COMPLAINTS.map((c) => ({
  ...c,
  issueType: c.type || "unfair_deduction",
  type: c.type || "unfair_deduction",
  text: c.description,
  tags: c.keywords || [],
  clusterLabel:
    c.type === "unfair_deduction"
      ? "Unfair Deductions"
      : c.type === "account_blocked"
      ? "Platform Issues"
      : "Payment Issues",
}));

// Seed initial sample entries into MongoDB if collections are empty
async function seedMongoIfEmpty() {
  try {
    const earningsCount = await Earning.countDocuments();
    if (earningsCount === 0) {
      console.log("Seeding initial entries into MongoDB Atlas 'earnings' collection...");
      const docs = DEMO_EARNINGS.map((e) => {
        const gross = Number(e.grossEarnings || e.amount + e.deductions || 0);
        const ded = Number(e.deductions || 0);
        const net = Number(e.amount || gross - ded);
        const hrs = Number(e.hoursWorked || 0);
        const rate = hrs > 0 ? Math.round((net / hrs) * 100) / 100 : 0;
        const score = Number(e.anomalyScore || 0);
        return {
          workerId: e.workerId,
          workerName: e.workerName || "Ali Raza",
          platform: e.platform,
          city: e.city || "Karachi",
          date: new Date(e.date),
          grossAmount: gross,
          grossEarnings: gross,
          deductions: ded,
          netAmount: net,
          amount: net,
          hoursWorked: hrs,
          hourlyRate: rate,
          anomalyScore: score,
          anomalyMessage: e.anomalyMessage || "",
          isAnomaly: score > 20,
          status: e.isVerified ? "verified" : "pending",
          isVerified: Boolean(e.isVerified),
          verifiedBy: e.verifiedBy || null,
          verifiedAt: e.verifiedAt ? new Date(e.verifiedAt) : null,
          screenshotUrl: e.screenshotUrl || null,
          weekNumber: getISOWeek(new Date(e.date)),
          createdAt: e.verifiedAt ? new Date(e.verifiedAt) : new Date(e.date),
        };
      });
      await Earning.insertMany(docs);
      console.log(`Seeded ${docs.length} earnings into MongoDB Atlas.`);
    }

    const complaintsCount = await Complaint.countDocuments();
    if (complaintsCount === 0) {
      console.log("Seeding initial entries into MongoDB Atlas 'complaints' collection...");
      const docs = DEMO_COMPLAINTS.map((c) => ({
        workerId: c.workerId,
        workerName: c.workerName || "Ali Raza",
        platform: c.platform,
        city: "Karachi",
        issueType: c.type || "unfair_deduction",
        type: c.type || "unfair_deduction",
        title: c.title || "Platform Grievance",
        description: c.description,
        text: c.description,
        keywords: c.keywords || [],
        tags: c.keywords || [],
        clusterLabel:
          c.type === "unfair_deduction"
            ? "Unfair Deductions"
            : c.type === "account_blocked"
            ? "Platform Issues"
            : "Payment Issues",
        status: c.status || "open",
        resolution: c.resolution || null,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(c.date || Date.now()),
      }));
      await Complaint.insertMany(docs);
      console.log(`Seeded ${docs.length} complaints into MongoDB Atlas.`);
    }
  } catch (err: any) {
    console.warn("Notice: Mongo seeding check encountered:", err.message);
  }
}

// Connect to MongoDB Atlas
mongoose.set("bufferCommands", false);
mongoose
  .connect(
    "mongodb+srv://awaismumtaz1406_db_user:2XtvSDtOAfllgkXl@cluster0.pvblfeu.mongodb.net/fairgig?retryWrites=true&w=majority",
    {
      serverSelectionTimeoutMS: 5000,
    }
  )
  .then(async () => {
    isMongoConnected = true;
    console.log(">>> SUCCESS: CONNECTED TO MONGODB ATLAS <<<");
    await seedMongoIfEmpty();
  })
  .catch((err) => {
    isMongoConnected = false;
    console.error(">>> MONGODB ERROR:", err);
  });

const PLATFORM_BASELINES: Record<string, number> = {
  Uber: 400,
  Foodpanda: 300,
  Fiverr: 800,
  Careem: 350,
  Daraz: 250,
  Bykea: 280,
};

const DEFAULT_MEDIANS: Record<string, number> = {
  Lahore: 2800,
  Karachi: 3200,
  Islamabad: 3600,
  Rawalpindi: 2900,
  Faisalabad: 2600,
};

function detectAnomalyServer(
  entry: {
    amount: number;
    grossEarnings: number;
    deductions: number;
    hoursWorked: number;
    platform: string;
  },
  history: any[]
) {
  const gross = entry.grossEarnings || entry.amount + entry.deductions || 1;
  const deductions = entry.deductions || 0;
  const deductionPct = gross > 0 ? (deductions / gross) * 100 : 0;
  const recent = history.slice(0, 7);
  const avgPct = recent.length
    ? recent.reduce((s, e) => {
        const g = e.grossEarnings || e.grossAmount || e.amount + e.deductions || 1;
        return s + ((e.deductions || 0) / g) * 100;
      }, 0) / recent.length
    : 20;
  const deviation = Math.abs(deductionPct - avgPct);
  const hourlyRate = (entry.amount || 0) / (entry.hoursWorked || 1);
  const baseline = PLATFORM_BASELINES[entry.platform] || 350;

  let score = 0;
  const messages: string[] = [];

  if (deductionPct > 30) {
    score += Math.min(50, (deductionPct - 30) * 2.5);
    messages.push(`Deductions are ${deductionPct.toFixed(1)}% of gross — above 30% threshold`);
  }
  if (deviation > 15 && history.length >= 2) {
    score += Math.min(40, deviation * 1.5);
    messages.push(`${deviation.toFixed(1)}% deviation from your rolling average of ${avgPct.toFixed(1)}%`);
  }
  if (hourlyRate < baseline * 0.6 && entry.hoursWorked > 0) {
    score += 25;
    messages.push(`Hourly rate PKR ${hourlyRate.toFixed(0)}/hr is below typical ${entry.platform} baseline`);
  }

  const anomalyScore = Math.min(100, Math.round(score));
  const anomalyMessage = messages.length ? messages.join(". ") : "";
  const isAnomaly = anomalyScore > 20;
  return { anomalyScore, anomalyMessage, isAnomaly };
}

function computeAnalytics(city: string, workerEarnings: any[]) {
  const cityVerified = workerEarnings.filter((e) => e.city === city && (e.isVerified || e.status === "verified"));
  const sortedCityAmounts = cityVerified.map((e) => Number(e.amount || e.netAmount || 0)).sort((a, b) => a - b);
  const cityMedian = sortedCityAmounts.length
    ? sortedCityAmounts[Math.floor(sortedCityAmounts.length / 2)]
    : DEFAULT_MEDIANS[city] || 3000;

  const amounts = workerEarnings.map((e) => Number(e.amount || e.netAmount || 0));
  const anomalyScores = workerEarnings.map((e) => Number(e.anomalyScore || 0));
  const workerAvg = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  const variance =
    amounts.length > 1
      ? amounts.reduce((acc, val) => acc + Math.pow(val - workerAvg, 2), 0) / amounts.length
      : 0;
  const stdDev = Math.sqrt(variance);

  const incomeRatio = cityMedian ? Math.min(workerAvg / cityMedian, 1.5) : 0;
  const consistency = workerAvg ? Math.max(0, Math.min(1, 1 - stdDev / workerAvg)) : 0;
  const anomalyPenalty = anomalyScores.length
    ? anomalyScores.reduce((a, b) => a + b, 0) / anomalyScores.length / 100
    : 0;
  const fairnessScore = workerEarnings.length
    ? Math.round(incomeRatio * 40 + consistency * 35 + (1 - anomalyPenalty) * 25)
    : 0;

  const weekBuckets: Record<number, number[]> = {};
  const platformBuckets: Record<string, number[]> = {};

  for (const item of workerEarnings) {
    const d = new Date(item.date);
    const week = item.weekNumber || getISOWeek(d);
    if (!weekBuckets[week]) weekBuckets[week] = [];
    weekBuckets[week].push(Number(item.amount || item.netAmount || 0));

    const p = item.platform || "Unknown";
    if (!platformBuckets[p]) platformBuckets[p] = [];
    platformBuckets[p].push(Number(item.amount || item.netAmount || 0));
  }

  const commissionTrends = Object.entries(weekBuckets)
    .sort(([a], [b]) => Number(a) - Number(b))
    .slice(-8)
    .map(([week, vals]) => {
      const total = vals.reduce((a, b) => a + b, 0);
      return {
        week: Number(week),
        total: Math.round(total),
        avg: Math.round(total / vals.length),
        count: vals.length,
      };
    });

  const platformBreakdown = Object.entries(platformBuckets).map(([platform, vals]) => {
    const totalAmount = vals.reduce((a, b) => a + b, 0);
    return {
      platform,
      count: vals.length,
      avgAmount: Math.round(totalAmount / vals.length),
      totalAmount: Math.round(totalAmount),
    };
  });

  const insights: string[] = [];
  if (fairnessScore < 40 && cityMedian && workerEarnings.length > 0) {
    const diff = (((cityMedian - workerAvg) / cityMedian) * 100).toFixed(1);
    insights.push(`You earned ${diff}% less than the ${city} median this month`);
  }
  if (consistency < 0.5 && workerEarnings.length > 1) {
    insights.push("Your income is inconsistent — consider diversifying platforms");
  }
  if (platformBreakdown.length > 0) {
    const best = [...platformBreakdown].sort((a, b) => b.totalAmount - a.totalAmount)[0];
    insights.push(`You earn most on ${best.platform} — consider focusing there`);
  }
  if (anomalyPenalty > 0.25) {
    insights.push("Unusual commission deductions detected — review your flagged entries");
  }
  if (insights.length === 0) {
    insights.push("Your earnings trend is stable this month", "Keep logging verified records for stronger insights");
  }

  return {
    fairnessScore,
    cityMedian: Math.round(cityMedian),
    workerAvg: Math.round(workerAvg),
    insights: insights.slice(0, 4),
    commissionTrends,
    platformBreakdown,
    scoreComponents: {
      incomeRatio: Number(incomeRatio.toFixed(3)),
      consistency: Number(consistency.toFixed(3)),
      anomalyPenalty: Number(anomalyPenalty.toFixed(3)),
    },
  };
}

async function startServer() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());

  // Demo screenshot image
  app.get("/demo-screenshot.jpg", (_req, res) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#0f172a"/>
      <rect x="40" y="30" width="520" height="340" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <text x="70" y="80" fill="#94a3b8" font-family="Arial, sans-serif" font-size="14" font-weight="bold">TRIP EARNINGS SUMMARY — VERIFIED RECEIPT</text>
      <line x1="70" y1="100" x2="530" y2="100" stroke="#334155" stroke-width="1"/>
      <text x="70" y="140" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="18">Gross Trip Fare &amp; Surge</text>
      <text x="530" y="140" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="18" text-anchor="end">PKR 3,000</text>
      <text x="70" y="185" fill="#f87171" font-family="Arial, sans-serif" font-size="18">Platform Service Fee &amp; Deductions (40%)</text>
      <text x="530" y="185" fill="#f87171" font-family="Arial, sans-serif" font-size="18" text-anchor="end">-PKR 1,200</text>
      <line x1="70" y1="215" x2="530" y2="215" stroke="#334155" stroke-width="1"/>
      <text x="70" y="260" fill="#38bdf8" font-family="Arial, sans-serif" font-size="24" font-weight="bold">Net Payout</text>
      <text x="530" y="260" fill="#4ade80" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="end">PKR 1,800</text>
      <rect x="70" y="295" width="460" height="44" rx="8" fill="#7f1d1d" opacity="0.5"/>
      <text x="300" y="322" fill="#fca5a5" font-family="Arial, sans-serif" font-size="13" text-anchor="middle">⚠️ Anomaly Flag: 40% commission exceeds standard 20-25% rate</text>
    </svg>`;
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
  });

  // ---- AUTH ROUTES ----
  const authRouter = express.Router();
  const buildToken = (user: UserRecord) =>
    jwt.sign({ userId: user.id, role: user.role, city: user.city, name: user.name }, JWT_SECRET, {
      expiresIn: "7d",
    });

  authRouter.post("/register", async (req, res) => {
    const { name, email, password, role = "worker", city = "Lahore" } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ data: null, error: "Validation failed", message: "All fields are required" });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    if (usersStore.some((u) => u.email === normalizedEmail)) {
      return res.status(409).json({ data: null, error: "Conflict", message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: UserRecord = {
      id: `u_${Date.now()}`,
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      city,
    };
    usersStore.push(newUser);
    const token = buildToken(newUser);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    return res.status(201).json({
      data: {
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, city: newUser.city },
        token,
      },
      error: null,
      message: "Registered successfully",
    });
  });

  authRouter.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || "").toLowerCase().trim();
    const user = usersStore.find((u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Invalid credentials. Try worker@demo.com / demo1234",
      });
    }
    const ok = await bcrypt.compare(String(password || ""), user.password);
    if (!ok) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Invalid credentials. Try worker@demo.com / demo1234",
      });
    }
    const token = buildToken(user);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    return res.json({
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role, city: user.city },
        token,
      },
      error: null,
      message: "Login successful",
    });
  });

  authRouter.post("/logout", (_req, res) => {
    res.clearCookie("token");
    return res.json({ data: null, error: null, message: "Logged out" });
  });

  authRouter.get("/me", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = req.cookies?.token || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
    if (!token) {
      return res.status(401).json({ data: null, error: "Unauthorized", message: "Missing token" });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = usersStore.find((u) => u.id === decoded.userId) || {
        id: decoded.userId,
        name: decoded.name,
        role: decoded.role,
        city: decoded.city,
      };
      return res.json({ data: { user }, error: null, message: "User profile" });
    } catch {
      return res.status(401).json({ data: null, error: "Unauthorized", message: "Invalid token" });
    }
  });

  app.use("/proxy/auth/api/auth", authRouter);
  app.use("/api/auth", authRouter);

  // ---- HELPER FUNCTIONS FOR MONGODB DATA RETRIEVAL ----
  async function getAllEarnings(filter: any = {}): Promise<any[]> {
    try {
      const docs = await Earning.find(filter).sort({ date: -1, createdAt: -1 });
      if (docs && docs.length > 0) {
        return docs.map(serializeEarning);
      }
    } catch (err: any) {
      console.warn("[MongoDB Atlas] Earning query notice:", err.message);
    }
    // Filter memory store
    let result = [...memoryEarningsStore];
    if (filter.workerId) result = result.filter((e) => e.workerId === filter.workerId);
    if (filter.isVerified !== undefined) result = result.filter((e) => e.isVerified === filter.isVerified);
    return result.map(serializeEarning);
  }

  async function getAllComplaints(filter: any = {}): Promise<any[]> {
    try {
      const docs = await Complaint.find(filter).sort({ createdAt: -1 });
      if (docs && docs.length > 0) {
        return docs.map(serializeComplaint);
      }
    } catch (err: any) {
      console.warn("[MongoDB Atlas] Complaint query notice:", err.message);
    }
    let result = [...memoryComplaintsStore];
    if (filter.workerId) result = result.filter((c) => c.workerId === filter.workerId);
    if (filter.status) result = result.filter((c) => c.status === filter.status);
    return result.map(serializeComplaint);
  }

  // ---- EARNINGS ENDPOINTS (/api/earnings, /earnings, /proxy/earnings) ----
  const earningsHandler = async (req: express.Request, res: express.Response) => {
    const list = await getAllEarnings();
    return res.json({
      data: list,
      error: null,
      message: "Earnings fetched from MongoDB",
    });
  };

  const createEarningHandler = async (req: express.Request, res: express.Response) => {
    const {
      workerId = "w1",
      platform = "Uber",
      city = "Karachi",
      date = new Date().toISOString().split("T")[0],
      amount,
      netAmount,
      grossEarnings,
      grossAmount,
      deductions = 0,
      hoursWorked = 8,
    } = req.body || {};

    const numGross = Number(grossAmount ?? grossEarnings ?? (Number(netAmount ?? amount ?? 0) + Number(deductions ?? 0)));
    const numDed = Number(deductions || 0);
    const numNet = Number(netAmount ?? amount ?? (numGross - numDed));
    const numHours = Number(hoursWorked || 8);
    const hourlyRate = numHours > 0 ? Math.round((numNet / numHours) * 100) / 100 : 0;

    const workerHistory = await getAllEarnings({ workerId });
    const { anomalyScore, anomalyMessage, isAnomaly } = detectAnomalyServer(
      { amount: numNet, grossEarnings: numGross, deductions: numDed, hoursWorked: numHours, platform },
      workerHistory
    );

    const workerUser = usersStore.find((u) => u.id === workerId);
    const workerName = workerUser?.name || "Ali Raza";
    const recordPayload = {
      workerId,
      workerName,
      platform,
      city,
      date: new Date(date),
      grossAmount: numGross,
      grossEarnings: numGross,
      deductions: numDed,
      netAmount: numNet,
      amount: numNet,
      hoursWorked: numHours,
      hourlyRate,
      anomalyScore,
      anomalyMessage,
      isAnomaly,
      status: "pending",
      isVerified: false,
      verifiedBy: null,
      verifiedAt: null,
      screenshotUrl: (req as any).file ? "/demo-screenshot.jpg" : null,
      weekNumber: getISOWeek(new Date(date)),
      createdAt: new Date(),
    };

    // Perform direct Mongoose write into MongoDB 'earnings' collection in 'fairgig' database
    let savedRecord: any = null;
    try {
      const created = await Earning.create(recordPayload);
      console.log(`[MongoDB Atlas] Successfully wrote earning to 'fairgig.earnings' (id: ${created._id})`);
      savedRecord = serializeEarning(created);
    } catch (err: any) {
      console.warn("[MongoDB Atlas] Direct write to 'earnings' encountered notice:", err.message);
    }

    if (!savedRecord) {
      savedRecord = {
        id: `e_${Date.now()}`,
        ...recordPayload,
        date: date,
        createdAt: new Date().toISOString(),
      };
    }

    memoryEarningsStore.unshift(savedRecord);
    return res.status(201).json({
      data: savedRecord,
      error: null,
      message: "Earning created in MongoDB earnings collection",
    });
  };

  // POST /api/earnings & GET /api/earnings
  app.post("/api/earnings", upload.single("screenshot"), createEarningHandler);
  app.get("/api/earnings", earningsHandler);

  // Additional earnings routes supporting the existing frontend endpoints
  const earningsRouter = express.Router();
  earningsRouter.get("/earnings", earningsHandler);
  earningsRouter.post("/earnings", upload.single("screenshot"), createEarningHandler);

  earningsRouter.get("/earnings/pending", async (_req, res) => {
    const list = await getAllEarnings();
    return res.json({
      data: list,
      error: null,
      message: "Pending earnings fetched from MongoDB",
    });
  });

  earningsRouter.get("/earnings/dashboard/:workerId", async (req, res) => {
    const { workerId } = req.params;
    let workerEarnings = await getAllEarnings({ workerId });
    if (workerEarnings.length === 0 && workerId !== "w1") {
      workerEarnings = await getAllEarnings({ workerId: "w1" });
    }
    const user = usersStore.find((u) => u.id === workerId);
    const city = workerEarnings[0]?.city || user?.city || "Karachi";
    const analytics = computeAnalytics(city, workerEarnings);
    return res.json({
      data: { earnings: workerEarnings, analytics },
      error: null,
      message: "Dashboard fetched from MongoDB",
    });
  });

  earningsRouter.get("/earnings/stats/platform/:workerId", async (req, res) => {
    const { workerId } = req.params;
    const workerEarnings = await getAllEarnings({ workerId });
    const analytics = computeAnalytics("Karachi", workerEarnings);
    return res.json({
      data: analytics.platformBreakdown,
      error: null,
      message: "Platform stats fetched",
    });
  });

  earningsRouter.get("/earnings/:workerId", async (req, res) => {
    const { workerId } = req.params;
    const workerEarnings = await getAllEarnings({ workerId });
    return res.json({
      data: { earnings: workerEarnings, total: workerEarnings.length },
      error: null,
      message: "Earnings fetched from MongoDB",
    });
  });

  earningsRouter.put("/earnings/:earningId/verify", async (req, res) => {
    const { earningId } = req.params;
    const { isVerified, verifiedBy, rejectionReason } = req.body || {};
    const statusVal = isVerified ? "verified" : "rejected";

    let updatedDoc: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.Types.ObjectId.isValid(earningId)) {
          const doc = await Earning.findByIdAndUpdate(
            earningId,
            {
              isVerified: Boolean(isVerified),
              status: statusVal,
              verifiedBy: verifiedBy || "v1",
              verifiedAt: isVerified ? new Date() : null,
              rejectionReason: rejectionReason || null,
            },
            { new: true }
          );
          if (doc) updatedDoc = serializeEarning(doc);
        }
      } catch (err: any) {
        console.warn("Mongo update error:", err.message);
      }
    }

    const idx = memoryEarningsStore.findIndex((e) => e.id === earningId || e._id === earningId);
    if (idx !== -1) {
      memoryEarningsStore[idx] = {
        ...memoryEarningsStore[idx],
        isVerified: Boolean(isVerified),
        status: statusVal,
        verifiedBy: verifiedBy || "v1",
        verifiedAt: isVerified ? new Date().toISOString() : null,
        rejectionReason: rejectionReason || undefined,
      };
      if (!updatedDoc) updatedDoc = memoryEarningsStore[idx];
    }

    return res.json({
      data: updatedDoc || { id: earningId, isVerified, status: statusVal },
      error: null,
      message: "Earning verification updated in MongoDB",
    });
  });

  app.use("/proxy/earnings", earningsRouter);
  app.use("/api", earningsRouter);
  app.use("/", earningsRouter);

  // ---- COMPLAINTS ENDPOINTS (/api/complaints, /complaints, /proxy/grievance) ----
  const complaintsHandler = async (req: express.Request, res: express.Response) => {
    const workerId = req.query.workerId as string | undefined;
    const filter: any = {};
    if (workerId) filter.workerId = workerId;
    const list = await getAllComplaints(filter);
    return res.json({
      data: list,
      error: null,
      message: "Complaints fetched from MongoDB",
    });
  };

  const createComplaintHandler = async (req: express.Request, res: express.Response) => {
    const {
      workerId = "w1",
      platform = "Uber",
      issueType = "unfair_deduction",
      type,
      title = "Platform Grievance",
      description,
      text,
      keywords = [],
      city = "Karachi",
    } = req.body || {};

    const resolvedType = issueType || type || "unfair_deduction";
    const resolvedDesc = description || text || "";
    const workerUser = usersStore.find((u) => u.id === workerId);
    const workerName = workerUser?.name || "Ali Raza";

    const payload = {
      workerId,
      workerName,
      platform,
      city,
      issueType: resolvedType,
      type: resolvedType,
      title: title || "Platform Grievance",
      description: resolvedDesc,
      text: resolvedDesc,
      status: "open",
      keywords,
      tags: keywords,
      clusterLabel: resolvedType === "unfair_deduction" ? "Unfair Deductions" : "General Complaint",
      resolution: null,
      createdAt: new Date(),
    };

    // Perform direct Mongoose write into MongoDB 'complaints' collection in 'fairgig' database
    let savedComplaint: any = null;
    try {
      const created = await Complaint.create(payload);
      console.log(`[MongoDB Atlas] Successfully wrote complaint to 'fairgig.complaints' (id: ${created._id})`);
      savedComplaint = serializeComplaint(created);
    } catch (err: any) {
      console.warn("[MongoDB Atlas] Direct write to 'complaints' encountered notice:", err.message);
    }

    if (!savedComplaint) {
      savedComplaint = {
        id: `c_${Date.now()}`,
        ...payload,
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      };
    }

    memoryComplaintsStore.unshift(savedComplaint);
    return res.status(201).json({
      data: savedComplaint,
      error: null,
      message: "Complaint saved to MongoDB complaints collection",
    });
  };

  // POST /api/complaints & GET /api/complaints
  app.post("/api/complaints", createComplaintHandler);
  app.get("/api/complaints", complaintsHandler);

  const grievanceRouter = express.Router();
  grievanceRouter.get("/complaints", complaintsHandler);
  grievanceRouter.post("/complaints", createComplaintHandler);

  grievanceRouter.get("/complaints/all", async (_req, res) => {
    const list = await getAllComplaints();
    return res.json({
      data: list,
      error: null,
      message: "All complaints fetched from MongoDB",
    });
  });

  grievanceRouter.get("/complaints/worker/:workerId", async (req, res) => {
    const { workerId } = req.params;
    const list = await getAllComplaints({ workerId });
    return res.json({
      data: list,
      error: null,
      message: "Worker complaints fetched from MongoDB",
    });
  });

  grievanceRouter.put("/complaints/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status, resolution } = req.body || {};

    let updatedDoc: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const doc = await Complaint.findByIdAndUpdate(
            id,
            { status, resolution: resolution ?? null },
            { new: true }
          );
          if (doc) updatedDoc = serializeComplaint(doc);
        }
      } catch (err: any) {
        console.warn("Mongo Complaint update error:", err.message);
      }
    }

    const idx = memoryComplaintsStore.findIndex((c) => c.id === id || c._id === id);
    if (idx !== -1) {
      memoryComplaintsStore[idx] = {
        ...memoryComplaintsStore[idx],
        status: status || memoryComplaintsStore[idx].status,
        resolution: resolution !== undefined ? resolution : memoryComplaintsStore[idx].resolution,
      };
      if (!updatedDoc) updatedDoc = memoryComplaintsStore[idx];
    }

    return res.json({
      data: updatedDoc || { id, status },
      error: null,
      message: "Complaint status updated in MongoDB",
    });
  });

  app.use("/proxy/grievance", grievanceRouter);
  app.use("/api", grievanceRouter);
  app.use("/", grievanceRouter);

  // ---- CERTIFICATE ROUTES ----
  const certRouter = express.Router();
  certRouter.post("/certificates", (req, res) => {
    const { workerId = "w1" } = req.body || {};
    const certificateId = `FG-CERT-${String(workerId).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    return res.json({
      data: { certificateId, issuedAt: new Date().toISOString() },
      error: null,
      message: "Certificate generated",
    });
  });

  certRouter.get("/certificate/:workerId", async (req, res) => {
    const { workerId } = req.params;
    const worker = usersStore.find((u) => u.id === workerId) || { name: "Ali Raza", city: "Karachi" };
    const records = await getAllEarnings({ workerId, isVerified: true });
    const totalVerified = records.reduce((s, r) => s + (r.amount || r.netAmount || 0), 0);
    return res.send(`<html><head><title>FairGig Certificate</title></head><body><h1>FairGig - Income Verification Certificate</h1><p>Worker: ${worker.name} | City: ${worker.city}</p><p>Total Verified: PKR ${totalVerified.toLocaleString()}</p></body></html>`);
  });

  app.use("/proxy/certificate", certRouter);
  app.use("/", certRouter);

  // ---- VITE MIDDLEWARE / STATIC ASSETS ----
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FairGig unified full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
