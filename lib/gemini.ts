import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

const FALLBACK_DIAGNOSIS = {
  disease: "Analysis Error",
  confidence: 0,
  caused_by: "unknown",
  symptoms: "unknown",
  treatment: "unknown",
  pesticide: "unknown",
  urgency: "low",
  recovery_days: 0,
  preventive_measures: "unknown",
};

function cleanJsonText(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

export async function diagnoseCrop(imageBase64: string, mimeType = "image/jpeg") {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt =
      "You are an expert agronomist. Analyze this crop image. Respond ONLY in raw JSON with no markdown or backticks: { disease, confidence (0-100 number), caused_by, symptoms, treatment, pesticide, urgency (low/medium/high), recovery_days (number), preventive_measures }";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ]);

    const responseText = result.response.text();
    const cleaned = cleanJsonText(responseText);
    return JSON.parse(cleaned);
  } catch {
    return FALLBACK_DIAGNOSIS;
  }
}
