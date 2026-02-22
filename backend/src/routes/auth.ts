/**
 * Authentication routes
 */

import { Router, Request, Response } from 'express';
import { verifyWalletSignature, generateAuthMessage, generateToken } from '../middleware/auth';
import { userDb } from '../db';
import { AuthRequest } from '../types';

const router = Router();

// Store nonces temporarily (in production, use Redis or similar)
const nonces = new Map<string, string>();

/**
 * GET /api/auth/nonce
 * Generate a nonce for wallet authentication
 */
router.get('/nonce', (req: Request, res: Response) => {
  const walletAddress = req.query.walletAddress as string;
  
  if (!walletAddress) {
    res.status(400).json({ error: 'Wallet address required' });
    return;
  }

  // Generate random nonce
  const nonce = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  
  nonces.set(walletAddress, nonce);
  
  // Clear nonce after 5 minutes
  setTimeout(() => nonces.delete(walletAddress), 5 * 60 * 1000);

  const message = generateAuthMessage(walletAddress, nonce);

  res.json({ nonce, message });
});

/**
 * POST /api/auth/connect-wallet
 * Verify wallet signature and return JWT token
 */
router.post('/connect-wallet', (req: Request, res: Response) => {
  const { walletAddress, signature, message } = req.body as AuthRequest;

  if (!walletAddress || !signature || !message) {
    res.status(400).json({ error: 'Wallet address, signature, and message required' });
    return;
  }

  // Verify signature
  const isValid = verifyWalletSignature(message, signature, walletAddress);
  
  if (!isValid) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  // Get or create user
  const user = userDb.getOrCreate(walletAddress);

  // Generate JWT token
  const token = generateToken(walletAddress);

  res.json({
    token,
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      balance: user.balance,
    },
  });
});

export default router;
