import express from "express";
import validateApiKey from "../middleware/deviceAuth.js";
const router = express.Router();

import DeviceController from "../controllers/deviceController.js";
const dc = new DeviceController();

router.get("/");
router.get("/:id", dc.get.bind(dc));
router.post("/", dc.create.bind(dc));
router.post("/alias", validateApiKey, dc.createOrGet.bind(dc));
router.patch("/:id", dc.update.bind(dc));
router.get("/:id/sensors", dc.getSensors.bind(dc));
router.post("/add");
router.get("/:id/latest");
router.delete("/:id", dc.delete.bind(dc));

export default router;