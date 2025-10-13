import mongoose from "mongoose";
const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  experienceYears: { type: Number, default: 0 },
  licenseId: { type: String, required: true },
  licenseType: { type: String, enum: ["Heavy Vehicle", "Light Vehicle", "Commercial"], default: "Heavy Vehicle" },
  licenseExpiryDate: { type: Date },
  address: { type: String },
  emergencyContact: {
    name: { type: String },
    phone: { type: String }
  },
  dateOfBirth: { type: Date },
  hireDate: { type: Date },
  active: { type: Boolean, default: true }
}, { timestamps: true });
export default mongoose.model("Driver", DriverSchema);
