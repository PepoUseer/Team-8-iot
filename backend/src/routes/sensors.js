import express from "express";
const router = express.Router();

import SensorController from "../controllers/sensorController.js";
const sc = new SensorController();

router.post("/", sc.create.bind(sc));
router.get("/:id", sc.get.bind(sc));
router.get("/:id/readings");
router.patch("/:id", sc.update.bind(sc));
router.delete("/:id", sc.delete.bind(sc));

export default router;