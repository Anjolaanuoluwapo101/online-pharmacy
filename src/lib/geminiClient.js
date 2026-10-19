import { gemini } from "./config.js";

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${gemini.model}:generateContent`;

/**
 * Drop every cached extraction. Called when the guided journey seeds a new
 * prescription, so a later re-scan of the same photo can never replay a
 * stale result and hide medicines the seeded slip does not contain.
 */
export function clearExtractionCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("hera_img_"))
      .forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
}

export function parseMedicationArray(content) {
  let text = (content || "").trim();

  text = text.replace(/```(?:json)?/gi, "").trim();

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response:", content);
    throw new Error("AI returned unparseable JSON");
  }

  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const preferred = ["medications", "medicines", "drugs", "items", "results", "data"];
    for (const key of preferred) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
    for (const value of Object.values(parsed)) {
      if (Array.isArray(value)) return value;
    }
  }
  throw new Error("AI returned unrecognized format");
}

export async function extractFromImage(imageDataUrl) {
  const base64 = imageDataUrl.split(",")[1];
  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Extract every medication from this Nigerian prescription image and return a JSON array following this exact schema. Include all fields: medication_name, dosage, frequency (as one of: once daily, twice daily, thrice daily, every 6 hours, every 8 hours, every 12 hours, as needed), duration (e.g. "14 days", "1 month"), route, instructions, and confidence 0-1 for each entry.

If a field cannot be determined, set it to null and confidence to 0.

Schema:
{
  "medication_name": string,
  "dosage": string,
  "frequency": string,
  "duration": string,
  "route": string,
  "instructions": string,
  "confidence": number
}

Return ONLY the JSON array, no surrounding text.`,
          },
          { inlineData: { mimeType: "image/jpeg", data: base64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0, maxOutputTokens: 800 },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(`${ENDPOINT}?key=${gemini.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Gemini returned no content");

    return parseMedicationArray(content);
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("AI request timed out — please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
