import { GoogleGenAI, ThinkingConfig, ThinkingLevel } from "@google/genai";
import crypto from "crypto";

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function log(requestId: string, event: string, details?: Record<string, string | number | boolean | undefined>) {
  const timestamp = new Date().toISOString();
  const detailStr = details
    ? Object.entries(details)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ")
    : "";
  console.log(`[ascii-vercel] ${timestamp} id=${requestId} ${event}${detailStr ? ` ${detailStr}` : ""}`);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  const requestId = crypto.randomUUID().slice(0, 8);
  const requestStartedAt = Date.now();

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { /* keep as-is */ }
  }

  try {
    const { text, style, characterType, customPrompt } = body || {};

    log(requestId, "request_received", {
      text: text?.trim(),
      style: style || "block",
      characterType: characterType || "simple",
      hasCustomPrompt: Boolean(customPrompt?.trim()),
    });

    if (!text || text.trim().length === 0) {
      log(requestId, "request_rejected", { reason: "missing_text" });
      return res.status(400).json({ error: "Text is required to generate ASCII art." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      log(requestId, "request_rejected", { reason: "missing_api_key" });
      return res.status(500).json({ error: "GEMINI_API_KEY is not defined. Add it in Vercel Project Settings → Environment Variables." });
    }

    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build-vercel" } } });

    const prompt = `Create a high-quality, professional, beautifully aligned ASCII art representing the text: "${text}".

Style selection requirements:
- Style: ${style || "block"} (Draw using this style. For example: Slant style has elegant slanting; Block uses large filled rectangular letter formations; Bubble uses hollow rounded circular shapes; Thin uses solid single-character line layouts; Gothic uses complex gothic angular shapes; 3D uses simulated box projections; Shadow has a drop-shadow offset; Cyberpunk utilizes dynamic angles and grid-like lines).
- Character mapping: ${characterType || "simple"} (E.g., simple uses standard hashes and slashes like #, /, \\, -; blocks uses rich thick block characters such as █, ▓, ▒, ░; classic uses symbols like @, %, $, +, =; binary uses only 0 and 1; letters uses standard letters aligned in visual matrices).

Additional context or prompt customization: ${customPrompt || "None"}

CRITICAL GUIDELINES FOR THE GENERATION:
1. Output ONLY the raw ASCII art diagram. No friendly introductions, no explanations, no details about columns or rows, and no terminal greetings before or after the art.
2. Ensure each row has identical vertical spacing padding and fits nicely. Align everything perfectly as monospace text.
3. If the user input is very long, make sure the generated letters are scaled down horizontally so that the text does not wrap awkwardly on standard screens (maximum 80 characters of wrapping).
4. Put the generated ASCII art inside standard markdown block syntax with "\`\`\`" or "\`\`\`text" to ensure response delivery structure. Do not output anything else.
5. Output exactly ONE rendering of the text. Do not repeat, duplicate, or show the text in multiple styles.`;

    log(requestId, "gemini_call_started");
    const geminiStartedAt = Date.now();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, highly precise ASCII Art Generator. You only output perfectly structured ASCII art banners based on standard input messages and typography requests. You never talk back, answer, or add comments. Every blank space and character counts for monospace font layouts. Maintain pixel-aligned rows.",
        temperature: 0.15,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    });

    const geminiDurationMs = Date.now() - geminiStartedAt;
    let rawOutput = response.text || "";

    let cleanedArt = rawOutput;
    const blockRegex = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)\n```/;
    const match = rawOutput.match(blockRegex);
    if (match) {
      cleanedArt = match[1];
    } else {
      cleanedArt = rawOutput
        .replace(/^```[a-zA-Z0-9_-]*\n/g, "")
        .replace(/\n```$/g, "")
        .replace(/^```/g, "")
        .replace(/```$/g, "");
    }
    cleanedArt = cleanedArt.trimRight();

    log(requestId, "response_sent", {
      geminiDuration: formatDuration(geminiDurationMs),
      totalDuration: formatDuration(Date.now() - requestStartedAt),
      lineCount: cleanedArt.split("\n").length,
    });

    return res.status(200).json({ ascii: cleanedArt, success: true });

  } catch (error: any) {
    console.error(`[ascii-vercel] id=${requestId} error:`, error);
    log(requestId, "request_failed", { error: error?.message || "unknown_error", duration: formatDuration(Date.now() - requestStartedAt) });
    return res.status(500).json({ error: error?.message || "Internal server error." });
  }
}
