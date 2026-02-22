/**
 * Payment routes (deposits, withdrawals)
 */

import { Router, Response } from 'express';
import { Connection, PublicKey } from '@solana/web3.js';
import { authenticate, AuthRequest } from '../middleware/auth';
import { userDb, depositDb, withdrawalDb } from '../db';

const router = Router();

// Use authentication middleware for all routes
router.use(authenticate);

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

/**
 * POST /api/payments/deposit
 * Record a deposit transaction signature
 */
router.post('/deposit', async (req: AuthRequest, res: Response) => {
  const { txSignature, amount } = req.body;

  if (!txSignature || !amount) {
    res.status(400).json({ error: 'Transaction signature and amount required' });
    return;
  }

  const user = userDb.getByWalletAddress(req.walletAddress!);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Check if deposit already exists
  const existing = depositDb.getByTxSignature(txSignature);
  if (existing) {
    res.status(400).json({ error: 'Deposit already recorded' });
    return;
  }

  // Create pending deposit
  const deposit = depositDb.create({
    userId: user.id,
    txSignature,
    amount: parseInt(amount),
    status: 'pending',
    confirmedAt: null,
  });

  // Verify transaction (async, will be polled)
  verifyDepositTransaction(txSignature, deposit.id).catch(console.error);

  res.json({ deposit });
});

/**
 * GET /api/payments/deposits
 * Get user's deposit history
 */
router.get('/deposits', (req: AuthRequest, res: Response) => {
  const user = userDb.getByWalletAddress(req.walletAddress!);
  
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Get all deposits for user (simplified - in production, add pagination)
  const db = require('../db').getDatabase();
  const stmt = db.prepare('SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(user.id) as any[];
  
  const deposits = rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    txSignature: row.tx_signature,
    amount: row.amount,
    status: row.status,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  }));

  res.json({ deposits });
});

/**
 * POST /api/payments/withdraw
 * Request a withdrawal
 */
router.post('/withdraw', (req: AuthRequest, res: Response) => {
  const { amount, toAddress } = req.body;

  if (!amount || !toAddress) {
    res.status(400).json({ error: 'Amount and destination address required' });
    return;
  }

  const user = userDb.getByWalletAddress(req.walletAddress!);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const withdrawAmount = parseInt(amount);

  if (withdrawAmount <= 0) {
    res.status(400).json({ error: 'Amount must be positive' });
    return;
  }

  if (user.balance < withdrawAmount) {
    res.status(400).json({ error: 'Insufficient balance' });
    return;
  }

  // Validate Solana address
  try {
    new PublicKey(toAddress);
  } catch (error) {
    res.status(400).json({ error: 'Invalid Solana address' });
    return;
  }

  // Deduct from balance
  userDb.updateBalance(user.id, user.balance - withdrawAmount);

  // Create withdrawal request
  const withdrawal = withdrawalDb.create({
    userId: user.id,
    amount: withdrawAmount,
    toAddress,
    txSignature: null,
    status: 'pending',
    completedAt: null,
  });

  res.json({
    withdrawal,
    message: 'Withdrawal request created. It will be processed by the house.',
  });
});

/**
 * GET /api/payments/withdrawals
 * Get user's withdrawal history
 */
router.get('/withdrawals', (req: AuthRequest, res: Response) => {
  const user = userDb.getByWalletAddress(req.walletAddress!);
  
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const withdrawals = withdrawalDb.getByUserId(user.id);

  res.json({ withdrawals });
});

/**
 * Verify a deposit transaction on Solana
 */
async function verifyDepositTransaction(txSignature: string, depositId: number): Promise<void> {
  try {
    const tx = await connection.getTransaction(txSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      // Transaction not found, might be pending
      setTimeout(() => verifyDepositTransaction(txSignature, depositId), 5000);
      return;
    }

    if (tx.meta?.err) {
      // Transaction failed
      depositDb.updateStatus(depositId, 'failed');
      return;
    }

    // Transaction confirmed
    const houseWallet = process.env.HOUSE_WALLET_ADDRESS;
    if (!houseWallet) {
      console.error('HOUSE_WALLET_ADDRESS not configured');
      return;
    }

    // Check if transaction sent SOL to house wallet
    const housePubkey = new PublicKey(houseWallet);
    let amount = 0;

    if (tx.transaction.message.accountKeys) {
      for (const account of tx.transaction.message.accountKeys) {
        if (account.pubkey.equals(housePubkey)) {
          // Find pre/post balances to calculate amount received
          const preBalance = tx.meta?.preBalances?.[tx.transaction.message.accountKeys.indexOf(account)] || 0;
          const postBalance = tx.meta?.postBalances?.[tx.transaction.message.accountKeys.indexOf(account)] || 0;
          amount = postBalance - preBalance;
          break;
        }
      }
    }

    if (amount > 0) {
      // Credit user balance
      const deposit = depositDb.getByTxSignature(txSignature);
      if (deposit && deposit.status === 'pending') {
        depositDb.updateStatus(depositId, 'confirmed', new Date().toISOString());
        userDb.addBalance(deposit.userId, amount);
      }
    }
  } catch (error) {
    console.error('Error verifying deposit transaction:', error);
    // Retry after delay
    setTimeout(() => verifyDepositTransaction(txSignature, depositId), 10000);
  }
}

export default router;
