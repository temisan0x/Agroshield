const TW_BASE_URL = "https://dev.api.trustlesswork.com"; // TESTNET ONLY

function getApiKey() {
  const apiKey = process.env.TRUSTLESS_WORK_API_KEY;
  if (!apiKey) {
    throw new Error("TRUSTLESS_WORK_API_KEY is missing");
  }
  return apiKey;
}

function getHeaders() {
  return {
    "x-api-key": getApiKey(),
    "Content-Type": "application/json",
  };
}

async function twJson(path: string, init: RequestInit): Promise<any> {
  const response = await fetch(`${TW_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getHeaders(),
      ...(init.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (data as { error?: string; message?: string }).error ??
      (data as { error?: string; message?: string }).message ??
      `Trustless Work request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

/**
 * Send a signed transaction to Trustless Work Testnet
 * Proxies through our own API when called from the client
 */
export async function sendSignedTransaction(signedXdr: string) {
  const isClient = typeof window !== "undefined";

  const endpoint = isClient ? "/api/trustlesswork/send-transaction" : `${TW_BASE_URL}/helper/send-transaction`;

  const headers = isClient ? { "Content-Type": "application/json" } : getHeaders();

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
  return twJson("/deployer/single-release", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fund escrow — returns unsignedTransaction XDR
 */
export async function fundEscrow(payload: {
  contractId: string;
  amount: string | number;
  signer: string;
}) {
  console.log(`[TW_FUND] ${TW_BASE_URL}/escrow/single-release/fund-escrow`);
  return twJson("/escrow/single-release/fund-escrow", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Release funds — returns unsignedTransaction XDR
 */
export async function releaseFunds(payload: {
  contractId: string;
  releaseSigner: string;
}) {
  console.log(`[TW_RELEASE] ${TW_BASE_URL}/escrow/single-release/release-funds`);
  return twJson("/escrow/single-release/release-funds", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Get escrow status — no signing needed
 */
export async function getEscrowStatus(contractId: string) {
  const response = await fetch(`${TW_BASE_URL}/escrow/single-release/get-escrow?contractId=${contractId}`, {
    headers: getHeaders(),
  });
  return response.json();
}

export async function approveMilestone(payload: {
  contractId: string;
  milestoneIndex: string;
  approver: string;
  newEvidence?: string;
}) {
  console.log(`[TW_APPROVE] ${TW_BASE_URL}/escrow/single-release/approve-milestone`);
  return twJson("/escrow/single-release/approve-milestone", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function changeMilestoneStatus(payload: {
  contractId: string;
  milestoneIndex: string;
  newStatus: string;
  serviceProvider: string;
  newEvidence?: string;
}) {
  console.log(`[TW_CHANGE] ${TW_BASE_URL}/escrow/single-release/change-milestone-status`);
  return twJson("/escrow/single-release/change-milestone-status", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function disputeEscrow(payload: {
  contractId: string;
  signer: string;
}) {
  console.log(`[TW_DISPUTE] ${TW_BASE_URL}/escrow/single-release/dispute-escrow`);
  return twJson("/escrow/single-release/dispute-escrow", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resolveDispute(payload: {
  contractId: string;
  disputeResolver: string;
  distributions: Array<{ address: string; amount: number | string }>;
}) {
  console.log(`[TW_RESOLVE] ${TW_BASE_URL}/escrow/single-release/resolve-dispute`);
  return twJson("/escrow/single-release/resolve-dispute", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendTransaction(signedXdr: string) {
  console.log(`[TW_BROADCAST] ${TW_BASE_URL}/helper/send-transaction`);
  return twJson("/helper/send-transaction", {
    method: "POST",
    body: JSON.stringify({ signedXdr }),
  });
}
