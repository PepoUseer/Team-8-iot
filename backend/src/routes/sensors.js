import express from "express";
const router = express.Router();

router.get("/:id/readings");
router.patch("/:id");

export default router;