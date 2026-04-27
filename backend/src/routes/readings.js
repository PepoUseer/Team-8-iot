import express from "express";
import validateApiKey from "../middleware/deviceAuth.js";
const router = express.Router();

import ReadingsController from "../controllers/readingsController.js";
const rc = new ReadingsController();

router.post("/", validateApiKey, rc.create.bind(rc));

export default router;