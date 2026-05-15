interface SignTransactionProps {
  unsignedTransaction: string;
  address: string;
}

let kitInitialized = false;

async function ensureWalletKit() {
  if (typeof window === "undefined") {
    throw new Error("Wallet actions are only available in the browser");
  }

  const [{ StellarWalletsKit, Networks }, { FreighterModule, FREIGHTER_ID }] = await Promise.all([
    import("@creit.tech/stellar-wallets-kit"),
    import("@creit.tech/stellar-wallets-kit/modules/freighter"),
  ]);

  if (!kitInitialized) {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules: [new FreighterModule()],
    });

    kitInitialized = true;
  }

  return { StellarWalletsKit, Networks };
}

/**
 * Sign a transaction using the selected wallet on TESTNET
 */
export const signTransaction = async ({
  unsignedTransaction,
  address,
}: SignTransactionProps): Promise<string> => {
  const { StellarWalletsKit, Networks } = await ensureWalletKit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(unsignedTransaction, {
    address,
    networkPassphrase: Networks.TESTNET,
  });
  return signedTxXdr;
};

/**
 * Connect wallet and get address using the authModal
 * Always disconnect first to force a signature prompt on every connection attempt
 */
export const connectWallet = async (): Promise<string> => {
  const { StellarWalletsKit } = await ensureWalletKit();
  
  try {
    // Clear any previous connection state
    await StellarWalletsKit.disconnect();
    if (typeof window !== "undefined") {
      localStorage.removeItem("stellar-wallets-kit-wallet-id");
    }
  } catch (_) {
    // Ignore error if there's no wallet to disconnect
  }

  // Use authModal which will now show the selection modal because we removed selectedWalletId from init
  const { address } = await StellarWalletsKit.authModal();
  
  if (!address) {
    throw new Error("No address returned from wallet");
  }

  // Force a signature prompt to "sign to connect" as requested
  try {
    const { signMessage } = await import("@stellar/freighter-api");
    await signMessage(`Authorize AgroShield connection at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("Signature failed or rejected:", error);
    // We still have the address, but if the user rejected the sign, 
    // we might want to throw an error if "sign to connect" is mandatory.
    throw new Error("Signature required to connect wallet");
  }

  return address;
};

/**
 * Disconnect the current wallet
 */
export const disconnectWallet = async (): Promise<void> => {
  const { StellarWalletsKit } = await ensureWalletKit();
  await StellarWalletsKit.disconnect();
  if (typeof window !== "undefined") {
    localStorage.removeItem("stellar-wallets-kit-wallet-id");
  }
};
