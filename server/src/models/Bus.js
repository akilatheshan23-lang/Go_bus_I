import mongoose from "mongoose";
const BusSchema = new mongoose.Schema({
  busNo: { type: String, required: true, unique: true },
  model: { type: String, enum: ["Ashok Leyland", "TATA", "Yutong", "Coaster"], required: true },
  type: { type: String, enum: ["normal", "luxury"], default: "normal" },
  capacity: { type: Number, required: true },
  depot: { type: String, required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  images: [{ type: String }],
  active: { type: Boolean, default: true },
  lastMaintenanceDate: { type: Date },
  insurance: {
    policyNumber: { type: String },
    provider: { type: String },
    expiryDate: { type: Date }
  }
}, { timestamps: true });
export default mongoose.model("Bus", BusSchema);
