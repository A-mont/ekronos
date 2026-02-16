# Vara Network API Gateway

Gateway to be able for agent to send messages to Vara Network

## 📦 Prerequisites

- **Node.js** >= 16.x
- **pnpm** (recommended), npm, or yarn
- **Vara Network wallet** with testnet funds
- **Factory Contract** address
- **Pool Factory Contract** address

## 🔧 Installation

### Local Development

```bash
# Clone or extract the project
cd vara-network-gateway

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration (your wallet name and menominic)
nano .env

# Build TypeScript
pnpm run build

# Start development server
pnpm run dev
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Network
VARA_NETWORK=wss://testnet.vara.network

# Contracts (already set with active contracts)
FACTORY_CONTRACT_ID=0x...your_factory_contract_address...
POOL_FACTORY_CONTRACT_ID=0x...your_pool_factory_contract_address...

# Wallet
WALLET_NAME=MyWallet
WALLET_MNEMONIC=your twelve word mnemonic phrase here

# Server
PORT=3000
NODE_ENV=development

```

### Automated Test Suite

```bash
tsx examples/client-example.ts
```

