import "dotenv/config";
import cors from "cors";
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import db from "./db.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
    cors({
        origin: frontendUrl
    })
);
app.use(express.json());

const pool = db.pool;
const SessionStore = pgSession(session);
const store = new SessionStore({
    pool,
    tableName: "session",
    createTableIfMissing: true,
});

app.use(
    session({
        store,
        secret: process.env.SESSION_SECRET || "iotteam8",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "lax",
        },
    })
);

import authRouter from "./routes/auth.js";
import devicesRouter from "./routes/devices.js";
import sensorRouter from "./routes/sensors.js";
import readingsRouter from "./routes/readings.js";

app.use("/auth", authRouter);
app.use("/devices", devicesRouter);
app.use("/sensors", sensorRouter);
app.use("/readings", readingsRouter);

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString()
    });
});

const server = app.listen(port, "0.0.0.0", () => {
    const addr = server.address();
    console.log(`Backend server running on ${addr.address}:${addr.port}`);
});

app.use(function (err, req, res, next) {
    console.error("Error:", {
        message: err.message,
        details: err.details,
        stack: err.stack,
        status: err.status || 500,
        url: req.originalUrl,
        method: req.method,
    });

    const errorResponse = {
        error: {
            message: err.message || "Internal Server Error",
            ...(err.status && { status: err.status }),
            ...(err.code && { code: err.code }),
            ...(err.details && { code: err.details }),
        },
    };

    res.status(err.status || 500).json(errorResponse);
});