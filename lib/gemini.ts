const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma4:31b-cloud";

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
    const prompt =
      "You are an expert agronomist. Analyze this crop image. Respond ONLY in raw JSON with no markdown or backticks: { disease, confidence (0-100 number), caused_by, symptoms, treatment, pesticide, urgency (low/medium/high), recovery_days (number), preventive_measures }";

    const baseUrl = OLLAMA_BASE_URL.replace(/\/$/, "");
    const apiBase = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;

    const response = await fetch(`${apiBase}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        images: [imageBase64],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { response?: string };
    const responseText = data.response ?? "";
    const cleaned = cleanJsonText(responseText);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("[OLLAMA_DIAGNOSE]", error, { mimeType });
    return FALLBACK_DIAGNOSIS;
  }
}
