/**
 * Verification API
 */

import api from './client';

export interface VerifyFairnessRequest {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  round: number;
  expectedPocket: number;
}

export interface VerifyFairnessResponse {
  isValid: boolean;
  computedPocket: number;
  expectedPocket: number;
  match: boolean;
}

export interface VerifySeedHashRequest {
  serverSeed: string;
  serverSeedHash: string;
}

export interface VerifySeedHashResponse {
  isValid: boolean;
  message: string;
}

export async function verifyFairness(data: VerifyFairnessRequest): Promise<VerifyFairnessResponse> {
  const response = await api.post<VerifyFairnessResponse>('/api/verify/fairness', data);
  return response.data;
}

export async function verifySeedHash(data: VerifySeedHashRequest): Promise<VerifySeedHashResponse> {
  const response = await api.post<VerifySeedHashResponse>('/api/verify/seed-hash', data);
  return response.data;
}
