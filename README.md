# karipto

**A custodial ETH & USDT wallet with per-user deposit addresses, automatic deposit detection, and native MCP support — so both humans and AI agents can hold and move funds through it.**

Repo: [github.com/shola-devv/karipto](https://github.com/shola-devv/karipto)

Built with Next.js, MongoDB, and [viem](https://viem.sh).

---

## What this is

karipto gives every user a unique, deterministically-derived Ethereum address for receiving ETH and USDT (ERC-20). Deposits are detected automatically by watching the chain, credited to an internal balance once confirmed, and can be withdrawn on-chain — either pooled through a treasury wallet, or sent directly from the user's own address.

It also ships as an **MCP server**, exposing the same wallet as a set of tools an AI agent can call directly — create a wallet, check a balance, list deposits, request a withdrawal — without a custom integration per agent framework.

## Features

- 🔑 **HD key derivation** — one master seed, one BIP44-derived address per user. No private keys are ever stored; they're derived on demand and held only in memory.
- 🔎 **Automatic deposit detection** — watches for USDT `Transfer` events and native ETH transfers, credits balances after configurable confirmations.
- 💸 **Two ways to move funds out**:
  - **Treasury withdrawals** — pooled, ledger-based, doesn't require the user's own address to hold gas.
  - **Direct send** — straight from the user's own derived address, using its live on-chain balance.
- 🔄 **Internal transfers** — move balance between users off-chain, no gas, atomic ledger updates.
- 🌐 **Multi-chain** — Ethereum Mainnet and Sepolia testnet, same address works on both.
- 🤖 **MCP server** — the wallet as agent-callable tools (`create_wallet`, `get_wallet`, `list_deposits`, `check_for_new_deposits`, `request_withdrawal`, `send_direct`, `internal_transfer`), with hard spending caps enforced independently of what an agent requests.
- 🎨 **Dashboard UI** — balances, deposit ledger with live confirmation progress, QR deposit address, send/withdraw flows.

## Architecture

```
                     ┌─────────────────┐
                     │   Next.js UI    │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐        ┌──────────────────┐
                     │  API routes     │◄──────►│   MCP server      │
                     │ (/api/*)        │        │ (mcp-server/)     │
                     └────────┬────────┘        └─────────┬─────────┘
                              │                             │
                              ▼                             ▼
                     ┌──────────────────────────────────────────┐
                     │              lib/wallet/*                 │
                     │  hdWallet · deposits · treasury · withdraw │
                     │           · directSend · transfer          │
                     └───────────────────┬────────────────────────┘
                                          │
                         ┌────────────────┼────────────────┐
                         ▼                                 ▼
                 ┌───────────────┐                ┌────────────────┐
                 │   MongoDB      │                │  Ethereum RPC   │
                 │ (users,        │                │ (viem, mainnet  │
                 │  deposits,     │                │  + sepolia)     │
                 │  transfers)    │                └────────────────┘
                 └───────────────┘
```

The API routes and the MCP server both call into the exact same `lib/wallet/*` functions — one code path per operation, whichever surface it's triggered from.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Chain interaction | [viem](https://viem.sh) |
| Database | MongoDB / Mongoose |
| Styling | Tailwind CSS |
| Agent interface | [Model Context Protocol](https://modelcontextprotocol.io) SDK |

## Getting started

```bash
git clone https://github.com/shola-devv/karipto.git
cd karipto
npm install
cp .env.example .env   # fill in the values, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

In a second terminal, run the deposit scanner so incoming transfers actually get detected:

```bash
npm run scan
```

To run the wallet as an MCP server for an AI agent (Claude Desktop, Claude Code, or any other MCP client):

```bash
npm run mcp
```

## Environment variables

See `.env.example` for the full list with inline comments. The essentials to get running locally:

| Variable | What it's for | How to get it |
|---|---|---|
| `MONGODB_URI` | Database connection | Local MongoDB, or a free Atlas cluster |
| `RPC_URL_HTTP` | Ethereum Mainnet RPC | Alchemy / Infura free tier |
| `RPC_URL_HTTP_SEPOLIA` | Sepolia RPC | Alchemy / Infura free tier |
| `WALLET_MASTER_MNEMONIC` | Master seed all addresses derive from | Generate a **test-only** phrase locally; never a real one in a plain env var — see [Security](#security) |
| `SCANNER_CRON_SECRET` | Protects the manual scan trigger endpoint | Generate: `openssl rand -hex 32` |

## Project structure

```
app/
  api/                  # HTTP routes: users, withdraw, send, transfer, deposits/scan
  page.tsx              # Dashboard UI
components/             # BalanceCard, DepositCard, LedgerStrip, SendButton, ...
lib/
  wallet/
    hdWallet.ts          # Key derivation — the sensitive core
    deposits.ts          # Chain scanning + crediting
    treasury.ts           # Pooled treasury sends
    withdraw.ts            # Treasury-based withdrawal logic
    directSend.ts           # Send straight from a user's own address
    transfer.ts               # Internal off-chain transfers
  models/                # User, Deposit, Transfer, Counter, ScanCursor
mcp-server/
  index.ts               # MCP tool definitions, reuses lib/wallet/*
scripts/
  runScanner.ts           # Standalone scan loop for local/non-serverless use
  sweep.ts                 # Consolidates deposit addresses into treasury
```

## Security

If you're deploying or contributing to this project with real assets in mind, treat the checklist below as required reading, not optional polish, before it touches anything beyond test tokens:

- Move `WALLET_MASTER_MNEMONIC` out of plain environment variables and into a KMS/HSM (AWS KMS, GCP KMS, Vault, or a custody provider).
- Add real user authentication and authorization on every route that reads or writes wallet data.
- Rate-limit withdrawals and direct sends; consider manual review above a threshold.
- Handle chain reorgs explicitly before crediting a deposit as final.
- Monitor treasury liquidity and gas balances proactively.
- Get an independent security review before handling real user funds.

If you're contributing a PR that touches `lib/wallet/`, please call out in the description which of these it affects, if any.

## Roadmap

- [ ] Proper session-based auth (current demo auth is email-only)
- [ ] Additional EVM chains
- [ ] Automated gas top-ups ahead of direct sends
- [ ] Proof-of-reserves reporting

## Contributing

Issues and PRs welcome. If you're touching anything under `lib/wallet/`, please explain the change clearly in the PR description — that's the part of the codebase that moves real money, so it gets extra scrutiny.

## License

MIT
