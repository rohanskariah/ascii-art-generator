import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

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
  try {
    const { text, style, characterType, customPrompt } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required to generate ASCII art." });
    }

    if (!process.env.GEMINI_API_KEY) {
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, highly precise ASCII Art Generator. You only output perfectly structured ASCII art banners based on standard input messages and typography requests. You never talk back, answer, or add comments. Every blank space and character counts for monospace font layouts. Maintain pixel-aligned rows.",
        temperature: 0.15,
      }
    });

    let rawOutput = response.text || "";

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

    res.json({
      ascii: cleanedArt,
      success: true
    });

  } catch (error: any) {
    console.error("Express ASCII endpoint error:", error);
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
