import {
  StellarWalletsKit,
  Networks,
} from "@creit.tech/stellar-wallets-kit";
import { FreighterModule, FREIGHTER_ID } from "@creit.tech/stellar-wallets-kit/modules/freighter";

/**
 * Stellar Wallet Kit configured for TESTNET
 * Initialized using the static init method for version 2.2.0
 */
StellarWalletsKit.init({
  network: Networks.TESTNET,
  selectedWalletId: FREIGHTER_ID,
  modules: [new FreighterModule()],
});

interface SignTransactionProps {
  unsignedTransaction: string;
  address: string;
}

/**
 * Sign a transaction using the selected wallet on TESTNET
 */
export const signTransaction = async ({
  unsignedTransaction,
  address,
}: SignTransactionProps): Promise<string> => {
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
  const { address } = await StellarWalletsKit.authModal();
  return address;
};

/**
 * Disconnect the current wallet
 */
export const disconnectWallet = async (): Promise<void> => {
  await StellarWalletsKit.disconnect();
};
