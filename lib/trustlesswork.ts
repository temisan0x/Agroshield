const TW_BASE_URL = "https://dev.api.trustlesswork.com";
const TW_API_KEY = process.env.TRUSTLESS_WORK_API_KEY ?? "";

const twHeaders = {
  Authorization: `Bearer ${TW_API_KEY}`,
  "Content-Type": "application/json",
};

async function safePost(url: string, payload: unknown) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: twHeaders,
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch {
    return { unsignedTransaction: "DEMO_XDR_UNSIGNED" };
  }
}

async function safeGet(url: string) {
  try {
    const response = await fetch(url, { headers: twHeaders });
    return await response.json();
  } catch {
    return { unsignedTransaction: "DEMO_XDR_UNSIGNED" };
  }
}

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
  amount: string;
  platformFee: string;
  milestones: Array<{
    description: string;
    amount: string;
  }>;
}) {
  return safePost(`${TW_BASE_URL}/deployer/single-release`, payload);
}

export async function fundEscrow(payload: {
  contractId: string;
  amount: string;
  depositor: string;
}) {
  return safePost(`${TW_BASE_URL}/escrow/single-release/fund-escrow`, payload);
}

export async function changeMilestoneStatus(payload: {
  contractId: string;
  milestoneIndex: string;
  newStatus: string;
  serviceProvider: string;
}) {
  return safePost(
    `${TW_BASE_URL}/escrow/single-release/change-milestone-status`,
    payload
  );
}

export async function approveMilestone(payload: {
  contractId: string;
  milestoneIndex: string;
  approver: string;
}) {
  return safePost(
    `${TW_BASE_URL}/escrow/single-release/approve-milestone`,
    payload
  );
}

export async function releaseFunds(payload: {
  contractId: string;
  releaseSigner: string;
}) {
  return safePost(`${TW_BASE_URL}/escrow/single-release/release-funds`, payload);
}

export async function disputeEscrow(payload: {
  contractId: string;
  disputeStartedBy: string;
}) {
  return safePost(`${TW_BASE_URL}/escrow/single-release/dispute-escrow`, payload);
}

export async function resolveDispute(payload: {
  contractId: string;
  disputeResolver: string;
  approverFunds: string;
  releasedAmount: string;
}) {
  return safePost(`${TW_BASE_URL}/escrow/single-release/resolve-dispute`, payload);
}

export async function getEscrow(contractId: string) {
  return safeGet(
    `${TW_BASE_URL}/escrow/single-release/get-escrow?contractId=${contractId}`
  );
}
