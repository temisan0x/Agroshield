import type { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

export type AuthTokenPayload = {
  userId: string;
  role: string;
};

export async function signToken(payload: AuthTokenPayload) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (!payload || typeof payload.userId !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return { userId: payload.userId, role: payload.role } as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) return null;

  return prisma.user.findUnique({
    where: { id: decoded.userId },
  });
}
