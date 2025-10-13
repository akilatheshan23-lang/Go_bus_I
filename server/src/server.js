import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import publicRouter from "./routes/public.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import bookingRouter from "./routes/booking.js";
import paymentRouter from "./routes/payment.js";
import promotionRouter from "./routes/promotion.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5001;
const ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gobus_auth_v2";

app.use(cors({ origin: [ORIGIN, "http://localhost:5174"], credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Configure mongoose connection with better options and retry logging
const mongooseOpts = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000, // keep trying to send operations for 10s
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  family: 4
};

const connectWithRetry = () => {
  mongoose.connect(MONGO_URI, mongooseOpts)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => {
      console.error("Mongo connection error:", err && err.message ? err.message : err);
      console.error("Retrying MongoDB connection in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
mongoose.connection.on('reconnectFailed', () => console.error('MongoDB reconnect failed'));
mongoose.connection.on('reconnect', () => console.log('MongoDB reconnected'));

app.get("/api/health", (_req, res)=> res.json({ ok: true }));
app.use("/api/public", publicRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/promotions", promotionRouter);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

app.listen(PORT, ()=> console.log(`🚍 GoBus API v2 on http://localhost:${PORT}`));
