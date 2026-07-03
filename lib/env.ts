function getEnvValue(name: string, required = true): string {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function getEnvNumber(name: string): number {
  const value = getEnvValue(name);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
}

function getEnvBigInt(name: string): bigint {
  const value = getEnvValue(name);
  try {
    return BigInt(value);
  } catch {
    throw new Error(`Environment variable ${name} must be a valid integer string`);
  }
}

function getEnvList(name: string): string[] {
  return getEnvValue(name, false)
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export const env = {
  mongodbUri: () => getEnvValue("MONGODB_URI"),
  rpcHttp: () => getEnvValue("RPC_URL_HTTP"),
  usdtAddress: () => getEnvValue("USDT_CONTRACT_ADDRESS") as `0x${string}`,
  masterMnemonic: () => getEnvValue("WALLET_MASTER_MNEMONIC"),
  scannerCronSecret: () => getEnvValue("SCANNER_CRON_SECRET"),
  mcpTransport: () => (getEnvValue("MCP_TRANSPORT", false) || "stdio") as "stdio" | "http",
  mcpHttpPort: () => getEnvNumber("MCP_HTTP_PORT"),
  mcpAuthToken: () => getEnvValue("MCP_AUTH_TOKEN", false),
  mcpMaxWithdrawalWei: () => getEnvBigInt("MCP_MAX_WITHDRAWAL_WEI"),
  mcpMaxWithdrawalUsdtUnits: () => getEnvBigInt("MCP_MAX_WITHDRAWAL_USDT_UNITS"),
  mcpWithdrawalAllowlist: () => getEnvList("MCP_WITHDRAWAL_ALLOWLIST"),
};
