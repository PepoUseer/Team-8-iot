import express from "express";
import verifyAuth from "../middleware/userAuth.js";
const router = express.Router();

import SensorController from "../controllers/sensorController.js";
const sc = new SensorController();

router.post("/", verifyAuth, sc.create.bind(sc));
router.get("/:id", verifyAuth, sc.get.bind(sc));
router.get("/:id/readings");
router.patch("/:id", verifyAuth, sc.update.bind(sc));
router.delete("/:id", verifyAuth, sc.delete.bind(sc));

export default router;