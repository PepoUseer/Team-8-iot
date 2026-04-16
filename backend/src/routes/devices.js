import express from "express";
const router = express.Router();

import DeviceController from "../controllers/deviceController.js";
const dc = new DeviceController();

router.get("/");
router.get("/:id", dc.get.bind(dc));
router.post("/", dc.create.bind(dc));
router.patch("/:id", dc.update.bind(dc));
router.get("/:id/sensors");
router.post("/add");
router.get("/:id/latest");
router.delete("/:id", dc.delete.bind(dc));

export default router;