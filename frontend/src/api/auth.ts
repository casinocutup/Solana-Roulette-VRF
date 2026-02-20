/**
 * Authentication API
 */

import api from './client';
import { User } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface NonceResponse {
  nonce: string;
  message: string;
}

export async function getNonce(walletAddress: string): Promise<NonceResponse> {
  const response = await api.get<NonceResponse>('/api/auth/nonce', {
    params: { walletAddress },
  });
  return response.data;
}

export async function connectWallet(
  walletAddress: string,
  signature: string,
  message: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/connect-wallet', {
    walletAddress,
    signature,
    message,
  });
  
  // Store token
  localStorage.setItem('authToken', response.data.token);
  
  return response.data;
}
