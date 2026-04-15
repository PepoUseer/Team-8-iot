import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 4000;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
    cors({
        origin: frontendUrl
    })
);
app.use(express.json());

import devicesRouter from './routes/devices.js';

app.use("/devices", devicesRouter);

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString()
    });
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
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