import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Bus from "./models/Bus.js";
import Driver from "./models/Driver.js";
import Schedule from "./models/Schedule.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gobus_auth_v2";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected");

  const adminUsername = "admin";
  const adminPass = "Admin@123"; // strong
  if (!await User.findOne({ username: adminUsername })) {
    const passwordHash = await bcrypt.hash(adminPass, 10);
    await User.create({ name: "Super Admin", username: adminUsername, passwordHash, role: "admin" });
    console.log(`Admin created: ${adminUsername} / ${adminPass}`);
  } else {
    console.log("Admin exists");
  }

  // Clear existing data
  await Bus.deleteMany({});
  await Driver.deleteMany({});
  await Schedule.deleteMany({});

  // Create 5 buses
  const buses = await Bus.create([
    { busNo: "NB-1234", model: "Ashok Leyland", type: "normal", capacity: 54, depot: "Colombo", active: true },
    { busNo: "NC-5678", model: "TATA", type: "luxury", capacity: 45, depot: "Kandy", active: true },
    { busNo: "NE-9012", model: "Yutong", type: "luxury", capacity: 38, depot: "Galle", active: true },
    { busNo: "ND-3456", model: "Coaster", type: "normal", capacity: 32, depot: "Jaffna", active: true },
    { busNo: "NF-7890", model: "Ashok Leyland", type: "normal", capacity: 56, depot: "Matara", active: true }
  ]);

  // Create 5 drivers
  const drivers = await Driver.create([
    { name: "Sunil Perera", phone: "0771234567", experienceYears: 8, licenseId: "SL-445566", active: true },
    { name: "Kamal Silva", phone: "0779876543", experienceYears: 5, licenseId: "SL-778899", active: true },
    { name: "Nimal Fernando", phone: "0761122334", experienceYears: 12, licenseId: "SL-112233", active: true },
    { name: "Saman Jayawardena", phone: "0754455667", experienceYears: 3, licenseId: "SL-998877", active: true },
    { name: "Chamara Wickramasinghe", phone: "0767788990", experienceYears: 15, licenseId: "SL-556644", active: true }
  ]);

  // Create 5 users (in addition to admin)
  const users = await User.create([
    { name: "John Doe", username: "johndoe", passwordHash: await bcrypt.hash("user123", 10), role: "user" },
    { name: "Jane Smith", username: "janesmith", passwordHash: await bcrypt.hash("user456", 10), role: "user" },
    { name: "Mike Johnson", username: "mikejohnson", passwordHash: await bcrypt.hash("user789", 10), role: "user" },
    { name: "Sarah Wilson", username: "sarahwilson", passwordHash: await bcrypt.hash("user012", 10), role: "user" },
    { name: "David Brown", username: "davidbrown", passwordHash: await bcrypt.hash("user345", 10), role: "user" }
  ]);

  // Create 5 schedules
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  await Schedule.create([
    { 
      from: "Colombo", 
      to: "Kandy", 
      date: today, 
      departureTime: "08:00", 
      arrivalTime: "11:00", 
      bookingCloseTime: "07:30", 
      price: 1200, 
      bus: buses[0]._id, 
      driver: drivers[0]._id, 
      active: true 
    },
    { 
      from: "Kandy", 
      to: "Colombo", 
      date: today, 
      departureTime: "15:00", 
      arrivalTime: "18:00", 
      bookingCloseTime: "14:30", 
      price: 1200, 
      bus: buses[1]._id, 
      driver: drivers[1]._id, 
      active: true 
    },
    { 
      from: "Colombo", 
      to: "Galle", 
      date: tomorrow, 
      departureTime: "09:30", 
      arrivalTime: "12:00", 
      bookingCloseTime: "09:00", 
      price: 800, 
      bus: buses[2]._id, 
      driver: drivers[2]._id, 
      active: true 
    },
    { 
      from: "Jaffna", 
      to: "Colombo", 
      date: tomorrow, 
      departureTime: "06:00", 
      arrivalTime: "12:30", 
      bookingCloseTime: "05:30", 
      price: 2500, 
      bus: buses[3]._id, 
      driver: drivers[3]._id, 
      active: true 
    },
    { 
      from: "Matara", 
      to: "Kandy", 
      date: dayAfter, 
      departureTime: "07:00", 
      arrivalTime: "11:30", 
      bookingCloseTime: "06:30", 
      price: 1800, 
      bus: buses[4]._id, 
      driver: drivers[4]._id, 
      active: true 
    }
  ]);
  console.log("Seed completed successfully!");
  console.log("Created:");
  console.log("- 1 Admin user");
  console.log("- 5 Regular users");
  console.log("- 5 Buses");
  console.log("- 5 Drivers");
  console.log("- 5 Schedules");
  await mongoose.disconnect();
}
run().catch(e=>{ console.error(e); process.exit(1); });
