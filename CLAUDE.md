# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Express + Vite middleware) on http://localhost:3000
npm run build    # Build frontend with Vite + bundle backend with esbuild → dist/
npm start        # Run production build (requires npm run build first)
npm run lint     # TypeScript type-check only (no test suite)
```

There is no test framework. `npm run lint` (`tsc --noEmit`) is the only automated correctness check.

## Environment Setup

Requires a `.env.local` file with:
```
GEMINI_API_KEY=your_key_here
```

## Architecture

**Full-stack in a single repo:** `server.ts` is an Express app that in development acts as a thin wrapper around Vite's dev server (via `vite.middlewareMode`). In production it serves the compiled `dist/` output. Both modes expose `/api/ascii` (POST) and `/api/health` (GET).

**Data flow:**
1. `src/App.tsx` collects user input (text, style, character type, custom prompt)
2. Calls `src/services/apiService.ts`, which POSTs to `/api/ascii` (localhost:3000 in dev, relative path in prod)
3. `server.ts` constructs a prompt and calls Gemini (`gemini-3.5-flash`) via `@google/genai` SDK
4. Response is cleaned (markdown fences stripped) and returned as `{ ascii, success }`
5. Art is displayed in a `<pre>` block and appended to `localStorage` history

**Key files:**
- `server.ts` — Express server, Gemini API call, prompt construction, markdown-fence stripping
- `src/App.tsx` — Entire frontend UI as a single component (no sub-components)
- `src/services/apiService.ts` — HTTP client; handles dev vs prod URL routing
- `src/services/pngService.ts` — Canvas-based PNG export (black text on white, monospace 16px)
- `src/data.ts` — Static config: `STYLE_OPTIONS`, `CHARACTER_OPTIONS`, `PRESET_PHRASES`, `INITIAL_WELCOME_ART`
- `src/types.ts` — `AsciiStyle`, `CharacterType`, `AsciiArtItem` interfaces

**State persistence:** History (`ascii_art_history`) and custom color (`custom_color`) are stored in `localStorage`. No backend persistence.

**Styling:** Tailwind CSS v4 loaded via `@tailwindcss/vite` plugin (no `tailwind.config.js`). Theme colors are hardcoded Tailwind JIT arbitrary-value classes (e.g. `text-[#D4AF37]`). The `motion` package (not `framer-motion`) is used for history card animations.

## Gemini Integration Notes

- Model: `gemini-3.5-flash` with `ThinkingLevel.MINIMAL` and `temperature: 0.15`
- The prompt instructs Gemini to wrap output in triple-backtick fences; `server.ts` then strips them
- All logging uses the `logAsciiEvent` helper which writes structured `key=value` lines to stdout
