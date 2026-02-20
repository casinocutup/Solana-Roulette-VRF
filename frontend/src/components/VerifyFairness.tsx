import { useState } from 'react';
import { verifyFairness, verifySeedHash } from '../api/verify';
import { Spin } from '../types';
import toast from 'react-hot-toast';

interface VerifyFairnessProps {
  spin: Spin;
  onClose: () => void;
}

export default function VerifyFairness({ spin, onClose }: VerifyFairnessProps) {
  const [serverSeed, setServerSeed] = useState(spin.serverSeed || '');
  const [clientSeed, setClientSeed] = useState(spin.clientSeed);
  const [nonce, setNonce] = useState(spin.nonce.toString());
  const [round, setRound] = useState(spin.round.toString());
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    computedPocket: number;
    expectedPocket: number;
  } | null>(null);
  const [hashValid, setHashValid] = useState<boolean | null>(null);

  const handleVerify = async () => {
    if (!serverSeed || !clientSeed || !nonce || !round) {
      toast.error('All fields required');
      return;
    }

    if (spin.winningPocket === null) {
      toast.error('Spin not resolved yet');
      return;
    }

    try {
      setVerifying(true);

      // Verify seed hash first
      if (spin.serverSeedHash) {
        const hashResult = await verifySeedHash({
          serverSeed,
          serverSeedHash: spin.serverSeedHash,
        });
        setHashValid(hashResult.isValid);
      }

      // Verify fairness
      const fairnessResult = await verifyFairness({
        serverSeed,
        clientSeed,
        nonce: parseInt(nonce),
        round: parseInt(round),
        expectedPocket: spin.winningPocket,
      });

      setResult(fairnessResult);

      if (fairnessResult.isValid) {
        toast.success('Verification successful! The spin was fair.');
      } else {
        toast.error('Verification failed! The outcome does not match.');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.response?.data?.error || 'Failed to verify');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-casino-black/50 rounded-lg p-6 border border-casino-gold/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-casino-gold">Verify Fairness</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Server Seed Hash (pre-commit)
          </label>
          <input
            type="text"
            value={spin.serverSeedHash}
            disabled
            className="w-full px-3 py-2 bg-casino-black border border-casino-gold/30 rounded text-xs text-gray-400 font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Server Seed (revealed)
          </label>
          <input
            type="text"
            value={serverSeed}
            onChange={(e) => setServerSeed(e.target.value)}
            className="w-full px-3 py-2 bg-casino-black border border-casino-gold/30 rounded text-xs text-white font-mono focus:outline-none focus:border-casino-gold"
            placeholder="Enter server seed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Client Seed
          </label>
          <input
            type="text"
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
            className="w-full px-3 py-2 bg-casino-black border border-casino-gold/30 rounded text-xs text-white font-mono focus:outline-none focus:border-casino-gold"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nonce
            </label>
            <input
              type="number"
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              className="w-full px-3 py-2 bg-casino-black border border-casino-gold/30 rounded text-sm text-white focus:outline-none focus:border-casino-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Round
            </label>
            <input
              type="number"
              value={round}
              onChange={(e) => setRound(e.target.value)}
              className="w-full px-3 py-2 bg-casino-black border border-casino-gold/30 rounded text-sm text-white focus:outline-none focus:border-casino-gold"
            />
          </div>
        </div>

        {spin.winningPocket !== null && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Expected Winning Pocket
            </label>
            <div className="px-3 py-2 bg-casino-black border border-casino-gold/30 rounded text-lg font-bold text-center">
              {spin.winningPocket}
            </div>
          </div>
        )}

        {/* Verification Results */}
        {hashValid !== null && (
          <div
            className={`p-3 rounded ${
              hashValid
                ? 'bg-casino-green/20 border border-casino-green'
                : 'bg-casino-red/20 border border-casino-red'
            }`}
          >
            <p className={`text-sm ${hashValid ? 'text-green-400' : 'text-red-400'}`}>
              Server Seed Hash: {hashValid ? '✓ Valid' : '✗ Invalid'}
            </p>
          </div>
        )}

        {result && (
          <div
            className={`p-3 rounded ${
              result.isValid
                ? 'bg-casino-green/20 border border-casino-green'
                : 'bg-casino-red/20 border border-casino-red'
            }`}
          >
            <p className={`text-sm font-semibold ${result.isValid ? 'text-green-400' : 'text-red-400'}`}>
              {result.isValid ? '✓ Verification Successful' : '✗ Verification Failed'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Computed: {result.computedPocket} | Expected: {result.expectedPocket}
            </p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={verifying || !serverSeed || !clientSeed}
          className="w-full px-4 py-3 bg-casino-gold text-black font-semibold rounded-lg hover:bg-casino-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {verifying ? 'Verifying...' : 'Verify Fairness'}
        </button>

        <div className="text-xs text-gray-400 space-y-1">
          <p>
            <strong>How it works:</strong> The server seed hash is revealed before the spin.
            After the spin, the server seed is revealed. You can verify that:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>The server seed hash matches the revealed seed</li>
            <li>The winning pocket is derived from HMAC-SHA256(serverSeed, clientSeed:nonce:round)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
