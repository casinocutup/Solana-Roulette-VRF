import { useState, useEffect } from 'react';
import RouletteWheel from './RouletteWheel';
import BetBoard from './BetBoard';
import BetHistory from './BetHistory';
import VerifyFairness from './VerifyFairness';
import { Spin } from '../types';

interface GameBoardProps {
  balance: number;
  onBalanceUpdate: () => void;
}

export default function GameBoard({ balance, onBalanceUpdate }: GameBoardProps) {
  const [currentSpin, setCurrentSpin] = useState<Spin | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [selectedSpin, setSelectedSpin] = useState<Spin | null>(null);

  const handleSpinCreated = (spin: Spin) => {
    setCurrentSpin(spin);
  };

  const handleSpinResolved = (spin: Spin) => {
    setCurrentSpin(spin);
    setSpinning(false);
    onBalanceUpdate();
  };

  const handleVerify = (spin: Spin) => {
    setSelectedSpin(spin);
    setShowVerify(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Wheel and Controls */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-casino-black/50 rounded-lg p-6 border border-casino-gold/20">
          <RouletteWheel
            currentSpin={currentSpin}
            spinning={spinning}
            onSpinStart={() => setSpinning(true)}
            onSpinResolved={handleSpinResolved}
          />
        </div>

        <div className="bg-casino-black/50 rounded-lg p-6 border border-casino-gold/20">
          <BetBoard
            balance={balance}
            currentSpin={currentSpin}
            onSpinCreated={handleSpinCreated}
            onSpinStart={() => setSpinning(true)}
            disabled={spinning}
          />
        </div>
      </div>

      {/* Right Column - History and Verification */}
      <div className="space-y-6">
        <BetHistory onVerify={handleVerify} />
        
        {showVerify && selectedSpin && (
          <VerifyFairness
            spin={selectedSpin}
            onClose={() => {
              setShowVerify(false);
              setSelectedSpin(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
