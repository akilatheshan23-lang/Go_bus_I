import express from "express";
import Bus from "../models/Bus.js";
import Driver from "../models/Driver.js";
import Schedule from "../models/Schedule.js";

const router = express.Router();
router.get("/buses", async (_req, res) => res.json(await Bus.find({active:true}).populate('driver').sort({createdAt:-1}).lean()));
router.get("/drivers", async (_req, res) => res.json(await Driver.find({active:true}).select("name phone experienceYears licenseId").sort({name:1}).lean()));
router.get("/schedules", async (_req, res) => {
	const schedules = await Schedule.find({active:true})
		.populate({
			path: "bus",
			populate: { path: "driver" }
		})
		.populate("driver")
		.sort({date:1})
		.lean();


	res.json(schedules);
});
export default router;
