/**
 * Database setup and operations using SQLite
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { User, Spin, Bet, Deposit, Withdrawal } from './types';

let db: Database.Database | null = null;

/**
 * Initialize the database
 */
export function initDatabase(dbPath: string): void {
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  createTables();
}

/**
 * Get database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Create all database tables
 */
function createTables(): void {
  if (!db) return;

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT UNIQUE NOT NULL,
      balance INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Spins table
  db.exec(`
    CREATE TABLE IF NOT EXISTS spins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      round INTEGER NOT NULL,
      server_seed_hash TEXT NOT NULL,
      server_seed TEXT,
      client_seed TEXT NOT NULL,
      nonce INTEGER NOT NULL,
      winning_pocket INTEGER,
      total_bet INTEGER NOT NULL,
      total_payout INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      deposit_tx_sig TEXT,
      payout_tx_sig TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Bets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spin_id INTEGER NOT NULL,
      bet_type TEXT NOT NULL,
      numbers TEXT NOT NULL,
      amount INTEGER NOT NULL,
      payout INTEGER NOT NULL DEFAULT 0,
      won INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (spin_id) REFERENCES spins(id)
    )
  `);

  // Deposits table
  db.exec(`
    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tx_signature TEXT UNIQUE NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      confirmed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Withdrawals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      to_address TEXT NOT NULL,
      tx_signature TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_spins_user_id ON spins(user_id);
    CREATE INDEX IF NOT EXISTS idx_spins_status ON spins(status);
    CREATE INDEX IF NOT EXISTS idx_bets_spin_id ON bets(spin_id);
    CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
    CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
    CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
    CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
  `);
}

/**
 * User operations
 */
