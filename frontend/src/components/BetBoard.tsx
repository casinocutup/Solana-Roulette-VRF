import { useState, useEffect } from 'react';
import { createSpin } from '../api/game';
import { Bet, BetType, Spin } from '../types';
import toast from 'react-hot-toast';

interface BetBoardProps {
  balance: number;
  currentSpin: Spin | null;
  onSpinCreated: (spin: Spin) => void;
  onSpinStart: () => void;
  disabled: boolean;
}

const BET_AMOUNTS = [0.01, 0.05, 0.1, 0.5, 1.0];

export default function BetBoard({
  balance,
  currentSpin,
  onSpinCreated,
  onSpinStart,
  disabled,
}: BetBoardProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(0.1);
  const [clientSeed, setClientSeed] = useState<string>('');
  const [bets, setBets] = useState<Bet[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Generate random client seed on mount
    const randomSeed = Math.random().toString(36).substring(2, 15) +
                       Math.random().toString(36).substring(2, 15);
    setClientSeed(randomSeed);
  }, []);

  const handleAddBet = (betType: BetType, numbers: number[]) => {
    if (disabled || creating) return;

    const amount = selectedAmount * 1e9; // Convert to lamports
    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0) + amount;

    if (totalBet > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setBets([...bets, { betType, numbers, amount }]);
    toast.success(`Added ${betType} bet`);
  };

  const handleRemoveBet = (index: number) => {
    setBets(bets.filter((_, i) => i !== index));
  };

  const handleSpin = async () => {
    if (bets.length === 0) {
      toast.error('Please place at least one bet');
      return;
    }

    if (!clientSeed) {
      toast.error('Client seed required');
      return;
    }

    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    if (totalBet > balance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setCreating(true);
      const result = await createSpin({
        clientSeed,
        bets,
      });

      onSpinCreated(result.spin);
      onSpinStart();
      setBets([]);
      toast.success('Spin created!');
    } catch (error: any) {
      console.error('Create spin error:', error);
      toast.error(error.response?.data?.error || 'Failed to create spin');
    } finally {
      setCreating(false);
    }
  };

  const canSpin = !disabled && !creating && bets.length > 0 && currentSpin?.status !== 'pending';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-casino-gold">Place Your Bets</h2>

      {/* Client Seed */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Client Seed (editable)
        </label>
        <input
          type="text"
          value={clientSeed}
          onChange={(e) => setClientSeed(e.target.value)}
          disabled={disabled || creating}
          className="w-full px-4 py-2 bg-casino-black border border-casino-gold/30 rounded-lg text-white focus:outline-none focus:border-casino-gold disabled:opacity-50"
          placeholder="Enter client seed"
        />
        <button
          onClick={() => {
            const randomSeed = Math.random().toString(36).substring(2, 15) +
                             Math.random().toString(36).substring(2, 15);
            setClientSeed(randomSeed);
          }}
          disabled={disabled || creating}
          className="mt-2 text-xs text-casino-gold hover:underline disabled:opacity-50"
        >
          Generate Random
        </button>
      </div>

      {/* Bet Amount Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Bet Amount (SOL)
        </label>
        <div className="flex gap-2 flex-wrap">
          {BET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              disabled={disabled || creating}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedAmount === amount
                  ? 'bg-casino-gold text-black'
                  : 'bg-casino-black border border-casino-gold/30 text-casino-gold hover:border-casino-gold'
              } disabled:opacity-50`}
            >
              {amount} SOL
            </button>
          ))}
        </div>
      </div>

      {/* Quick Bet Buttons */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quick Bets
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAddBet('red', [])}
            disabled={disabled || creating}
            className="px-4 py-2 bg-casino-red text-white rounded-lg font-semibold hover:opacity-80 disabled:opacity-50"
          >
            Red (1:1)
          </button>
          <button
            onClick={() => handleAddBet('black', [])}
            disabled={disabled || creating}
            className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:opacity-80 disabled:opacity-50"
          >
            Black (1:1)
          </button>
          <button
            onClick={() => handleAddBet('even', [])}
            disabled={disabled || creating}
            className="px-4 py-2 bg-casino-black border border-casino-gold/30 text-casino-gold rounded-lg font-semibold hover:border-casino-gold disabled:opacity-50"
          >
            Even (1:1)
          </button>
          <button
            onClick={() => handleAddBet('odd', [])}
            disabled={disabled || creating}
            className="px-4 py-2 bg-casino-black border border-casino-gold/30 text-casino-gold rounded-lg font-semibold hover:border-casino-gold disabled:opacity-50"
          >
            Odd (1:1)
          </button>
          <button
            onClick={() => handleAddBet('low', [])}
            disabled={disabled || creating}
            className="px-4 py-2 bg-casino-black border border-casino-gold/30 text-casino-gold rounded-lg font-semibold hover:border-casino-gold disabled:opacity-50"
          >
            1-18 (1:1)
          </button>
          <button
            onClick={() => handleAddBet('high', [])}
            disabled={disabled || creating}
            className="px-4 py-2 bg-casino-black border border-casino-gold/30 text-casino-gold rounded-lg font-semibold hover:border-casino-gold disabled:opacity-50"
          >
            19-36 (1:1)
          </button>
        </div>
      </div>

      {/* Number Grid for Straight Bets */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Straight Bet (35:1) - Click a number
        </label>
        <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
          {Array.from({ length: 37 }, (_, i) => i).map((num) => {
            const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num);
            const isBlack = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35].includes(num);
            const bgColor = num === 0 ? 'bg-casino-green' : isRed ? 'bg-casino-red' : 'bg-black';

            return (
              <button
                key={num}
                onClick={() => handleAddBet('straight', [num])}
                disabled={disabled || creating}
                className={`px-3 py-2 ${bgColor} text-white rounded font-semibold hover:opacity-80 disabled:opacity-50 text-sm`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Bets */}
      {bets.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Bets ({bets.length})
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {bets.map((bet, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-casino-black/50 p-2 rounded"
              >
                <span className="text-sm text-gray-300">
                  {bet.betType} {bet.numbers.length > 0 && `(${bet.numbers.join(', ')})`} - {(bet.amount / 1e9).toFixed(4)} SOL
                </span>
                <button
                  onClick={() => handleRemoveBet(index)}
                  disabled={disabled || creating}
                  className="text-casino-red hover:text-red-400 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-casino-gold font-semibold">
            Total Bet: {(bets.reduce((sum, b) => sum + b.amount, 0) / 1e9).toFixed(4)} SOL
          </div>
        </div>
      )}

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={!canSpin}
        className="w-full px-6 py-4 bg-casino-gold text-black font-bold text-lg rounded-lg hover:bg-casino-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {creating ? 'Creating Spin...' : canSpin ? 'SPIN!' : 'Waiting for previous spin...'}
      </button>
    </div>
  );
}
