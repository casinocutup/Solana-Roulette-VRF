import { useState, useEffect } from 'react';
import { getSpins } from '../api/game';
import { Spin } from '../types';
import toast from 'react-hot-toast';

interface BetHistoryProps {
  onVerify: (spin: Spin) => void;
}

export default function BetHistory({ onVerify }: BetHistoryProps) {
  const [spins, setSpins] = useState<Spin[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getSpins(20);
      setSpins(data);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load bet history');
    } finally {
      setLoading(false);
    }
  };

  const getPocketColor = (num: number): string => {
    if (num === 0) return 'bg-casino-green';
    const red = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return red.includes(num) ? 'bg-casino-red' : 'bg-black';
  };

  return (
    <div className="bg-casino-black/50 rounded-lg p-6 border border-casino-gold/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-casino-gold">Bet History</h2>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="text-sm text-casino-gold hover:underline disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {spins.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No spins yet</p>
        ) : (
          spins.map((spin) => (
            <div
              key={spin.id}
              className="bg-casino-black/30 rounded p-3 border border-casino-gold/10 hover:border-casino-gold/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Round {spin.round}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      spin.status === 'resolved'
                        ? 'bg-casino-green/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {spin.status}
                  </span>
                </div>
                {spin.winningPocket !== null && (
                  <span
                    className={`px-2 py-1 rounded text-sm font-bold ${getPocketColor(spin.winningPocket)}`}
                  >
                    {spin.winningPocket}
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-400 space-y-1">
                <div>Bet: {(spin.totalBet / 1e9).toFixed(4)} SOL</div>
                {spin.status === 'resolved' && (
                  <div className="flex items-center justify-between">
                    <span>Payout: {(spin.totalPayout / 1e9).toFixed(4)} SOL</span>
                    {spin.totalPayout > 0 && (
                      <span className="text-casino-gold font-semibold">WIN!</span>
                    )}
                  </div>
                )}
              </div>

              {spin.status === 'resolved' && (
                <button
                  onClick={() => onVerify(spin)}
                  className="mt-2 text-xs text-casino-gold hover:underline"
                >
                  Verify Fairness →
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