export const userDb = {
  getByWalletAddress(walletAddress: string): User | null {
    const stmt = db!.prepare('SELECT * FROM users WHERE wallet_address = ?');
    const row = stmt.get(walletAddress) as any;
    if (!row) return null;
    return {
      id: row.id,
      walletAddress: row.wallet_address,
      balance: row.balance,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  create(walletAddress: string): User {
    const stmt = db!.prepare(
      'INSERT INTO users (wallet_address) VALUES (?) RETURNING *'
    );
    const row = stmt.get(walletAddress) as any;
    return {
      id: row.id,
      walletAddress: row.wallet_address,
      balance: row.balance,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  getOrCreate(walletAddress: string): User {
    let user = this.getByWalletAddress(walletAddress);
    if (!user) {
      user = this.create(walletAddress);
    }
    return user;
  },

  updateBalance(userId: number, newBalance: number): void {
    const stmt = db!.prepare(
      'UPDATE users SET balance = ?, updated_at = datetime("now") WHERE id = ?'
    );
    stmt.run(newBalance, userId);
  },

  addBalance(userId: number, amount: number): void {
    const user = db!.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as any;
    if (user) {
      this.updateBalance(userId, user.balance + amount);
    }
  },
};

/**
 * Spin operations
 */
export const spinDb = {
  create(spin: Omit<Spin, 'id' | 'createdAt' | 'resolvedAt'>): Spin {
    const stmt = db!.prepare(`
      INSERT INTO spins (
        user_id, round, server_seed_hash, server_seed, client_seed, nonce,
        winning_pocket, total_bet, total_payout, status, deposit_tx_sig, payout_tx_sig
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    const row = stmt.get(
      spin.userId,
      spin.round,
      spin.serverSeedHash,
      spin.serverSeed,
      spin.clientSeed,
      spin.nonce,
      spin.winningPocket,
      spin.totalBet,
      spin.totalPayout,
      spin.status,
      spin.depositTxSig,
      spin.payoutTxSig
    ) as any;
    return {
      id: row.id,
      userId: row.user_id,
      round: row.round,
      serverSeedHash: row.server_seed_hash,
      serverSeed: row.server_seed,
      clientSeed: row.client_seed,
      nonce: row.nonce,
      winningPocket: row.winning_pocket,
      totalBet: row.total_bet,
      totalPayout: row.total_payout,
      status: row.status,
      depositTxSig: row.deposit_tx_sig,
      payoutTxSig: row.payout_tx_sig,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    };
  },

  getById(id: number): Spin | null {
    const stmt = db!.prepare('SELECT * FROM spins WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      round: row.round,
      serverSeedHash: row.server_seed_hash,
      serverSeed: row.server_seed,
      clientSeed: row.client_seed,
      nonce: row.nonce,
      winningPocket: row.winning_pocket,
      totalBet: row.total_bet,
      totalPayout: row.total_payout,
      status: row.status,
      depositTxSig: row.deposit_tx_sig,
      payoutTxSig: row.payout_tx_sig,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    };
  },

  getByUserId(userId: number, limit: number = 50): Spin[] {
    const stmt = db!.prepare(
      'SELECT * FROM spins WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    );
    const rows = stmt.all(userId, limit) as any[];
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      round: row.round,
      serverSeedHash: row.server_seed_hash,
      serverSeed: row.server_seed,
      clientSeed: row.client_seed,
      nonce: row.nonce,
      winningPocket: row.winning_pocket,
      totalBet: row.total_bet,
      totalPayout: row.total_payout,
      status: row.status,
      depositTxSig: row.deposit_tx_sig,
      payoutTxSig: row.payout_tx_sig,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    }));
  },

  updateResolution(
    id: number,
    serverSeed: string,
    winningPocket: number,
    totalPayout: number,
    payoutTxSig: string | null
  ): void {
    const stmt = db!.prepare(`
      UPDATE spins
      SET server_seed = ?, winning_pocket = ?, total_payout = ?,
          payout_tx_sig = ?, status = 'resolved', resolved_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(serverSeed, winningPocket, totalPayout, payoutTxSig, id);
  },
};

/**
 * Bet operations
 */
export const betDb = {
  create(bet: Omit<Bet, 'id'>): Bet {
    const stmt = db!.prepare(`
      INSERT INTO bets (spin_id, bet_type, numbers, amount, payout, won)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    const row = stmt.get(
      bet.spinId,
      bet.betType,
      JSON.stringify(bet.numbers),
      bet.amount,
      bet.payout,
      bet.won ? 1 : 0
    ) as any;
    return {
      id: row.id,
      spinId: row.spin_id,
      betType: row.bet_type,
      numbers: JSON.parse(row.numbers),
      amount: row.amount,
      payout: row.payout,
      won: row.won === 1,
    };
  },

  getBySpinId(spinId: number): Bet[] {
    const stmt = db!.prepare('SELECT * FROM bets WHERE spin_id = ?');
    const rows = stmt.all(spinId) as any[];
    return rows.map(row => ({
      id: row.id,
      spinId: row.spin_id,
      betType: row.bet_type,
      numbers: JSON.parse(row.numbers),
      amount: row.amount,
      payout: row.payout,
      won: row.won === 1,
    }));
  },
};

/**
 * Deposit operations
 */
export const depositDb = {
  create(deposit: Omit<Deposit, 'id' | 'createdAt' | 'confirmedAt'>): Deposit {
    const stmt = db!.prepare(`
      INSERT INTO deposits (user_id, tx_signature, amount, status, confirmed_at)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `);
    const row = stmt.get(
      deposit.userId,
      deposit.txSignature,
      deposit.amount,
      deposit.status,
      deposit.confirmedAt
    ) as any;
    return {
      id: row.id,
      userId: row.user_id,
      txSignature: row.tx_signature,
      amount: row.amount,
      status: row.status,
      confirmedAt: row.confirmed_at,
      createdAt: row.created_at,
    };
  },

  getByTxSignature(txSignature: string): Deposit | null {
    const stmt = db!.prepare('SELECT * FROM deposits WHERE tx_signature = ?');
    const row = stmt.get(txSignature) as any;
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      txSignature: row.tx_signature,
      amount: row.amount,
      status: row.status,
      confirmedAt: row.confirmed_at,
      createdAt: row.created_at,
    };
  },

  updateStatus(id: number, status: string, confirmedAt: string | null = null): void {
    const stmt = db!.prepare(
      'UPDATE deposits SET status = ?, confirmed_at = ? WHERE id = ?'
    );
    stmt.run(status, confirmedAt, id);
  },

  getPending(): Deposit[] {
    const stmt = db!.prepare("SELECT * FROM deposits WHERE status = 'pending'");
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      txSignature: row.tx_signature,
      amount: row.amount,
      status: row.status,
      confirmedAt: row.confirmed_at,
      createdAt: row.created_at,
    }));
  },
};

/**
 * Withdrawal operations
 */
export const withdrawalDb = {
  create(withdrawal: Omit<Withdrawal, 'id' | 'createdAt' | 'completedAt'>): Withdrawal {
    const stmt = db!.prepare(`
      INSERT INTO withdrawals (user_id, amount, to_address, tx_signature, status, completed_at)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    const row = stmt.get(
      withdrawal.userId,
      withdrawal.amount,
      withdrawal.toAddress,
      withdrawal.txSignature,
      withdrawal.status,
      withdrawal.completedAt
    ) as any;
    return {
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      toAddress: row.to_address,
      txSignature: row.tx_signature,
      status: row.status,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  },

  getByUserId(userId: number): Withdrawal[] {
    const stmt = db!.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(userId) as any[];
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      toAddress: row.to_address,
      txSignature: row.tx_signature,
      status: row.status,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    }));
  },

  updateStatus(id: number, status: string, txSignature: string | null = null, completedAt: string | null = null): void {
    const stmt = db!.prepare(
      'UPDATE withdrawals SET status = ?, tx_signature = ?, completed_at = ? WHERE id = ?'
    );
    stmt.run(status, txSignature, completedAt, id);
  },
};
