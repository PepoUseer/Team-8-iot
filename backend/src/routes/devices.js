import express from "express";
import validateApiKey from "../middleware/deviceAuth.js";
import verifyAuth from "../middleware/userAuth.js";
const router = express.Router();

import DeviceController from "../controllers/deviceController.js";
const dc = new DeviceController();

router.get("/");
router.get("/:id", verifyAuth, dc.get.bind(dc));
router.post("/", verifyAuth, dc.create.bind(dc));
router.post("/alias", validateApiKey, dc.createOrGet.bind(dc));
router.patch("/:id", verifyAuth, dc.update.bind(dc));
router.get("/:id/sensors", verifyAuth, dc.getSensors.bind(dc));
router.post("/add", verifyAuth, dc.userAdd.bind(dc));
router.get("/:id/latest", verifyAuth, dc.latestReadings.bind(dc));
router.delete("/:id", verifyAuth, dc.delete.bind(dc));

export default router;