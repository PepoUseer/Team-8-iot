import express from "express";
const router = express.Router();

router.get("/");
router.post("/");
router.patch("/:id");
router.get("/:id/sensors");
router.post("/add");
router.get("/:id/latest");

export default router;