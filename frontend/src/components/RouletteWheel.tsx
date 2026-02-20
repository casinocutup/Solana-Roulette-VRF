import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { resolveSpin } from '../api/game';
import { Spin } from '../types';
import toast from 'react-hot-toast';

// European roulette numbers (0-36)
const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

interface RouletteWheelProps {
  currentSpin: Spin | null;
  spinning: boolean;
  onSpinStart: () => void;
  onSpinResolved: (spin: Spin) => void;
}

export default function RouletteWheel({
  currentSpin,
  spinning,
  onSpinStart,
  onSpinResolved,
}: RouletteWheelProps) {
  const [winningPocket, setWinningPocket] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [resolving, setResolving] = useState(false);

  const handleResolve = useCallback(async () => {
    if (!currentSpin || resolving) return;

    try {
      setResolving(true);
      onSpinStart();

      // Wait a bit for dramatic effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Resolve spin
      const result = await resolveSpin(currentSpin.id);
      
      setWinningPocket(result.spin.winningPocket);
      setShowConfetti(result.spin.totalPayout > 0);
      
      // Hide confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);

      onSpinResolved(result.spin);

      if (result.spin.totalPayout > 0) {
        toast.success(`You won ${(result.spin.totalPayout / 1e9).toFixed(4)} SOL!`);
      } else {
        toast('Better luck next time!');
      }
    } catch (error: any) {
      console.error('Resolve error:', error);
      toast.error(error.message || 'Failed to resolve spin');
    } finally {
      setResolving(false);
    }
  }, [currentSpin, onSpinStart, onSpinResolved]);

  useEffect(() => {
    if (currentSpin && currentSpin.status === 'pending' && !spinning && !resolving) {
      handleResolve();
    }
  }, [currentSpin, spinning, resolving, handleResolve]);

  const getPocketColor = (num: number): string => {
    if (num === 0) return 'bg-casino-green';
    if (RED_NUMBERS.includes(num)) return 'bg-casino-red';
    return 'bg-black';
  };

  const getPocketPosition = (index: number): { angle: number; radius: number } => {
    const angle = (index / ROULETTE_NUMBERS.length) * 360;
    const radius = 150;
    return { angle, radius };
  };

  const getWinningPocketIndex = (): number => {
    if (winningPocket === null) return 0;
    return ROULETTE_NUMBERS.indexOf(winningPocket);
  };

  const spinAngle = spinning
    ? 360 * 5 + (getWinningPocketIndex() / ROULETTE_NUMBERS.length) * 360
    : 0;

  return (
    <div className="relative">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold text-casino-gold mb-6">Roulette Wheel</h2>

        {/* Wheel Container */}
        <div className="relative w-96 h-96 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-casino-gold bg-casino-black">
            {/* Wheel */}
            <motion.div
              className="absolute inset-2 rounded-full"
              animate={{
                rotate: spinAngle,
              }}
              transition={{
                duration: 3,
                ease: 'easeOut',
              }}
            >
              {ROULETTE_NUMBERS.map((num, index) => {
                const { angle, radius } = getPocketPosition(index);
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                  <div
                    key={num}
                    className={`absolute w-8 h-8 rounded-full ${getPocketColor(num)} border border-white/20 flex items-center justify-center text-white text-xs font-bold`}
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {num}
                  </div>
                );
              })}
            </motion.div>

            {/* Center indicator */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-casino-gold z-10" />
          </div>
        </div>

        {/* Current Spin Info */}
        {currentSpin && (
          <div className="bg-casino-black/70 rounded-lg p-4 w-full max-w-md">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Round:</span>
                <span className="text-casino-gold font-semibold">{currentSpin.round}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Server Seed Hash:</span>
                <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                  {currentSpin.serverSeedHash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Client Seed:</span>
                <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                  {currentSpin.clientSeed}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nonce:</span>
                <span className="text-casino-gold">{currentSpin.nonce}</span>
              </div>
              {currentSpin.status === 'resolved' && currentSpin.winningPocket !== null && (
                <div className="flex justify-between items-center pt-2 border-t border-casino-gold/20">
                  <span className="text-gray-400">Winning Pocket:</span>
                  <span
                    className={`text-2xl font-bold px-4 py-2 rounded ${getPocketColor(currentSpin.winningPocket)}`}
                  >
                    {currentSpin.winningPocket}
                  </span>
                </div>
              )}
              {currentSpin.status === 'resolved' && currentSpin.serverSeed && (
                <div className="flex justify-between pt-2">
                  <span className="text-gray-400">Server Seed:</span>
                  <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                    {currentSpin.serverSeed}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status */}
        {spinning && (
          <div className="mt-4 text-casino-gold text-lg font-semibold animate-pulse">
            Spinning...
          </div>
        )}
      </div>
    </div>
  );
}
