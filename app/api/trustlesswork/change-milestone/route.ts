import { NextResponse, type NextRequest } from "next/server";

const TW_ENDPOINT = "https://dev.api.trustlesswork.com/escrow/single-release/change-milestone-status";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log(`[TW_PROXY_MILESTONE] Updating status on TESTNET: ${TW_ENDPOINT}`);

    const response = await fetch(TW_ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": process.env.TRUSTLESS_WORK_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    
    console.log(`[TW_PROXY_MILESTONE] Status: ${response.status}`);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[TW_PROXY_MILESTONE_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
