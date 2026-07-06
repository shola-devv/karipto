import { mainnet, sepolia } from "viem/chains";

export type ChainConfig = {
  chainId: number;
  key: "mainnet" | "sepolia";
  viemChain: any;
  rpcEnvVar: string;
  usdtAddress: `0x${string}` | string;
  usdtDecimals: number;
  confirmations: number;
};

export const CHAINS: ChainConfig[] = [
  {
    chainId: 1,
    key: "mainnet",
    viemChain: mainnet,
    rpcEnvVar: "RPC_URL_HTTP_MAINNET",
    usdtAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    usdtDecimals: 6,
    confirmations: 12,
  },
  {
    chainId: 11155111,
    key: "sepolia",
    viemChain: sepolia,
    rpcEnvVar: "RPC_URL_HTTP_SEPOLIA",
    usdtAddress: "<USDT_CONTRACT_ADDRESS_SEPOLIA>",
    usdtDecimals: 6,
    confirmations: 6,
  },
];

export function getChainById(chainId: number) {
  return CHAINS.find((c) => c.chainId === chainId);
}

export function getChainByKey(key: string) {
  return CHAINS.find((c) => c.key === key);
}
