/**
 * Shared types for the Solana Roulette backend
 */

export interface User {
  id: number;
  walletAddress: string;
  balance: number; // Off-chain balance in lamports
  createdAt: string;
  updatedAt: string;
}

export interface Spin {
  id: number;
  userId: number;
  round: number;
  serverSeedHash: string; // SHA-256 hash of server seed (pre-commit)
  serverSeed: string | null; // Revealed server seed (after spin)
  clientSeed: string;
  nonce: number;
  winningPocket: number | null; // 0-36
  totalBet: number; // Total bet amount in lamports
  totalPayout: number; // Total payout in lamports
  status: 'pending' | 'resolved' | 'cancelled';
  depositTxSig: string | null;
  payoutTxSig: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface Bet {
  id: number;
  spinId: number;
  betType: BetType;
  numbers: number[]; // Pocket numbers (0-36)
  amount: number; // Bet amount in lamports
  payout: number; // Calculated payout in lamports
  won: boolean;
}

export type BetType =
  | 'straight' // Single number (35:1)
  | 'split' // Two adjacent numbers (17:1)
  | 'street' // Three numbers in a row (11:1)
  | 'corner' // Four numbers (8:1)
  | 'line' // Six numbers (5:1)
  | 'red' // Red numbers (1:1)
  | 'black' // Black numbers (1:1)
  | 'even' // Even numbers (1:1)
  | 'odd' // Odd numbers (1:1)
  | 'low' // 1-18 (1:1)
  | 'high' // 19-36 (1:1)
  | 'dozen1' // 1-12 (2:1)
  | 'dozen2' // 13-24 (2:1)
  | 'dozen3' // 25-36 (2:1)
  | 'column1' // 1,4,7,10,13,16,19,22,25,28,31,34 (2:1)
  | 'column2' // 2,5,8,11,14,17,20,23,26,29,32,35 (2:1)
  | 'column3'; // 3,6,9,12,15,18,21,24,27,30,33,36 (2:1)

export interface Deposit {
  id: number;
  userId: number;
  txSignature: string;
  amount: number; // In lamports
  status: 'pending' | 'confirmed' | 'failed';
  confirmedAt: string | null;
  createdAt: string;
}

export interface Withdrawal {
  id: number;
  userId: number;
  amount: number; // In lamports
  toAddress: string;
  txSignature: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt: string | null;
}

export interface AuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface PlaceBetRequest {
  betType: BetType;
  numbers: number[];
  amount: number;
}

export interface NewSpinRequest {
  clientSeed: string;
  bets: PlaceBetRequest[];
}

export interface VerifyFairnessRequest {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  round: number;
}
