import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function logAsciiEvent(
  requestId: string,
  event: string,
  details?: Record<string, string | number | boolean | undefined>
) {
  const timestamp = new Date().toISOString();
  const detailStr = details
    ? Object.entries(details)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join(" ")
    : "";
  console.log(`[ascii-vercel] ${timestamp} id=${requestId} ${event}${detailStr ? ` ${detailStr}` : ""}`);
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  const requestStartedAt = Date.now();

  // Handle bodies parsed both as object or string (depending on middleware/parser)
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      // Keep it as is
    }
  }

  try {
    const { text, style, characterType, customPrompt } = body || {};

    logAsciiEvent(requestId, "request_received", {
      text: text?.trim(),
      style: style || "block",
      characterType: characterType || "simple",
      hasCustomPrompt: Boolean(customPrompt?.trim()),
      customPromptLength: customPrompt?.trim().length || 0,
    });

    if (!text || text.trim().length === 0) {
      logAsciiEvent(requestId, "request_rejected", {
        reason: "missing_text",
        duration: formatDuration(Date.now() - requestStartedAt),
      });
      return res.status(400).json({ error: "Text is required to generate ASCII art." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logAsciiEvent(requestId, "request_rejected", {
        reason: "missing_api_key",
        duration: formatDuration(Date.now() - requestStartedAt),
      });
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not defined in your Vercel Project Settings page. Please go to your Vercel Project Dashboard -> Settings -> Environment Variables, and add GEMINI_API_KEY." 
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-vercel',
        }
      }
    });

    const prompt = `Create a high-quality, professional, beautifully aligned ASCII art representing the text: "${text}".

Style selection requirements:
- Style: ${style || 'block'} (Draw using this style. For example: Slant style has elegant slanting; Block uses large filled rectangular letter formations; Bubble uses hollow rounded circular shapes; Thin uses solid single-character line layouts; Gothic uses complex gothic angular shapes; 3D uses simulated box projections; Shadow has a drop-shadow offset; Cyberpunk utilizes dynamic angles and grid-like lines).
- Character mapping: ${characterType || 'simple'} (E.g., simple uses standard hashes and slashes like #, /, \\, -; blocks uses rich thick block characters such as █, ▓, ▒, ░; classic uses symbols like @, %, $, +, =; binary uses only 0 and 1; letters uses standard letters aligned in visual matrices).

Additional context or prompt customization: ${customPrompt || 'None'}

CRITICAL GUIDELINES FOR THE GENERATION:
1. Output ONLY the raw ASCII art diagram. No friendly introductions, no explanations, no details about columns or rows, and no terminal greetings before or after the art.
2. Ensure each row has identical vertical spacing padding and fits nicely. Align everything perfectly as monospace text.
3. If the user input is very long, make sure the generated letters are scaled down horizontally so that the text does not wrap awkwardly on standard screens (maximum 80 characters of wrapping).
4. Put the generated ASCII art inside standard markdown block syntax with "\`\`\`" or "\`\`\`text" to ensure response delivery structure. Do not output anything else.`;

    const model = "gemini-3.5-flash";
    logAsciiEvent(requestId, "gemini_call_started", {
      model,
      promptLength: prompt.length,
    });
    const geminiStartedAt = Date.now();

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, highly precise ASCII Art Generator. You only output perfectly structured ASCII art banners based on standard input messages and typography requests. You never talk back, answer, or add comments. Every blank space and character counts for monospace font layouts. Maintain pixel-aligned rows.",
        temperature: 0.15,
      }
    });

    const geminiDurationMs = Date.now() - geminiStartedAt;
    let rawOutput = response.text || "";

    logAsciiEvent(requestId, "gemini_call_completed", {
      model,
      duration: formatDuration(geminiDurationMs),
      rawOutputLength: rawOutput.length,
    });

    // Parse and extract the actual ASCII art from possible markdown code boundaries
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

    const lineCount = cleanedArt ? cleanedArt.split("\n").length : 0;
    const maxLineWidth = cleanedArt
      ? Math.max(...cleanedArt.split("\n").map((line) => line.length))
      : 0;

    logAsciiEvent(requestId, "response_sent", {
      status: 200,
      cleanedOutputLength: cleanedArt.length,
      lineCount,
      maxLineWidth,
      usedMarkdownFence: Boolean(match),
      geminiDuration: formatDuration(geminiDurationMs),
      totalDuration: formatDuration(Date.now() - requestStartedAt),
    });

    return res.status(200).json({
      ascii: cleanedArt,
      success: true
    });

  } catch (error: any) {
    console.error(`[ascii-vercel] id=${requestId} Vercel Serverless ASCII error:`, error);
    logAsciiEvent(requestId, "request_failed", {
      duration: formatDuration(Date.now() - requestStartedAt),
      error: error?.message || "unknown_error",
    });
    return res.status(500).json({ 
      error: error?.message || "Internal server error occurred when invoking Gemini on Vercel." 
    });
  }
}
