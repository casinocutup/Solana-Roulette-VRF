/**
 * Tests for roulette game logic
 */

import { describe, it, expect } from 'vitest';
import {
  isRed,
  isBlack,
  isEven,
  isOdd,
  checkBetWin,
  getPayoutMultiplier,
  calculatePayout,
  validateBetNumbers,
} from './roulette';

describe('Roulette Utils', () => {
  describe('Color checks', () => {
    it('should identify red numbers', () => {
      expect(isRed(1)).toBe(true);
      expect(isRed(3)).toBe(true);
      expect(isRed(36)).toBe(true);
      expect(isRed(2)).toBe(false);
      expect(isRed(0)).toBe(false);
    });

    it('should identify black numbers', () => {
      expect(isBlack(2)).toBe(true);
      expect(isBlack(4)).toBe(true);
      expect(isBlack(35)).toBe(true);
      expect(isBlack(1)).toBe(false);
      expect(isBlack(0)).toBe(false);
    });
  });

  describe('Parity checks', () => {
    it('should identify even numbers', () => {
      expect(isEven(2)).toBe(true);
      expect(isEven(4)).toBe(true);
      expect(isEven(36)).toBe(true);
      expect(isEven(1)).toBe(false);
      expect(isEven(0)).toBe(false);
    });

    it('should identify odd numbers', () => {
      expect(isOdd(1)).toBe(true);
      expect(isOdd(3)).toBe(true);
      expect(isOdd(35)).toBe(true);
      expect(isOdd(2)).toBe(false);
      expect(isOdd(0)).toBe(false);
    });
  });

  describe('Bet win checks', () => {
    it('should check straight bet win', () => {
      expect(checkBetWin('straight', [7], 7)).toBe(true);
      expect(checkBetWin('straight', [7], 8)).toBe(false);
    });

    it('should check red bet win', () => {
      expect(checkBetWin('red', [], 1)).toBe(true);
      expect(checkBetWin('red', [], 2)).toBe(false);
    });

    it('should check black bet win', () => {
      expect(checkBetWin('black', [], 2)).toBe(true);
      expect(checkBetWin('black', [], 1)).toBe(false);
    });

    it('should check even bet win', () => {
      expect(checkBetWin('even', [], 2)).toBe(true);
      expect(checkBetWin('even', [], 1)).toBe(false);
      expect(checkBetWin('even', [], 0)).toBe(false);
    });

    it('should check odd bet win', () => {
      expect(checkBetWin('odd', [], 1)).toBe(true);
      expect(checkBetWin('odd', [], 2)).toBe(false);
      expect(checkBetWin('odd', [], 0)).toBe(false);
    });

    it('should check low bet win', () => {
      expect(checkBetWin('low', [], 1)).toBe(true);
      expect(checkBetWin('low', [], 18)).toBe(true);
      expect(checkBetWin('low', [], 19)).toBe(false);
      expect(checkBetWin('low', [], 0)).toBe(false);
    });

    it('should check high bet win', () => {
      expect(checkBetWin('high', [], 19)).toBe(true);
      expect(checkBetWin('high', [], 36)).toBe(true);
      expect(checkBetWin('high', [], 18)).toBe(false);
      expect(checkBetWin('high', [], 0)).toBe(false);
    });
  });

  describe('Payout calculations', () => {
    it('should return correct payout multipliers', () => {
      expect(getPayoutMultiplier('straight')).toBe(35);
      expect(getPayoutMultiplier('split')).toBe(17);
      expect(getPayoutMultiplier('red')).toBe(1);
      expect(getPayoutMultiplier('dozen1')).toBe(2);
    });

    it('should calculate payout correctly', () => {
      const amount = 1000000000; // 1 SOL in lamports
      expect(calculatePayout('straight', amount, true)).toBe(36000000000); // 36 SOL
      expect(calculatePayout('red', amount, true)).toBe(2000000000); // 2 SOL (stake + winnings)
      expect(calculatePayout('straight', amount, false)).toBe(0);
    });
  });

  describe('Bet validation', () => {
    it('should validate straight bet', () => {
      expect(validateBetNumbers('straight', [7])).toBe(true);
      expect(validateBetNumbers('straight', [7, 8])).toBe(false);
      expect(validateBetNumbers('straight', [])).toBe(false);
    });

    it('should validate split bet', () => {
      expect(validateBetNumbers('split', [7, 8])).toBe(true);
      expect(validateBetNumbers('split', [7])).toBe(false);
    });

    it('should validate color bets', () => {
      expect(validateBetNumbers('red', [])).toBe(true);
      expect(validateBetNumbers('black', [])).toBe(true);
      expect(validateBetNumbers('red', [1])).toBe(false);
    });

    it('should reject invalid numbers', () => {
      expect(validateBetNumbers('straight', [37])).toBe(false);
      expect(validateBetNumbers('straight', [-1])).toBe(false);
    });
  });
});
