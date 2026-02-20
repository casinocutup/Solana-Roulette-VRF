/**
 * Payments API
 */

import api from './client';
import { Deposit, Withdrawal } from '../types';

export interface DepositRequest {
  txSignature: string;
  amount: number;
}

export interface WithdrawRequest {
  amount: number;
  toAddress: string;
}

export interface DepositsResponse {
  deposits: Deposit[];
}

export interface WithdrawalsResponse {
  withdrawals: Withdrawal[];
}

export async function recordDeposit(data: DepositRequest): Promise<{ deposit: Deposit }> {
  const response = await api.post('/api/payments/deposit', data);
  return response.data;
}

export async function getDeposits(): Promise<Deposit[]> {
  const response = await api.get<DepositsResponse>('/api/payments/deposits');
  return response.data.deposits;
}

export async function requestWithdrawal(data: WithdrawRequest): Promise<{ withdrawal: Withdrawal; message: string }> {
  const response = await api.post('/api/payments/withdraw', data);
  return response.data;
}

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const response = await api.get<WithdrawalsResponse>('/api/payments/withdrawals');
  return response.data.withdrawals;
}
