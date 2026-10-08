// Realistic Pakistan gig worker dataset — 25 entries across 3 cities, 3 platforms
// Used by Demo Mode and as fallback when API is unavailable

export const DEMO_EARNINGS = [
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

export const DEMO_COMPLAINTS = [
  { id: "c1", workerId: "w1", workerName: "Ali Raza", platform: "Uber", type: "unfair_deduction", title: "Excessive commission on surge rides", description: "I completed 6 surge rides on April 5th but was charged 40% commission instead of the usual 25%. The app showed surge pricing but my earnings were deducted far beyond the standard rate.", status: "open", date: "2025-04-05", createdAt: "2025-04-05T18:00:00Z", keywords: ["Unfair Deduction", "Surge Pricing", "High Commission"], resolution: null },
  { id: "c2", workerId: "w2", workerName: "Sara Khan", platform: "Foodpanda", type: "account_blocked", title: "Account suspended without notice", description: "My Foodpanda rider account was suspended on April 4th with no warning or explanation. I had a 4.8 rating and 200+ completed deliveries. Support hasn't responded in 48 hours.", status: "under_review", date: "2025-04-04", createdAt: "2025-04-04T20:00:00Z", keywords: ["Account Blocked", "Access Denied"], resolution: null },
  { id: "c3", workerId: "w3", workerName: "Ahmad Bilal", platform: "Fiverr", type: "unfair_deduction", title: "Client chargeback after approval", description: "Delivered the complete source code for a web project. Client approved and left 5-star review. Two weeks later, Fiverr reversed the payment citing a chargeback. My appeal was rejected.", status: "resolved", date: "2025-03-25", createdAt: "2025-03-25T14:00:00Z", keywords: ["Chargeback", "Payment Issue", "Unfair Deduction"], resolution: "Fiverr partially refunded 40% after advocate review. Case closed with warning to client." },
  { id: "c4", workerId: "w4", workerName: "Fatima Noor", platform: "Uber", type: "unfair_deduction", title: "Wrongful cancellation penalty", description: "Customer cancelled after I waited 15 minutes. Uber still charged me a cancellation fee of PKR 1800. This is my third such penalty this month.", status: "open", date: "2025-04-04", createdAt: "2025-04-04T22:00:00Z", keywords: ["Unfair Penalty", "Cancellation", "Wrongful Charge"], resolution: null },
  { id: "c5", workerId: "w8", workerName: "Ayesha Tariq", platform: "Foodpanda", type: "payment_delayed", title: "Weekly payout delayed by 5 days", description: "My weekly payout for March 31 - April 4 was supposed to arrive on April 6. It's now April 11 and I still haven't received PKR 14,000. No response from support.", status: "open", date: "2025-04-11", createdAt: "2025-04-11T09:00:00Z", keywords: ["Payment Delayed", "Missing Payment"], resolution: null },
];

export const DEMO_VERIFICATION_LOG = [
  { id: "vl1", earningId: "e1", action: "approved", verifierId: "v1", verifierName: "Verifier Hassan", timestamp: "2025-04-02T10:00:00Z", confidence: 95, notes: "Matches typical Uber Karachi pattern" },
  { id: "vl2", earningId: "e2", action: "approved", verifierId: "v1", verifierName: "Verifier Hassan", timestamp: "2025-04-03T09:00:00Z", confidence: 92, notes: "Consistent with previous entries" },
  { id: "vl3", earningId: "e3", action: "approved", verifierId: "v1", verifierName: "Verifier Hassan", timestamp: "2025-04-04T11:00:00Z", confidence: 78, notes: "Deductions slightly high but within Foodpanda range" },
];

export const DEMO_WORKER = {
  id: "w1",
  name: "Ali Raza",
  email: "ali.raza@demo.pk",
  role: "worker",
  city: "Karachi",
  phone: "+92-300-1234567",
  joinedAt: "2025-01-01",
};

export const DEMO_VERIFIER = {
  id: "v1",
  name: "Verifier Hassan",
  email: "hassan@fairgig.pk",
  role: "verifier",
  city: "Karachi",
};

export const DEMO_ADVOCATE = {
  id: "a1",
  name: "Advocate Sana",
  email: "sana@fairgig.pk",
  role: "advocate",
  city: "Lahore",
};
