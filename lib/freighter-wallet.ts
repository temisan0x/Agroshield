"use client";

import { getNetworkDetails, requestAccess, signMessage } from "@stellar/freighter-api";

type FreighterNetworkName = "PUBLIC" | "TESTNET" | "FUTURENET" | "STANDALONE";

export type WalletNetworkMode = "auto" | "any" | "mainnet" | "testnet" | "futurenet" | "standalone";

export type ConnectWalletResult = {
  address: string;
  network: FreighterNetworkName;
  networkPassphrase: string;
};

const DEFAULT_WALLET_NETWORK_MODE: WalletNetworkMode = "testnet";

function formatFreighterNetworkName(network: string) {
  if (network === "PUBLIC") return "mainnet";
  if (network === "TESTNET") return "testnet";
  if (network === "FUTURENET") return "futurenet";
  if (network === "STANDALONE") return "standalone";
  return network.toLowerCase();
}

function normalizeNetworkMode(value: string | undefined): WalletNetworkMode {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "mainnet" || normalized === "public") return "mainnet";
  if (normalized === "testnet") return "testnet";
  if (normalized === "futurenet") return "futurenet";
  if (normalized === "standalone") return "standalone";
  if (normalized === "any") return "any";
  return "auto";
}

export function getExpectedWalletNetworkMode() {
  return normalizeNetworkMode(process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? DEFAULT_WALLET_NETWORK_MODE);
}

export function getExpectedWalletNetworkLabel() {
  const mode = getExpectedWalletNetworkMode();
  if (mode === "auto" || mode === "any") return "any Stellar network";
  if (mode === "mainnet") return "mainnet";
  if (mode === "testnet") return "testnet";
  if (mode === "futurenet") return "futurenet";
  return "a custom Freighter network";
}

function matchesNetworkMode(network: string, mode: WalletNetworkMode) {
  if (mode === "auto" || mode === "any") return true;
  if (mode === "mainnet") return network === "PUBLIC";
  if (mode === "testnet") return network === "TESTNET";
  if (mode === "futurenet") return network === "FUTURENET";
  return network === "STANDALONE";
}

export function getNetworkMismatchMessage(network: string) {
  const mode = getExpectedWalletNetworkMode();
  if (mode === "auto" || mode === "any") return null;
  if (matchesNetworkMode(network, mode)) return null;

  return `Freighter is on ${formatFreighterNetworkName(network)}, but this app is configured for ${getExpectedWalletNetworkLabel()}. Switch Freighter networks and try again.`;
}

export async function connectFreighterWallet() {
  if (typeof window === "undefined") {
    throw new Error("Wallet connections must run in the browser.");
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error.message ?? "Failed to request wallet access.");
  }

  if (!access.address) {
    throw new Error("Failed to retrieve wallet address from Freighter.");
  }

  const network = await getNetworkDetails();
  if (network.error) {
    throw new Error(network.error.message ?? "Failed to read the Freighter network.");
  }

  const mismatch = getNetworkMismatchMessage(network.network);
  if (mismatch) {
    throw new Error(mismatch);
  }

  const challenge = [
    "AgroShield wallet connection",
    `Action: connect`,
    `Origin: ${window.location.origin}`,
    `Address: ${access.address}`,
    `Network: ${network.network}`,
    `Nonce: ${crypto.randomUUID()}`,
    `Issued at: ${new Date().toISOString()}`,
  ].join("\n");
  const signed = await signMessage(challenge, {
    address: access.address,
    networkPassphrase: network.networkPassphrase,
  });
  if (signed.error) {
    throw new Error(signed.error.message ?? "Failed to sign wallet challenge.");
  }
  if (!signed.signedMessage) {
    throw new Error("Freighter did not return a signed wallet challenge.");
  }
  if (signed.signerAddress && signed.signerAddress !== access.address) {
    throw new Error("Freighter signed with a different wallet. Please reconnect with the correct account.");
  }

  return {
    address: access.address,
    network: network.network as FreighterNetworkName,
    networkPassphrase: network.networkPassphrase,
  } satisfies ConnectWalletResult;
}

export async function disconnectFreighterWallet(address: string) {
  if (typeof window === "undefined") {
    throw new Error("Wallet disconnections must run in the browser.");
  }

  const network = await getNetworkDetails();
  if (network.error) {
    throw new Error(network.error.message ?? "Failed to read the Freighter network.");
  }

  const challenge = [
    "AgroShield wallet connection",
    `Action: disconnect`,
    `Origin: ${window.location.origin}`,
    `Address: ${address}`,
    `Network: ${network.network}`,
    `Nonce: ${crypto.randomUUID()}`,
    `Issued at: ${new Date().toISOString()}`,
  ].join("\n");
  const signed = await signMessage(challenge, {
    address,
    networkPassphrase: network.networkPassphrase,
  });

  if (signed.error) {
    throw new Error(signed.error.message ?? "Failed to sign wallet disconnect challenge.");
  }
  if (!signed.signedMessage) {
    throw new Error("Freighter did not return a signed wallet disconnect challenge.");
  }
  if (signed.signerAddress && signed.signerAddress !== address) {
    throw new Error("Freighter signed with a different wallet. Please reconnect with the correct account.");
  }

  return true;
}
