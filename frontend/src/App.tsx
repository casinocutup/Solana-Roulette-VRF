import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getBalance } from './api/game';
import WalletConnect from './components/WalletConnect';
import GameBoard from './components/GameBoard';
import './App.css';

function App() {
  const { connected, publicKey } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      loadBalance();
    } else {
      setBalance(0);
    }
  }, [connected, publicKey]);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const bal = await getBalance();
      setBalance(bal);
    } catch (error) {
      console.error('Failed to load balance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-casino-dark">
      {/* Header */}
      <header className="bg-casino-darker border-b border-casino-gold/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-casino-gold text-shadow">
              🎰 Solana Roulette VRF
            </h1>
            <span className="text-sm text-gray-400">Provably Fair</span>
          </div>
          
          <div className="flex items-center gap-4">
            {connected && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">Balance:</span>
                <span className="text-lg font-bold text-casino-gold">
                  {loading ? '...' : `${(balance / 1e9).toFixed(4)} SOL`}
                </span>
              </div>
            )}
            <WalletMultiButton className="!bg-casino-gold !text-black hover:!bg-casino-gold-light" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!connected ? (
          <WalletConnect />
        ) : (
          <GameBoard balance={balance} onBalanceUpdate={loadBalance} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-casino-darker border-t border-casino-gold/20 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>Solana Roulette VRF - Provably Fair Casino Game</p>
          <p className="mt-2">
            All outcomes are cryptographically verifiable. Play responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
