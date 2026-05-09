'use client'

import { snoopNFTABI, snoopNFTAddress } from "@/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useAccount, useContractRead } from "wagmi";
import { writeContract, waitForTransaction } from "wagmi/actions";
import { Inter } from "next/font/google";
import { useConfig } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function Home(): JSX.Element | null {
  const { address, isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");
  const [blessingInput, setBlessingInput] = useState<string>("");
  const [index, setIndex] = useState<number>(1);

  const Config = useConfig()
  // ✅ READ — useContractRead (hook, runs automatically)
  // getName takes a uint8 index argument
  const { data: nameAtIndex, isLoading: nameLoading, refetch: refetchName } = useContractRead({
    abi: snoopNFTABI,
    address: snoopNFTAddress,
    functionName: "getName",
    args: [index],          // uint8 index — must be passed as args array
    enabled: true,          // set to false to disable auto-fetch
  });

  // ✅ READ — getBlessings (no args)
  const { data: blessings, refetch: refetchBlessings } = useContractRead({
    abi: snoopNFTABI,
    address: snoopNFTAddress,
    functionName: "getBlessings",
  });

  // ✅ READ — getRandomly (no args)
  const { data: randomPair } = useContractRead({
    abi: snoopNFTABI,
    address: snoopNFTAddress,
    functionName: "getRandomly",
  });

  console.log("nameAtIndex:", nameAtIndex);      // string
  console.log("blessings:", blessings);          // string[]
  console.log("randomPair:", randomPair);        // [string, string]

  // ✅ WRITE — setNamesArray
  async function handleSetName(): Promise<void> {
    try {
      const  hash  = await writeContract(Config, {
        abi: snoopNFTABI,
        address: snoopNFTAddress,
        functionName: "setNamesArray",
        args: [nameInput],   // string memory name
      });

      console.log("tx hash:", hash);
      await waitForTransactionReceipt(Config, { hash });
      console.log("setNamesArray confirmed!");
     alert('done')
      refetchName();         // optionally refresh read after write
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  }

  // ✅ WRITE — sendIntoBlessings
  async function handleSendBlessing(): Promise<void> {
    try {
      const  hash  = await writeContract(Config, {
        abi: snoopNFTABI,
        address: snoopNFTAddress,
        functionName: "sendIntoBlessings",
        args: [blessingInput],  // string memory blessing
      });

      await waitForTransactionReceipt(Config, { hash });
      console.log("sendIntoBlessings confirmed!");
      alert('done')
      refetchBlessings();
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // AFTER
if (!isConnected)
  return (
    <div
      className="flex flex-col justify-center items-center min-h-screen relative overflow-hidden"
      style={{
        background: "#080808",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
        }}
      />
 
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(128,128,0,0.08) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
 
      {/* Top thin line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #808000, transparent)" }} />
 
      {/* Logo / Title */}
      <div className="relative z-10 text-center mb-16">
        <p className="tracking-[0.4em] text-xs mb-4" style={{ color: "#808000", fontFamily: "'Syne', sans-serif" }}>
          EXCLUSIVE COLLECTION
        </p>
        <h1
          className="text-7xl font-light tracking-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "#f5f0e8", lineHeight: 1 }}
        >
          Snoop
          <span className="font-semibold italic" style={{ color: "#808000" }}>
            NFT
          </span>
        </h1>
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="h-px w-16" style={{ background: "#808000", opacity: 0.5 }} />
          <p className="text-xs tracking-widest" style={{ color: "#666", fontFamily: "'Syne', sans-serif" }}>
            10 UNIQUE PIECES
          </p>
          <div className="h-px w-16" style={{ background: "#808000", opacity: 0.5 }} />
        </div>
      </div>
 
      {/* Connect Button */}
      <div className="relative z-10">
        <ConnectButton.Custom>
          {({ openConnectModal, isConnecting, mounted }) => (
            <button
              onClick={openConnectModal}
              disabled={isConnecting || !mounted}
              className="group relative overflow-hidden"
              style={{
                background: "transparent",
                border: "1px solid #808000",
                color: "#f5f0e8",
                padding: "16px 48px",
                fontSize: "11px",
                letterSpacing: "0.3em",
                cursor: "pointer",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#808000";
                e.currentTarget.style.color = "#080808";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#f5f0e8";
              }}
            >
              {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
            </button>
          )}
        </ConnectButton.Custom>
        <p className="text-center mt-4 text-xs tracking-widest" style={{ color: "#444", fontFamily: "'Syne', sans-serif" }}>
          ETHEREUM MAINNET
        </p>
      </div>
 
      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #808000, transparent)" }} />
    </div>
  );
 
 
// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
return (
  <div
    className="min-h-screen relative"
    style={{
      background: "#080808",
      fontFamily: "'Syne', sans-serif",
      color: "#f5f0e8",
    }}
  >
    {/* Noise overlay */}
    <div
      className="fixed inset-0 opacity-30 pointer-events-none z-0"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
      }}
    />
 
    {/* Ambient glow top-right */}
    <div
      className="fixed pointer-events-none z-0"
      style={{
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(128,128,0,0.06) 0%, transparent 70%)",
        top: "-100px",
        right: "-100px",
      }}
    />
 
    {/* Top bar line */}
    <div className="relative z-10 h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #808000, transparent)" }} />
 
    {/* ── HEADER ── */}
    <header className="relative z-10 flex items-center justify-between px-8 py-5" style={{ borderBottom: "1px solid #1a1a1a" }}>
      <div>
        <span
          className="text-2xl tracking-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "#f5f0e8" }}
        >
          Snoop<span className="italic font-semibold" style={{ color: "#808000" }}>NFT</span>
        </span>
      </div>
 
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openChainModal, mounted }) => {
          if (!mounted || !account || !chain) return null;
          return (
            <div className="flex items-center gap-3">
              <button
                onClick={openChainModal}
                className="flex items-center gap-2 text-xs tracking-widest transition-colors"
                style={{
                  background: "transparent",
                  border: "1px solid #2a2a2a",
                  borderRadius: "0",
                  padding: "8px 16px",
                  cursor: "pointer",
                  color: "#888",
                  fontFamily: "'Syne', sans-serif",
                  letterSpacing: "0.15em",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#808000"; e.currentTarget.style.color = "#f5f0e8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#888"; }}
              >
                ◆ {chain.name.toUpperCase()}
              </button>
 
              <button
                onClick={openAccountModal}
                className="flex items-center gap-2 text-xs tracking-widest"
                style={{
                  background: "#808000",
                  border: "1px solid #808000",
                  borderRadius: "0",
                  padding: "8px 16px",
                  cursor: "pointer",
                  color: "#080808",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                }}
              >
                {account.displayName} · {account.displayBalance}
              </button>
            </div>
          );
        }}
      </ConnectButton.Custom>
    </header>
 
    {/* ── MAIN CONTENT ── */}
    <main className="relative z-10 max-w-5xl mx-auto px-8 py-16">
 
      {/* Hero title */}
      <div className="mb-16">
        <p className="text-xs tracking-[0.4em] mb-3" style={{ color: "#808000" }}>EXCLUSIVE DROP</p>
        <h2
          className="text-6xl font-light leading-none mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Claim Your
        </h2>
        <h2
          className="text-6xl font-semibold italic leading-none"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "#808000" }}
        >
          Snoop NFT
        </h2>
        <div className="mt-6 h-px w-24" style={{ background: "#808000" }} />
      </div>
 
      {/* ── TWO COLUMNS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
 
        {/* LEFT — Name & Blessing inputs */}
        <div className="space-y-8">
 
          {/* Set Name card */}
          <div style={{ border: "1px solid #1e1e1e", padding: "32px" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6" style={{ background: "#808000" }} />
              <p className="text-xs tracking-[0.3em]" style={{ color: "#808000" }}>SET YOUR NAME</p>
            </div>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-transparent text-sm outline-none placeholder:opacity-30 mb-6"
              style={{
                border: "none",
                borderBottom: "1px solid #2a2a2a",
                padding: "12px 0",
                color: "#f5f0e8",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.05em",
              }}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#808000"; }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = "#2a2a2a"; }}
            />
           
    {/* ── FOOTER ── */}
    <footer className="relative z-10 mt-24 px-8 py-6 flex justify-between items-center" style={{ borderTop: "1px solid #1a1a1a" }}>
      <p className="text-xs tracking-widest" style={{ color: "#333" }}>SNOOPNFT © 2025</p>
      <p className="text-xs tracking-widest" style={{ color: "#333" }}>POWERED BY ETHEREUM</p>
    </footer>
 
    {/* Bottom accent line */}
    <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #808000, transparent)" }} />
  </div>
);