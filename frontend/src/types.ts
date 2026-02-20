/**
 * Shared types for the frontend
 */

export type BetType =
  | 'straight'
  | 'split'
  | 'street'
  | 'corner'
  | 'line'
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low'
  | 'high'
  | 'dozen1'
  | 'dozen2'
  | 'dozen3'
  | 'column1'
  | 'column2'
  | 'column3';

export interface Bet {
  betType: BetType;
  numbers: number[];
  amount: number;
}

export interface Spin {
  id: number;
  round: number;
  serverSeedHash: string;
  serverSeed: string | null;
  clientSeed: string;
  nonce: number;
  winningPocket: number | null;
  totalBet: number;
  totalPayout: number;
  status: 'pending' | 'resolved' | 'cancelled';
  createdAt: string;
  resolvedAt: string | null;
  bets?: Bet[];
}

export interface User {
  id: number;
  walletAddress: string;
  balance: number;
}

export interface Deposit {
  id: number;
  txSignature: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
}

export interface Withdrawal {
  id: number;
  amount: number;
  toAddress: string;
  txSignature: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}
