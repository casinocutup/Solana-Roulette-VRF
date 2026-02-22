/**
 * Tests for provably fair utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateServerSeed,
  hashServerSeed,
  deriveWinningPocket,
  verifySpin,
  verifyServerSeedHash,
} from './provablyFair';

describe('Provably Fair Utils', () => {
  it('should generate a server seed', () => {
    const seed = generateServerSeed();
    expect(seed).toBeDefined();
    expect(seed.length).toBeGreaterThan(0);
  });

  it('should hash a server seed', () => {
    const seed = 'test-seed-123';
    const hash = hashServerSeed(seed);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
  });

  it('should derive a winning pocket (0-36)', () => {
    const serverSeed = 'test-server-seed';
    const clientSeed = 'test-client-seed';
    const nonce = 12345;
    const round = 1;

    const pocket = deriveWinningPocket(serverSeed, clientSeed, nonce, round);
    expect(pocket).toBeGreaterThanOrEqual(0);
    expect(pocket).toBeLessThanOrEqual(36);
  });

  it('should produce deterministic results', () => {
    const serverSeed = 'test-server-seed';
    const clientSeed = 'test-client-seed';
    const nonce = 12345;
    const round = 1;

    const pocket1 = deriveWinningPocket(serverSeed, clientSeed, nonce, round);
    const pocket2 = deriveWinningPocket(serverSeed, clientSeed, nonce, round);

    expect(pocket1).toBe(pocket2);
  });

  it('should verify a spin correctly', () => {
    const serverSeed = 'test-server-seed';
    const clientSeed = 'test-client-seed';
    const nonce = 12345;
    const round = 1;

    const pocket = deriveWinningPocket(serverSeed, clientSeed, nonce, round);
    const isValid = verifySpin(serverSeed, clientSeed, nonce, round, pocket);

    expect(isValid).toBe(true);
  });

  it('should fail verification for wrong pocket', () => {
    const serverSeed = 'test-server-seed';
    const clientSeed = 'test-client-seed';
    const nonce = 12345;
    const round = 1;

    const wrongPocket = 99; // Invalid pocket
    const isValid = verifySpin(serverSeed, clientSeed, nonce, round, wrongPocket);

    expect(isValid).toBe(false);
  });

  it('should verify server seed hash', () => {
    const serverSeed = 'test-server-seed';
    const hash = hashServerSeed(serverSeed);
    const isValid = verifyServerSeedHash(serverSeed, hash);

    expect(isValid).toBe(true);
  });

  it('should fail hash verification for wrong seed', () => {
    const serverSeed = 'test-server-seed';
    const hash = hashServerSeed(serverSeed);
    const wrongSeed = 'wrong-seed';
    const isValid = verifyServerSeedHash(wrongSeed, hash);

    expect(isValid).toBe(false);
  });
});
