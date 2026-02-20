/**
 * Game API
 */

import api from './client';
import { Spin, Bet } from '../types';

export interface BalanceResponse {
  balance: number;
}

export interface NewSpinRequest {
  clientSeed: string;
  bets: Bet[];
}

export interface NewSpinResponse {
  spin: Spin;
  bets: any[];
}

export interface ResolveSpinResponse {
  spin: Spin;
  bets: any[];
  newBalance: number;
}

export interface SpinsResponse {
  spins: Spin[];
}

export async function getBalance(): Promise<number> {
  const response = await api.get<BalanceResponse>('/api/game/balance');
  return response.data.balance;
}

export async function createSpin(data: NewSpinRequest): Promise<NewSpinResponse> {
  const response = await api.post<NewSpinResponse>('/api/game/new-spin', data);
  return response.data;
}

export async function resolveSpin(spinId: number): Promise<ResolveSpinResponse> {
  const response = await api.post<ResolveSpinResponse>(`/api/game/resolve-spin/${spinId}`);
  return response.data;
}

export async function getSpins(limit: number = 50): Promise<Spin[]> {
  const response = await api.get<SpinsResponse>('/api/game/spins', {
    params: { limit },
  });
  return response.data.spins;
}

export async function getSpin(spinId: number): Promise<{ spin: Spin; bets: any[] }> {
  const response = await api.get(`/api/game/spin/${spinId}`);
  return response.data;
}
