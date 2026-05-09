# Snoop NFT Web3 App

A modern Web3 minting storefront built with Next.js, React, RainbowKit, wagmi, and viem. This project connects to a deployed `SnoopNFT` smart contract and enables wallet interaction, minting, contract reads, and admin actions.

## Key Features

- Wallet connect flow using RainbowKit
- Reads contract state from `SnoopNFT` on Sepolia
- Minting function with ETH payment (`0.01 ETH`)
- Displays live on-chain minted token count
- Reads token URI metadata for a selected token
- Admin functions for pausing the contract and withdrawing funds
- Stylized NFT showcase UI with responsive layout

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- RainbowKit
- wagmi
- viem
- Tailwind CSS
- React Query

## Project Structure

- `app/page.tsx` — main UI and minting logic
- `app/providers.tsx` — wallet, chain, and query provider setup
- `constants/index.ts` — contract address and ABI
- `app/layout.tsx` — global layout and metadata
- `public/` — static NFT preview images

## Important Links

- Contract source code for the NFT: https://github.com/shola-devv/SNOOPNFT-.git

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add your WalletConnect project ID in `.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

3. Run development server:

```bash
npm run dev
```

4. Open the app in your browser at `http://localhost:3000`

## Notes

- The app is configured to use the Sepolia testnet.
- The contract address is defined in `constants/index.ts`.
- Minting uses `parseEther("0.01")` to send the required ETH value.

## License

MIT
