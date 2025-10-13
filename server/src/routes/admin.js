import express from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import Bus from "../models/Bus.js";
import Driver from "../models/Driver.js";
import Schedule from "../models/Schedule.js";
import { requireAuth, requireAdmin } from "./_authMiddleware.js";

const router = express.Router();

router.post("/create-admin",
  requireAuth, requireAdmin,
  body("username").isLength({ min: 3 }).trim(),
  body("password").isStrongPassword({ minLength: 8, minLowercase:1, minUppercase:1, minNumbers:1, minSymbols:1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, password, name } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: "Username already taken" });
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await User.create({ name, username, passwordHash, role: "admin" });
    res.json({ message: "Admin created", admin: { id: admin._id, username: admin.username, role: admin.role } });
  }
);

// CRUD
router.get("/buses", requireAuth, requireAdmin, async (_req, res) => {
  const buses = await Bus.find().populate('driver').sort({createdAt:-1}).lean();
  res.json(buses);
});
router.post("/buses", 
  requireAuth, requireAdmin,
  body("busNo").notEmpty().withMessage("Bus number is required"),
  body("model").isIn(["Ashok Leyland", "TATA", "Yutong", "Coaster"]).withMessage("Invalid bus model"),
  body("type").isIn(["normal", "luxury"]).withMessage("Invalid bus type"),
  body("capacity").isInt({ min: 1, max: 100 }).withMessage("Capacity must be between 1 and 100"),
  body("depot").notEmpty().withMessage("Depot is required"),
  body("driver").optional({ nullable: true }).isMongoId().withMessage("Driver must be a valid ID"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const existingBus = await Bus.findOne({ busNo: req.body.busNo });
      if (existingBus) {
        return res.status(400).json({ error: "Bus number already exists" });
      }
      const busData = { ...req.body };
      // Only set driver if provided and valid
      if (busData.driver === "" || !busData.driver) busData.driver = null;
      // Create bus with driver field
      const bus = await Bus.create(busData);
      res.json(bus);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);
router.put("/buses/:id", requireAuth, requireAdmin, async (req, res) => {
  const busData = { ...req.body };
  if (busData.driver === "" || !busData.driver) busData.driver = null;
  // Only set driver if provided and valid
  const updatedBus = await Bus.findByIdAndUpdate(req.params.id, busData, { new: true });
  res.json(updatedBus);
});
router.patch("/buses/:id/status", requireAuth, requireAdmin, async (req, res) => res.json(await Bus.findByIdAndUpdate(req.params.id, { active: req.body.active }, {new:true})));
router.delete("/buses/:id", requireAuth, requireAdmin, async (req, res) => { await Bus.findByIdAndDelete(req.params.id); res.json({ok:true}); });

router.get("/drivers", requireAuth, requireAdmin, async (_req, res) => res.json(await Driver.find().sort({name:1}).lean()));
router.post("/drivers", 
  requireAuth, requireAdmin,
  body("name").notEmpty().withMessage("Driver name is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("licenseId").notEmpty().withMessage("License ID is required"),
  body("licenseType").isIn(["Heavy Vehicle", "Light Vehicle", "Commercial"]).withMessage("Invalid license type"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      
      const existingDriver = await Driver.findOne({ licenseId: req.body.licenseId });
      if (existingDriver) {
        return res.status(400).json({ error: "License ID already exists" });
      }
      
      const driver = await Driver.create(req.body);
      res.json(driver);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);
router.put("/drivers/:id", requireAuth, requireAdmin, async (req, res) => res.json(await Driver.findByIdAndUpdate(req.params.id, req.body, {new:true})));
router.patch("/drivers/:id/status", requireAuth, requireAdmin, async (req, res) => res.json(await Driver.findByIdAndUpdate(req.params.id, { active: req.body.active }, {new:true})));
router.delete("/drivers/:id", requireAuth, requireAdmin, async (req, res) => { await Driver.findByIdAndDelete(req.params.id); res.json({ok:true}); });

router.get("/schedules", requireAuth, requireAdmin, async (_req, res) => res.json(await Schedule.find().populate("bus driver").sort({date:1}).lean()));
router.post("/schedules", 
  requireAuth, requireAdmin,
  body("from").notEmpty().withMessage("From location is required"),
  body("to").notEmpty().withMessage("To location is required"),
  body("date").isISO8601().withMessage("Valid date is required"),
  body("departureTime").notEmpty().withMessage("Departure time is required"),
  body("arrivalTime").notEmpty().withMessage("Arrival time is required"),
  body("bookingCloseTime").notEmpty().withMessage("Booking close time is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("bus").isMongoId().withMessage("Valid bus ID is required"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      
  const scheduleData = { ...req.body };
  delete scheduleData.driver;
  const schedule = await Schedule.create(scheduleData);
  res.json(schedule);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);
router.put("/schedules/:id", requireAuth, requireAdmin, async (req, res) => res.json(await Schedule.findByIdAndUpdate(req.params.id, req.body, {new:true})));
router.patch("/schedules/:id/status", requireAuth, requireAdmin, async (req, res) => res.json(await Schedule.findByIdAndUpdate(req.params.id, { active: req.body.active }, {new:true})));
router.delete("/schedules/:id", requireAuth, requireAdmin, async (req, res) => { await Schedule.findByIdAndDelete(req.params.id); res.json({ok:true}); });

export default router;
