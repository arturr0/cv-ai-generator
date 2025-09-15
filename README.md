# CV Generator (Next.js + Express)

## Features
- Integrated Express backend with Next.js frontend on a single port.
- Job search endpoint using Jooble (requires JOOBLE_API_KEY).
- Ollama integration to customize CVs (requires Ollama running or change to your LLM).
- Saves generated CVs as TXT and PDF in `public/cvs`.

## Setup
1. Copy `.env.example` to `.env` and fill values.
2. Install:
   ```
   npm install
   ```
3. Run in development:
   ```
   npm run dev
   ```
4. Open http://localhost:3000

## Notes
- This project expects Ollama API at `OLLAMA_API_URL`. If you don't use Ollama, you can stub `queryOllama`.
