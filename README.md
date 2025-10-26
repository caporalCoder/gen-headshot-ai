# Gen Headshot AI

Generate professional-looking headshots from a single photo using Google Gemini, right in the browser. Pick from six curated styles and get three high‑quality variations per style. Built with Vite + React.

## Features

- Drag-and-drop image upload (JPG/PNG, up to 5MB)
- Six preset styles: Corporate Classic, Creative Professional, Editorial Portrait, Tech Visionary, Celebrity Glamour, Artistic Rebel
- Three variations per selected style
- Client-side generation via Google Gemini 2.5 Flash Image
- Download a single result or all three at once

## Quick Start

Prerequisites:
- Node.js 18+ (Node 20 recommended)
- An API key for Google Gemini

1) Install dependencies

```
npm i
```

2) Provide your Gemini API key

You can provide your key in either of the following ways:
- Create a `.env` file at the project root and set `VITE_GEMINI_API_KEY`.
- Or, store it in your browser’s localStorage under `GEMINI_API_KEY` (useful for quick local testing).

Example `.env`:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

Security note: When set in `.env` for a client-only app, the key is bundled and accessible in the browser. For production, restrict the key appropriately (e.g., by HTTP referrer/domain) or proxy requests through a backend you control.

3) Start the dev server

```
npm run dev
```

The app runs on `http://localhost:3000` (configured in `vite.config.ts`).

## Build

```
npm run build
```

Production assets are emitted to the `build` directory.

## Configuration

- Vite config: `vite.config.ts`
- Port: `3000` (dev server opens browser automatically)
- Main entry: `src/main.tsx`
- App root component: `src/App.tsx`

## How It Works

- The browser reads your uploaded image, then calls the Google Gemini API via `@google/genai` using your API key.
- The generation logic lives in `src/local/genai.ts` and uses `gemini-2.5-flash-image` with three variation prompts.
- Style prompts are defined in `src/prompts.ts`.

Note: Your uploaded image is sent to the Gemini API for generation (there is no custom server in this project).

## Attributions

See `src/Attributions.md` for licenses and credits, including:
- UI components based on shadcn/ui (MIT)
- Photos from Unsplash (Unsplash License)

## Contributing

Issues and PRs are welcome. If you plan a larger change, please open an issue first to discuss the approach.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
