const TW_BASE_URL = "https://dev.api.trustlesswork.com"; // TESTNET ONLY

const getHeaders = () => ({
  "x-api-key": process.env.TRUSTLESS_WORK_API_KEY || "",
  "Content-Type": "application/json",
});

/**
 * Send a signed transaction to Trustless Work Testnet
 * Proxies through our own API when called from the client
 */
export async function sendSignedTransaction(signedXdr: string) {
  const isClient = typeof window !== "undefined";
  
  const endpoint = isClient 
    ? "/api/trustlesswork/send-transaction" 
    : `${TW_BASE_URL}/helper/send-transaction`;

  const headers = isClient 
    ? { "Content-Type": "application/json" }
    : getHeaders();

  console.log(`[TW_SEND] Target: ${endpoint}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ signedXdr }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    console.error(`[TW_SEND_ERROR] ${JSON.stringify(error)}`);
    throw new Error(`TW send-transaction failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Deploy escrow — returns unsignedTransaction XDR
 */
export async function deployEscrow(payload: {
  engagementId: string;
  title: string;
  description: string;
  approver: string;
  serviceProvider: string;
  releaseSigner: string;
  receiver: string;
  platformAddress: string;
  disputeResolver: string;
  amount: string | number;
  platformFee: string | number;
  milestones: Array<{ description: string; amount?: string | number }>;
}) {
  console.log(`[TW_DEPLOY] ${TW_BASE_URL}/deployer/single-release`);
  const response = await fetch(`${TW_BASE_URL}/deployer/single-release`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Deploy escrow failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Fund escrow — returns unsignedTransaction XDR
 */
export async function fundEscrow(payload: {
  contractId: string;
  amount: string | number;
  depositor: string;
}) {
  console.log(`[TW_FUND] ${TW_BASE_URL}/escrow/single-release/fund-escrow`);
  const response = await fetch(
    `${TW_BASE_URL}/escrow/single-release/fund-escrow`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Fund escrow failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Release funds — returns unsignedTransaction XDR
 */
export async function releaseFunds(payload: {
  contractId: string;
  releaseSigner: string;
}) {
  console.log(`[TW_RELEASE] ${TW_BASE_URL}/escrow/single-release/release-funds`);
  const response = await fetch(
    `${TW_BASE_URL}/escrow/single-release/release-funds`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Release funds failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Get escrow status — no signing needed
 */
export async function getEscrowStatus(contractId: string) {
  const response = await fetch(
    `${TW_BASE_URL}/escrow/single-release/get-escrow?contractId=${contractId}`,
    { headers: getHeaders() }
  );
  return response.json();
}
