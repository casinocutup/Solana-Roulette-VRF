/**
 * Game routes (betting, spinning, resolving)
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { userDb, spinDb, betDb } from '../db';
import { generateServerSeed, hashServerSeed, deriveWinningPocket } from '../utils/provablyFair';
import { storeServerSeed, getServerSeed, removeServerSeed } from '../utils/seedStorage';
import {
  checkBetWin,
  calculatePayout,
  validateBetNumbers,
} from '../utils/roulette';
import { NewSpinRequest, PlaceBetRequest } from '../types';

const router = Router();

// Use authentication middleware for all routes
router.use(authenticate);

/**
 * GET /api/game/balance
 * Get user's current balance
 */
router.get('/balance', (req: AuthRequest, res: Response) => {
  const user = userDb.getByWalletAddress(req.walletAddress!);
  
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ balance: user.balance });
});

/**
 * POST /api/game/new-spin
 * Create a new spin with bets
 */
router.post('/new-spin', (req: AuthRequest, res: Response) => {
  const { clientSeed, bets } = req.body as NewSpinRequest;

  if (!clientSeed || !bets || !Array.isArray(bets) || bets.length === 0) {
    res.status(400).json({ error: 'Client seed and bets array required' });
    return;
  }

  const user = userDb.getByWalletAddress(req.walletAddress!);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Validate all bets
  for (const bet of bets) {
    if (!validateBetNumbers(bet.betType, bet.numbers)) {
      res.status(400).json({ error: `Invalid bet numbers for ${bet.betType}` });
      return;
    }
    if (bet.amount <= 0) {
      res.status(400).json({ error: 'Bet amount must be positive' });
      return;
    }
  }

  // Calculate total bet amount
  const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);

  // Check balance
  if (user.balance < totalBet) {
    res.status(400).json({ error: 'Insufficient balance' });
    return;
  }

  // Deduct bet amount from balance
  userDb.updateBalance(user.id, user.balance - totalBet);

  // Generate server seed and hash
  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);

  // Get next round number (increment from last spin)
  const lastSpins = spinDb.getByUserId(user.id, 1);
  const round = lastSpins.length > 0 ? lastSpins[0].round + 1 : 1;
  const nonce = Date.now(); // Use timestamp as nonce

  // Create spin
  const spin = spinDb.create({
    userId: user.id,
    round,
    serverSeedHash,
    serverSeed: null, // Will be revealed after resolution
    clientSeed,
    nonce,
    winningPocket: null,
    totalBet,
    totalPayout: 0,
    status: 'pending',
    depositTxSig: null,
    payoutTxSig: null,
  });

  // Store server seed securely (will be revealed on resolution)
  storeServerSeed(spin.id, serverSeed);

  // Create bets
  const createdBets = bets.map(bet => {
    return betDb.create({
      spinId: spin.id,
      betType: bet.betType,
      numbers: bet.numbers,
      amount: bet.amount,
      payout: 0,
      won: false,
    });
  });

  res.json({
    spin: {
      id: spin.id,
      round: spin.round,
      serverSeedHash: spin.serverSeedHash,
      clientSeed: spin.clientSeed,
      nonce: spin.nonce,
      totalBet: spin.totalBet,
      status: spin.status,
      createdAt: spin.createdAt,
    },
    bets: createdBets,
  });
});

/**
 * POST /api/game/resolve-spin
 * Resolve a spin: reveal server seed, compute outcome, calculate payouts
 */
router.post('/resolve-spin/:spinId', (req: AuthRequest, res: Response) => {
  const spinId = parseInt(req.params.spinId);
  const user = userDb.getByWalletAddress(req.walletAddress!);
  
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const spin = spinDb.getById(spinId);
  
  if (!spin) {
    res.status(404).json({ error: 'Spin not found' });
    return;
  }

  if (spin.userId !== user.id) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  if (spin.status !== 'pending') {
    res.status(400).json({ error: 'Spin already resolved' });
    return;
  }

  // Retrieve the stored server seed
  const serverSeed = getServerSeed(spinId);
  
  if (!serverSeed) {
    res.status(500).json({ error: 'Server seed not found' });
    return;
  }
  
  // Derive winning pocket
  const winningPocket = deriveWinningPocket(
    serverSeed,
    spin.clientSeed,
    spin.nonce,
    spin.round
  );

  // Get all bets for this spin
  const bets = betDb.getBySpinId(spinId);

  // Calculate payouts
  let totalPayout = 0;
  const updatedBets = bets.map(bet => {
    const won = checkBetWin(bet.betType, bet.numbers, winningPocket);
    const payout = calculatePayout(bet.betType, bet.amount, won);
    
    if (won) {
      totalPayout += payout;
    }

    // Update bet in database
    const stmt = require('../db').getDatabase().prepare(
      'UPDATE bets SET won = ?, payout = ? WHERE id = ?'
    );
    stmt.run(won ? 1 : 0, payout, bet.id);

    return {
      ...bet,
      won,
      payout,
    };
  });

  // Update spin with resolution
  spinDb.updateResolution(spinId, serverSeed, winningPocket, totalPayout, null);

  // Remove server seed from storage (now revealed)
  removeServerSeed(spinId);

  // Credit payout to user balance
  if (totalPayout > 0) {
    userDb.addBalance(user.id, totalPayout);
  }

  // Get updated user
  const updatedUser = userDb.getByWalletAddress(req.walletAddress!);

  res.json({
    spin: {
      ...spin,
      serverSeed,
      winningPocket,
      totalPayout,
      status: 'resolved',
    },
    bets: updatedBets,
    newBalance: updatedUser?.balance || 0,
  });
});

/**
 * GET /api/game/spins
 * Get user's spin history
 */
router.get('/spins', (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const user = userDb.getByWalletAddress(req.walletAddress!);
  
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const spins = spinDb.getByUserId(user.id, limit);
  
  // Get bets for each spin
  const spinsWithBets = spins.map(spin => {
    const bets = betDb.getBySpinId(spin.id);
    return {
      ...spin,
      bets,
    };
  });

  res.json({ spins: spinsWithBets });
});

/**
 * GET /api/game/spin/:spinId
 * Get a specific spin with verification data
 */
router.get('/spin/:spinId', (req: AuthRequest, res: Response) => {
  const spinId = parseInt(req.params.spinId);
  const user = userDb.getByWalletAddress(req.walletAddress!);
  
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const spin = spinDb.getById(spinId);
  
  if (!spin) {
    res.status(404).json({ error: 'Spin not found' });
    return;
  }

  if (spin.userId !== user.id) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const bets = betDb.getBySpinId(spinId);

  res.json({
    spin,
    bets,
  });
});

export default router;
