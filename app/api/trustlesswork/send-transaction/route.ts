import { NextResponse, type NextRequest } from "next/server";

const TW_ENDPOINT = "https://dev.api.trustlesswork.com/helper/send-transaction";

export async function POST(request: NextRequest) {
  try {
    const { signedXdr } = await request.json();
    if (!signedXdr) {
      return NextResponse.json({ error: "signedXdr is required" }, { status: 400 });
    }

    if (!process.env.TRUSTLESS_WORK_API_KEY) {
      return NextResponse.json(
        { error: "TRUSTLESS_WORK_API_KEY is missing on the server" },
        { status: 500 }
      );
    }

    console.log(`[TW_PROXY_TX] Broadcasting to TESTNET: ${TW_ENDPOINT}`);

    const response = await fetch(TW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.TRUSTLESS_WORK_API_KEY,
      },
      body: JSON.stringify({ signedXdr }),
    });

    const data = await response.json().catch(() => ({}));
    
    console.log(`[TW_PROXY_TX] Status: ${response.status}`);
    console.log(`[TW_PROXY_TX] Response: ${JSON.stringify(data)}`);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[TW_PROXY_TX_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
