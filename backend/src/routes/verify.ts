/**
 * Verification routes for provably fair
 */

import { Router, Response } from 'express';
import { verifySpin, verifyServerSeedHash, deriveWinningPocket } from '../utils/provablyFair';
import { VerifyFairnessRequest } from '../types';

const router = Router();

/**
 * POST /api/verify/fairness
 * Verify a spin's fairness by recomputing the outcome
 */
router.post('/fairness', (req, res: Response) => {
  const { serverSeed, clientSeed, nonce, round, expectedPocket } = req.body as VerifyFairnessRequest & { expectedPocket: number };

  if (!serverSeed || !clientSeed || nonce === undefined || round === undefined || expectedPocket === undefined) {
    res.status(400).json({ error: 'All parameters required: serverSeed, clientSeed, nonce, round, expectedPocket' });
    return;
  }

  // Recompute winning pocket
  const computedPocket = deriveWinningPocket(serverSeed, clientSeed, nonce, round);

  // Verify match
  const isValid = computedPocket === expectedPocket;

  res.json({
    isValid,
    computedPocket,
    expectedPocket,
    match: isValid,
  });
});

/**
 * POST /api/verify/seed-hash
 * Verify that a server seed hash matches a revealed server seed
 */
router.post('/seed-hash', (req, res: Response) => {
  const { serverSeed, serverSeedHash } = req.body;

  if (!serverSeed || !serverSeedHash) {
    res.status(400).json({ error: 'Server seed and hash required' });
    return;
  }

  const isValid = verifyServerSeedHash(serverSeed, serverSeedHash);

  res.json({
    isValid,
    message: isValid ? 'Server seed hash matches' : 'Server seed hash does not match',
  });
});

export default router;
