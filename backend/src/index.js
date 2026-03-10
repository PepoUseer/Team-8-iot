import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import { isSupabaseConfigured } from './supabaseClient.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: frontendUrl
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    supabaseConfigured: isSupabaseConfigured,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
