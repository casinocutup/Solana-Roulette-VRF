/**
 * Roulette game logic and payout calculations
 * European wheel: 0-36 (37 pockets)
 */

import { BetType } from '../types';

// European roulette layout (0-36)
export const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Red numbers (European wheel)
export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Black numbers (European wheel)
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

/**
 * Check if a number is red
 */
export function isRed(number: number): boolean {
  return RED_NUMBERS.includes(number);
}

/**
 * Check if a number is black
 */
export function isBlack(number: number): boolean {
  return BLACK_NUMBERS.includes(number);
}

/**
 * Check if a number is even (excluding 0)
 */
export function isEven(number: number): boolean {
  return number !== 0 && number % 2 === 0;
}

/**
 * Check if a number is odd
 */
export function isOdd(number: number): boolean {
  return number !== 0 && number % 2 === 1;
}

/**
 * Check if a bet wins based on the winning pocket
 */
export function checkBetWin(
  betType: BetType,
  numbers: number[],
  winningPocket: number
): boolean {
  switch (betType) {
    case 'straight':
      return numbers.includes(winningPocket);
    
    case 'split':
      return numbers.includes(winningPocket);
    
    case 'street':
      return numbers.includes(winningPocket);
    
    case 'corner':
      return numbers.includes(winningPocket);
    
    case 'line':
      return numbers.includes(winningPocket);
    
    case 'red':
      return isRed(winningPocket);
    
    case 'black':
      return isBlack(winningPocket);
    
    case 'even':
      return isEven(winningPocket);
    
    case 'odd':
      return isOdd(winningPocket);
    
    case 'low':
      return winningPocket >= 1 && winningPocket <= 18;
    
    case 'high':
      return winningPocket >= 19 && winningPocket <= 36;
    
    case 'dozen1':
      return winningPocket >= 1 && winningPocket <= 12;
    
    case 'dozen2':
      return winningPocket >= 13 && winningPocket <= 24;
    
    case 'dozen3':
      return winningPocket >= 25 && winningPocket <= 36;
    
    case 'column1':
      return [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(winningPocket);
    
    case 'column2':
      return [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(winningPocket);
    
    case 'column3':
      return [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(winningPocket);
    
    default:
      return false;
  }
}

/**
 * Calculate payout multiplier for a bet type
 */
export function getPayoutMultiplier(betType: BetType): number {
  switch (betType) {
    case 'straight':
      return 35; // 35:1
    case 'split':
      return 17; // 17:1
    case 'street':
      return 11; // 11:1
    case 'corner':
      return 8; // 8:1
    case 'line':
      return 5; // 5:1
    case 'red':
    case 'black':
    case 'even':
    case 'odd':
    case 'low':
    case 'high':
      return 1; // 1:1
    case 'dozen1':
    case 'dozen2':
    case 'dozen3':
    case 'column1':
    case 'column2':
    case 'column3':
      return 2; // 2:1
    default:
      return 0;
  }
}

/**
 * Calculate payout for a bet
 */
export function calculatePayout(
  betType: BetType,
  amount: number,
  won: boolean
): number {
  if (!won) {
    return 0;
  }
  const multiplier = getPayoutMultiplier(betType);
  return amount * (multiplier + 1); // +1 to return stake + winnings
}

/**
 * Validate bet numbers based on bet type
 */
export function validateBetNumbers(betType: BetType, numbers: number[]): boolean {
  // All numbers must be 0-36
  if (numbers.some(n => n < 0 || n > 36)) {
    return false;
  }

  switch (betType) {
    case 'straight':
      return numbers.length === 1;
    
    case 'split':
      return numbers.length === 2;
    
    case 'street':
      return numbers.length === 3;
    
    case 'corner':
      return numbers.length === 4;
    
    case 'line':
      return numbers.length === 6;
    
    case 'red':
    case 'black':
    case 'even':
    case 'odd':
    case 'low':
    case 'high':
    case 'dozen1':
    case 'dozen2':
    case 'dozen3':
    case 'column1':
    case 'column2':
    case 'column3':
      return numbers.length === 0; // These bets don't require specific numbers
    
    default:
      return false;
  }
}

/**
 * Get all numbers covered by a bet type (for display purposes)
 */
export function getBetNumbers(betType: BetType, numbers: number[]): number[] {
  switch (betType) {
    case 'red':
      return RED_NUMBERS;
    case 'black':
      return BLACK_NUMBERS;
    case 'even':
      return Array.from({ length: 36 }, (_, i) => i + 1).filter(isEven);
    case 'odd':
      return Array.from({ length: 36 }, (_, i) => i + 1).filter(isOdd);
    case 'low':
      return Array.from({ length: 18 }, (_, i) => i + 1);
    case 'high':
      return Array.from({ length: 18 }, (_, i) => i + 19);
    case 'dozen1':
      return Array.from({ length: 12 }, (_, i) => i + 1);
    case 'dozen2':
      return Array.from({ length: 12 }, (_, i) => i + 13);
    case 'dozen3':
      return Array.from({ length: 12 }, (_, i) => i + 25);
    case 'column1':
      return [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
    case 'column2':
      return [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
    case 'column3':
      return [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
    default:
      return numbers;
  }
}
