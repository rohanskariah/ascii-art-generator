import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = 3000;

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
  console.log(`[ascii] ${timestamp} id=${requestId} ${event}${detailStr ? ` ${detailStr}` : ""}`);
}

app.use(express.json());

// Initialize the newly supported Gemini SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Main endpoint to generate ASCII Art
app.post("/api/ascii", async (req, res) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const requestStartedAt = Date.now();

  try {
    const { text, style, characterType, customPrompt } = req.body;

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

    if (!process.env.GEMINI_API_KEY) {
      logAsciiEvent(requestId, "request_rejected", {
        reason: "missing_api_key",
        duration: formatDuration(Date.now() - requestStartedAt),
      });
      return res.status(500).json({ 
        error: "GEMINI_API_KEY environment variable is not set. Please check the Secrets panel in the AI Studio UI." 
      });
    }

    // Dynamic prompts indicating fonts and formatting properties
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
      model,
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
      // Inline cleaning fallback
      cleanedArt = rawOutput
        .replace(/^```[a-zA-Z0-9_-]*\n/g, "")
        .replace(/\n```$/g, "")
        .replace(/^```/g, "")
        .replace(/```$/g, "");
    }

    // Strip leading/trailing empty lines if excessive
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

    res.json({
      ascii: cleanedArt,
      success: true
    });

  } catch (error: any) {
    logAsciiEvent(requestId, "request_failed", {
      duration: formatDuration(Date.now() - requestStartedAt),
      error: error?.message || "unknown_error",
    });
    console.error(`[ascii] id=${requestId} Express ASCII endpoint error:`, error);
    res.status(500).json({ 
      error: error?.message || "Internal server error occurred when invoking Gemini GenAI." 
    });
  }
});

// Configure Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
