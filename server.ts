import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { generateAscii, formatDuration, logAsciiEvent } from "./src/services/asciiService";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

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
      logAsciiEvent(requestId, "request_rejected", { reason: "missing_text", duration: formatDuration(Date.now() - requestStartedAt) });
      return res.status(400).json({ error: "Text is required to generate ASCII art." });
    }

    if (!process.env.GEMINI_API_KEY) {
      logAsciiEvent(requestId, "request_rejected", { reason: "missing_api_key", duration: formatDuration(Date.now() - requestStartedAt) });
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not set." });
    }

    logAsciiEvent(requestId, "gemini_call_started");
    const result = await generateAscii(process.env.GEMINI_API_KEY, { text, style, characterType, customPrompt });

    logAsciiEvent(requestId, "response_sent", {
      status: 200,
      cleanedOutputLength: result.ascii.length,
      lineCount: result.lineCount,
      maxLineWidth: result.maxLineWidth,
      usedMarkdownFence: result.usedMarkdownFence,
      geminiDuration: formatDuration(result.geminiDurationMs),
      totalDuration: formatDuration(Date.now() - requestStartedAt),
    });

    res.json({ ascii: result.ascii, success: true });

  } catch (error: any) {
    console.error(`[ascii] id=${requestId} Express ASCII endpoint error:`, error);
    logAsciiEvent(requestId, "request_failed", { duration: formatDuration(Date.now() - requestStartedAt), error: error?.message || "unknown_error" });
    res.status(500).json({ error: error?.message || "Internal server error occurred when invoking Gemini GenAI." });
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
