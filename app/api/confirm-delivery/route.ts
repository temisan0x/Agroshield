import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TW_BASE_URL = process.env.NEXT_PUBLIC_TRUSTLESS_WORK_API ?? "https://dev.api.trustlesswork.com";
const TW_API_KEY =
  process.env.TRUSTLESS_WORK_API_KEY ?? process.env.tw_api_key ?? process.env.TW_API_KEY ?? "";

function getTwHeaders() {
  if (!TW_API_KEY) {
    throw new Error("Missing Trustless Work API key");
  }

  return {
    "x-api-key": TW_API_KEY,
    "Content-Type": "application/json",
  };
}

async function safeTwPost(path: string, payload: unknown) {
  const response = await fetch(`${TW_BASE_URL}${path}`, {
    method: "POST",
    headers: getTwHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { error?: string; message?: string }).error ??
        (data as { error?: string; message?: string }).message ??
        `Trustless Work request failed (${response.status})`
    );
  }

  return data as { unsignedTransaction?: string; error?: string; message?: string };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "FARMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { caseId, contractId, confirmed } = body ?? {};

    if (!caseId || !contractId) {
      return NextResponse.json({ error: "caseId and contractId are required" }, { status: 400 });
    }

    const foundCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: { escrow: true },
    });

    if (!foundCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (foundCase.farmerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (foundCase.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Only delivered cases can be confirmed" },
        { status: 400 },
      );
    }

    if (foundCase.escrow?.contractId !== contractId) {
      return NextResponse.json({ error: "Escrow contract mismatch" }, { status: 400 });
    }

    if (!user.walletAddress) {
      return NextResponse.json({ error: "Missing farmer wallet address" }, { status: 400 });
    }

    if (confirmed === true) {
      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: { status: "COMPLETED" },
        select: { id: true, status: true },
      });

      return NextResponse.json({
        message: "Delivery confirmed and funds released",
        case: {
          id: updatedCase.id,
          status: updatedCase.status,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const approveResponse = await safeTwPost("/escrow/single-release/approve-milestone", {
      contractId,
      milestoneIndex: 0,
      approver: user.walletAddress ?? user.id,
    });

    const releaseResponse = await safeTwPost("/escrow/single-release/release-funds", {
      contractId,
      releaseSigner: user.walletAddress ?? user.id,
    });

    return NextResponse.json({
      approveXdr: approveResponse.unsignedTransaction,
      releaseXdr: releaseResponse.unsignedTransaction,
    });
  } catch (error) {
    console.error("[CONFIRM_DELIVERY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
