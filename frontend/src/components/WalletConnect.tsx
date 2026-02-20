import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import toast from 'react-hot-toast';
import { getNonce, connectWallet } from '../api/auth';
import { recordDeposit } from '../api/payments';

const HOUSE_WALLET = import.meta.env.VITE_HOUSE_WALLET_ADDRESS || '';

export default function WalletConnect() {
  const { publicKey, signMessage, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [connecting, setConnecting] = useState(false);
  const [depositing, setDepositing] = useState(false);

  const handleConnect = async () => {
    if (!publicKey || !signMessage) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setConnecting(true);
      
      // Get nonce from backend
      const { nonce, message } = await getNonce(publicKey.toString());
      
      // Sign message
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      
      // Convert Uint8Array to base58 string
      const signatureBase58 = bs58.encode(signature);
      
      // Connect wallet on backend
      await connectWallet(publicKey.toString(), signatureBase58, message);
      
      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleDeposit = async () => {
    if (!publicKey || !sendTransaction || !HOUSE_WALLET) {
      toast.error('Wallet not connected or house wallet not configured');
      return;
    }

    try {
      setDepositing(true);
      
      const amount = 0.1; // 0.1 SOL default
      const lamports = amount * 1e9;
      
      const housePubkey = new PublicKey(HOUSE_WALLET);
      
      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: housePubkey,
          lamports,
        })
      );
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      toast.loading('Confirming deposit...', { id: 'deposit' });
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Record deposit
      await recordDeposit({
        txSignature: signature,
        amount: lamports,
      });
      
      toast.success(`Deposit of ${amount} SOL confirmed!`, { id: 'deposit' });
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || 'Failed to deposit');
    } finally {
      setDepositing(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-casino-black/50 rounded-lg p-8 border border-casino-gold/20">
          <h2 className="text-2xl font-bold text-casino-gold mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-300 mb-6">
            Connect your Solana wallet (Phantom, Backpack, etc.) to start playing.
          </p>
          <p className="text-sm text-gray-400">
            Use the wallet button in the header to connect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-casino-black/50 rounded-lg p-8 border border-casino-gold/20">
        <h2 className="text-2xl font-bold text-casino-gold mb-4">
          Authenticate Wallet
        </h2>
        <p className="text-gray-300 mb-6">
          Sign a message to authenticate your wallet and start playing.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="px-6 py-3 bg-casino-gold text-black font-semibold rounded-lg hover:bg-casino-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {connecting ? 'Connecting...' : 'Sign & Connect'}
          </button>
          
          {HOUSE_WALLET && (
            <>
              <div className="text-gray-400 text-sm my-4">or</div>
              <button
                onClick={handleDeposit}
                disabled={depositing}
                className="px-6 py-3 bg-casino-green text-white font-semibold rounded-lg hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {depositing ? 'Processing...' : 'Deposit 0.1 SOL'}
              </button>
            </>
          )}
        </div>
        
        <div className="mt-6 text-xs text-gray-500">
          <p>Wallet: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</p>
        </div>
      </div>
    </div>
  );
}
