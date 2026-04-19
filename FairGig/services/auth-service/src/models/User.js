import mongoose from "mongoose";

const validRoles = ["worker", "verifier", "advocate"];
const validCities = ["Lahore", "Karachi", "Islamabad"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: validRoles, required: true },
    city: { type: String, enum: validCities, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export default mongoose.model("User", userSchema);
