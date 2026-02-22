/**
 * Main Express server for Solana Roulette VRF
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import paymentRoutes from './routes/payments';
import verifyRoutes from './routes/verify';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || './data/casino.db';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize database
initDatabase(DB_PATH);

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/verify', verifyRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Solana Roulette VRF backend running on port ${PORT}`);
  console.log(`📊 Database: ${DB_PATH}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
});
