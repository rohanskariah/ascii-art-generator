import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export interface AsciiGenerateParams {
  text: string;
  style?: string;
  characterType?: string;
  customPrompt?: string;
}

export interface AsciiGenerateResult {
  ascii: string;
  lineCount: number;
  maxLineWidth: number;
  usedMarkdownFence: boolean;
  geminiDurationMs: number;
}

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

export function logAsciiEvent(
  requestId: string,
  event: string,
  details?: Record<string, string | number | boolean | undefined>,
  prefix = "ascii"
) {
  const timestamp = new Date().toISOString();
  const detailStr = details
    ? Object.entries(details)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join(" ")
    : "";
  console.log(`[${prefix}] ${timestamp} id=${requestId} ${event}${detailStr ? ` ${detailStr}` : ""}`);
}

export async function generateAscii(
  apiKey: string,
  params: AsciiGenerateParams,
  userAgent = "aistudio-build"
): Promise<AsciiGenerateResult> {
  const { text, style, characterType, customPrompt } = params;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": userAgent } },
  });

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

  const model = "gemini-3.5-flash";
  const geminiStartedAt = Date.now();

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction:
        "You are an elite, highly precise ASCII Art Generator. You only output perfectly structured ASCII art banners based on standard input messages and typography requests. You never talk back, answer, or add comments. Every blank space and character counts for monospace font layouts. Maintain pixel-aligned rows.",
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

  const lineCount = cleanedArt ? cleanedArt.split("\n").length : 0;
  const maxLineWidth = cleanedArt
    ? Math.max(...cleanedArt.split("\n").map((line) => line.length))
    : 0;

  return { ascii: cleanedArt, lineCount, maxLineWidth, usedMarkdownFence: Boolean(match), geminiDurationMs };
}
