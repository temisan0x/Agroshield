import { NextResponse } from "next/server";
import { diagnoseCrop } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body ?? {};

    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
    }

    const diagnosis = await diagnoseCrop(imageBase64, mimeType);

    return NextResponse.json({ success: true, diagnosis });
  } catch (error) {
    console.error("[DIAGNOSE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
