/**
 * Authentication middleware for wallet-based auth
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

export interface AuthRequest extends Request {
  userId?: number;
  walletAddress?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

/**
 * Verify a Solana wallet signature
 */
export function verifyWalletSignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);
    
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    return false;
  }
}

/**
 * Generate a nonce message for wallet authentication
 */
export function generateAuthMessage(walletAddress: string, nonce: string): string {
  return `Sign this message to authenticate with Solana Roulette VRF.\n\nWallet: ${walletAddress}\nNonce: ${nonce}`;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(walletAddress: string): string {
  return jwt.sign({ walletAddress }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { walletAddress: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { walletAddress: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Authentication middleware
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Get user from database
  const { userDb } = require('../db');
  const user = userDb.getByWalletAddress(decoded.walletAddress);

  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  req.userId = user.id;
  req.walletAddress = user.walletAddress;
  next();
}
