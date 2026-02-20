# Solana Roulette VRF – Provably Fair Roulette with Solana Wallet Payments

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Solana](https://img.shields.io/badge/Solana-Web3-purple.svg)](https://solana.com/)

A full-stack, production-ready web application for a **provably fair roulette casino game** called "Solana Roulette VRF". This centralized casino game features real Solana Web3 wallet payments via Phantom, Backpack, and other Solana wallets, with cryptographic provable fairness verification.

## 🎰 Features

- **🔐 Provably Fair Mechanism**: Cryptographic seed-based fairness with server seed hash pre-commit, client seed, and nonce → HMAC-SHA256 to derive roulette outcomes (0-36 for European wheel)
- **💳 Solana Wallet Integration**: Connect with Phantom, Backpack, and other Solana wallets for deposits, bets, and payouts
- **🎲 European Roulette**: Full support for 0-36 wheel with common bet types (straight, split, red/black, even/odd, dozens, columns, etc.)
- **✨ Animated Wheel**: Beautiful roulette wheel spin animation with Framer Motion
- **✅ Fairness Verification**: Built-in tool to verify any spin's fairness by recomputing the outcome
- **💰 Real-time Balance**: Off-chain balance tracking with on-chain SOL deposits
- **🎨 Modern UI**: Dark casino-themed interface with Tailwind CSS v4
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** + **TypeScript**
- **SQLite** database for user data, balances, and spin history
- **@solana/web3.js** for transaction verification
- **JWT** authentication with wallet signature verification
- **HMAC-SHA256** for provably fair outcome derivation

### Frontend
- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS v4** for styling
- **Framer Motion** for animations
- **@solana/wallet-adapter-react** for wallet integration
- **@solana/web3.js** for transaction creation
- **React Hot Toast** for notifications
- **React Confetti** for win celebrations

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Solana Wallet** (Phantom, Backpack, etc.)
- **Solana RPC endpoint** (public or Helius/Alchemy)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd Solana-Roulette-VRF
npm run install:all
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret for wallet authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# Alternative: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
SOLANA_NETWORK=mainnet-beta
HOUSE_WALLET_ADDRESS=YourHouseWalletPublicKeyHere

# Database
DB_PATH=./data/casino.db

# CORS
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3001
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_SOLANA_NETWORK=mainnet-beta
VITE_HOUSE_WALLET_ADDRESS=YourHouseWalletPublicKeyHere
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

### 4. Open in Browser

Navigate to `http://localhost:5173` and connect your Solana wallet!

## 🎮 How to Play

1. **Connect Wallet**: Click the wallet button in the header and connect your Phantom, Backpack, or other Solana wallet
2. **Authenticate**: Sign a message to authenticate your wallet
3. **Deposit SOL**: Send SOL to the house wallet address (shown in the deposit section)
4. **Place Bets**: 
   - Choose bet amount (0.01, 0.05, 0.1, 0.5, or 1.0 SOL)
   - Select bet type (red/black, even/odd, straight numbers, etc.)
   - Add multiple bets if desired
5. **Spin**: Click "SPIN!" to create a new spin
6. **Watch the Wheel**: The animated roulette wheel will spin and reveal the winning pocket
7. **Verify Fairness**: Click "Verify Fairness" on any resolved spin to cryptographically verify the outcome
8. **Withdraw**: Request a withdrawal to send your winnings to your wallet

## 🔐 Provably Fair Mechanism

### How It Works

1. **Pre-Commit**: Before each spin, the server generates a random server seed and sends its SHA-256 hash to the frontend
2. **Client Seed**: The player provides or auto-generates a client seed (editable in the UI)
3. **Nonce & Round**: Each spin has a unique nonce and round number
4. **Outcome Derivation**: The winning pocket is derived using:
   ```
   HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}:${round}`)
   → Take first 8 bytes → Convert to number → Mod 37 → Pocket (0-36)
   ```
5. **Reveal**: After the spin, the server seed is revealed
6. **Verification**: Players can verify fairness by:
   - Confirming the server seed hash matches the revealed seed
   - Recomputing the HMAC to derive the winning pocket
   - Comparing with the actual outcome

### Verification Tool

The built-in verification tool allows you to:
- Input server seed, client seed, nonce, and round
- Verify the server seed hash matches
- Recompute the winning pocket using the same HMAC algorithm
- Confirm the outcome matches the revealed result

## 🎲 Roulette Bet Types

| Bet Type | Payout | Description |
|----------|--------|-------------|
| Straight | 35:1 | Single number (0-36) |
| Split | 17:1 | Two adjacent numbers |
| Street | 11:1 | Three numbers in a row |
| Corner | 8:1 | Four numbers |
| Line | 5:1 | Six numbers |
| Red/Black | 1:1 | All red or all black numbers |
| Even/Odd | 1:1 | All even or all odd numbers |
| Low/High | 1:1 | 1-18 or 19-36 |
| Dozen | 2:1 | 1-12, 13-24, or 25-36 |
| Column | 2:1 | One of three columns |

## Contact

- Telegram: https://t.me/CasinoCutup
- Twitter: https://x.com/CasinoCutup
