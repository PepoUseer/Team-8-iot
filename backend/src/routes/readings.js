import express from "express";
const router = express.Router();

import ReadingsController from "../controllers/readingsController.js";
const rc = new ReadingsController();

router.post("/", rc.create.bind(rc));

export default router;