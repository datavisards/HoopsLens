# HoopsLens: Interactive Basketball Tactics and Lineup Fit Analysis

HoopsLens is a research-oriented basketball tactics system that converts 2D coaching-board actions into structured playtype demand vectors, then evaluates lineup-tactic compatibility with a constrained intersection metric.

## Links
- Repository: https://github.com/datavisards/HoopsLens
- Live Demo: https://hoopslens.vercel.app/

## Methods (Summary)
- Action-to-playtype mapping: Canvas gestures are mapped to Synergy-style offensive dimensions (e.g., PnR_BH, PnR_RM, Spot_Up, Off_Screen, Cut, Isolation).
- Demand estimation: Tactic demand is computed from the normalized frequency of tagged actions across frames.
- Supply estimation: Lineup supply is estimated from role priors with positional decay for overlapping on-ball responsibilities.
- Fit scoring: Histogram-intersection style fulfillment score:
	- fit = sum(min(demand_k, supply_k)) / sum(demand_k)

## Tech Stack
- Frontend: React, TypeScript, Vite, Konva
- Backend: Python, FastAPI

## Configuration
1. Copy `backend/.env.example` to `backend/.env`.
2. Set `GEMINI_API_KEY` (default provider).
3. Optional: set `OPENAI_API_KEY` / `DEEPSEEK_API_KEY`.

## Local Run
1. Backend: `cd backend` then `pip install -r requirements.txt` then `uvicorn main:app --reload --port 8000`
2. Frontend: `cd frontend` then `npm install` then `npm run dev`
