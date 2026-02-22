/**
 * Provably Fair Mechanism
 * Uses HMAC-SHA256 to deterministically derive roulette outcomes
 */

import * as crypto from 'crypto';

/**
 * Generate a random server seed (32-64 bytes)
 */
export function generateServerSeed(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Hash the server seed using SHA-256 (pre-commit)
 */
export function hashServerSeed(serverSeed: string): string {
  return crypto.createHash('sha256').update(serverSeed).digest('hex');
}

/**
 * Derive the winning pocket (0-36) using HMAC-SHA256
 * Formula: HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}:${round}`)
 * Take first 8 bytes, convert to number, mod 37
 */
export function deriveWinningPocket(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  round: number
): number {
  const message = `${clientSeed}:${nonce}:${round}`;
  const hmac = crypto.createHmac('sha256', serverSeed);
  hmac.update(message);
  const hash = hmac.digest('hex');
  
  // Take first 8 bytes (16 hex chars) and convert to number
  const first8Bytes = hash.substring(0, 16);
  const number = parseInt(first8Bytes, 16);
  
  // Mod 37 to get pocket (0-36)
  return number % 37;
}

/**
 * Verify a spin outcome by recomputing the winning pocket
 */
export function verifySpin(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  round: number,
  expectedPocket: number
): boolean {
  const computedPocket = deriveWinningPocket(serverSeed, clientSeed, nonce, round);
  return computedPocket === expectedPocket;
}

/**
 * Verify that a server seed hash matches the revealed seed
 */
export function verifyServerSeedHash(
  serverSeed: string,
  serverSeedHash: string
): boolean {
  const computedHash = hashServerSeed(serverSeed);
  return computedHash === serverSeedHash;
}
