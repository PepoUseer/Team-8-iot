import express from "express";
const router = express.Router();

import AuthController from "../controllers/authController.js";
const ac = new AuthController();

router.post("/register", ac.register.bind(ac));
router.post("/login", ac.login.bind(ac));

export default router;