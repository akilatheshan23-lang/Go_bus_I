import mongoose from "mongoose";
const ScheduleSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  date: { type: Date, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  bookingCloseTime: { type: String, required: true },
  price: { type: Number, required: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  active: { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.model("Schedule", ScheduleSchema);
