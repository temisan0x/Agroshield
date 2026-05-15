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
      selectedWalletId: FREIGHTER_ID,
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
 */
export const connectWallet = async (): Promise<string> => {
  const { StellarWalletsKit } = await ensureWalletKit();
  const { address } = await StellarWalletsKit.authModal();
  return address;
};

/**
 * Disconnect the current wallet
 */
export const disconnectWallet = async (): Promise<void> => {
  const { StellarWalletsKit } = await ensureWalletKit();
  await StellarWalletsKit.disconnect();
};
