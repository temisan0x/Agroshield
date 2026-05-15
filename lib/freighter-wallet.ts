export async function connectFreighterWallet() {
  const { requestAccess, getAddress } = await import("@stellar/freighter-api");

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error.message ?? "Failed to request access.");
  }

  return access.address ?? (await getAddress()).address ?? null;
}
