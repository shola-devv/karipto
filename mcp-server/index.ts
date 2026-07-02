import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { formatEther, formatUnits } from "viem";

import { dbConnect } from "../lib/mongodb";
import User from "../lib/models/User";
import { nextDerivationIndex } from "../lib/models/Counter";
import { deriveAddressForIndex } from "../lib/wallet/hdWallet";
import { runDepositScan } from "../lib/wallet/deposits";
import { performWithdrawal, WithdrawalError } from "../lib/wallet/withdraw";
import { env } from "../lib/env";

const server = new McpServer({
  name: "eth-usdt-wallet",
  version: "0.1.0",
});

// ---------------------------------------------------------------------
// create_wallet
// ---------------------------------------------------------------------
server.registerTool(
  "create_wallet",
  {
    title: "Create wallet",
    description:
      "Create a new custodial wallet for a user (or return their existing one). " +
      "Returns a dedicated Ethereum address for receiving ETH and USDT deposits. " +
      "No private key material is ever returned — this system derives keys " +
      "server-side and never exposes them.",
    inputSchema: {
      email: z.string().email().describe("Unique identifier for the wallet owner"),
    },
  },
  async ({ email }) => {
    await dbConnect();
    const normalized = email.trim().toLowerCase();

    let user = await User.findOne({ email: normalized });
    if (!user) {
      const index = await nextDerivationIndex();
      const address = deriveAddressForIndex(index).toLowerCase();
      user = await User.create({ email: normalized, derivationIndex: index, depositAddress: address });
    }

    return textResult({
      userId: user._id.toString(),
      email: user.email,
      depositAddress: user.depositAddress,
      note: "Send ETH or USDT (ERC-20, Ethereum mainnet) to depositAddress. Deposits credit after 12 confirmations.",
    });
  }
);

// ---------------------------------------------------------------------
// get_wallet
// ---------------------------------------------------------------------
server.registerTool(
  "get_wallet",
  {
    title: "Get wallet balance and address",
    description:
      "Look up a wallet's current balances and deposit address by userId or email. " +
      "Balances reflect only confirmed (credited) deposits.",
    inputSchema: {
      userId: z.string().optional().describe("Mongo user id, if known"),
      email: z.string().email().optional().describe("Wallet owner's email, if userId isn't known"),
    },
  },
  async ({ userId, email }) => {
    await dbConnect();
    const user = userId ? await User.findById(userId) : await User.findOne({ email: email?.toLowerCase() });
    if (!user) return textResult({ error: "Wallet not found" }, true);

    return textResult({
      userId: user._id.toString(),
      email: user.email,
      depositAddress: user.depositAddress,
      eth: formatEther(BigInt(user.ethBalanceWei)),
      usdt: formatUnits(BigInt(user.usdtBalanceUnits), 6),
      ethBalanceWei: user.ethBalanceWei,
      usdtBalanceUnits: user.usdtBalanceUnits,
    });
  }
);

// ---------------------------------------------------------------------
// list_deposits
// ---------------------------------------------------------------------
server.registerTool(
  "list_deposits",
  {
    title: "List deposit history",
    description:
      "List recent deposits for a wallet, including pending ones still waiting on " +
      "confirmations. Useful for answering 'has my deposit arrived yet?'.",
    inputSchema: {
      userId: z.string().describe("Mongo user id"),
      limit: z.number().int().min(1).max(100).default(20),
    },
  },
  async ({ userId, limit }) => {
    await dbConnect();
    const Deposit = (await import("../lib/models/Deposit")).default;
    const deposits = await Deposit.find({ userId }).sort({ blockNumber: -1 }).limit(limit);
    return textResult(
      deposits.map((d) => ({
        asset: d.asset,
        amount: d.amount,
        txHash: d.txHash,
        status: d.status,
        confirmations: d.confirmations,
        blockNumber: d.blockNumber,
      }))
    );
  }
);

// ---------------------------------------------------------------------
// check_for_new_deposits — lets an agent force a scan instead of waiting
// for the next scheduled run, e.g. right after telling a user "I've sent it"
// ---------------------------------------------------------------------
server.registerTool(
  "check_for_new_deposits",
  {
    title: "Check for new deposits now",
    description:
      "Trigger an immediate on-chain scan for new deposits instead of waiting for " +
      "the next scheduled scan. Safe to call repeatedly.",
    inputSchema: {},
  },
  async () => {
    const result = await runDepositScan();
    return textResult({
      scannedUpToBlock: result.scannedTo.toString(),
      chainHead: result.latest.toString(),
    });
  }
);

// ---------------------------------------------------------------------
// request_withdrawal — the sensitive one. Hard caps + optional allowlist
// are enforced here regardless of what the calling agent asks for.
// ---------------------------------------------------------------------
server.registerTool(
  "request_withdrawal",
  {
    title: "Withdraw funds to an external address",
    description:
      "Send ETH or USDT out of a user's wallet to an external address. " +
      "Subject to a hard per-transaction cap and, if configured, a destination " +
      "address allowlist — both enforced server-side and independent of this " +
      "call's arguments. Amounts are in the asset's smallest unit (wei for ETH, " +
      "6-decimal units for USDT).",
    inputSchema: {
      userId: z.string(),
      asset: z.enum(["ETH", "USDT"]),
      amount: z.string().describe("Amount in smallest unit, as a string (wei or USDT 6-decimal units)"),
      toAddress: z.string().describe("Destination Ethereum address"),
    },
  },
  async ({ userId, asset, amount, toAddress }) => {
    let amountBig: bigint;
    try {
      amountBig = BigInt(amount);
    } catch {
      return textResult({ error: "amount must be an integer string" }, true);
    }

    const cap = asset === "ETH" ? env.mcpMaxWithdrawalWei() : env.mcpMaxWithdrawalUsdtUnits();
    if (cap > 0n && amountBig > cap) {
      return textResult(
        {
          error: `Amount exceeds the per-transaction limit for agent-initiated withdrawals (max ${cap.toString()}).`,
        },
        true
      );
    }

    const allowlist = env.mcpWithdrawalAllowlist();
    if (allowlist.length > 0 && !allowlist.includes(toAddress.toLowerCase())) {
      return textResult(
        { error: "Destination address is not on the withdrawal allowlist." },
        true
      );
    }

    try {
      const result = await performWithdrawal({ userId, asset, amount: amountBig, toAddress });
      return textResult(result);
    } catch (err) {
      if (err instanceof WithdrawalError) return textResult({ error: err.message }, true);
      return textResult({ error: "Withdrawal failed unexpectedly" }, true);
    }
  }
);

function textResult(data: unknown, isError = false) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    isError,
  };
}

async function main() {
  if (env.mcpTransport() === "http") {
    await startHttp();
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[mcp] eth-usdt-wallet server running on stdio");
  }
}

async function startHttp() {
  const { StreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/streamableHttp.js"
  );
  const http = await import("node:http");

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);

  const port = env.mcpHttpPort();
  const httpServer = http.createServer(async (req, res) => {
    const token = req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
    if (env.mcpAuthToken() && token !== env.mcpAuthToken()) {
      res.writeHead(401).end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      const parsed = body ? JSON.parse(body) : undefined;
      await transport.handleRequest(req, res, parsed);
    });
  });

  httpServer.listen(port, () => {
    console.error(`[mcp] eth-usdt-wallet server listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("[mcp] fatal error", err);
  process.exit(1);
});
