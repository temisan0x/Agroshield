import { prisma } from "./prisma";

function sanitizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^_+|_+$/g, "");
}

export async function generateUsernameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "";
  const base = sanitizeUsername(localPart).slice(0, 18) || "user";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = attempt === 0 ? "" : String(attempt);
    const candidate = `${base}${suffix}`.slice(0, 24);
    const existing = await prisma.user.findUnique({ where: { username: candidate } });

    if (!existing) {
      return candidate;
    }
  }

  return `${base}${Math.random().toString(36).slice(2, 6)}`.slice(0, 24);
}

export function formatUsername(username: string | null | undefined) {
  if (!username) return null;
  return `@${username}`;
}
