"""
Quick diagnostic script: tests the AI search logic directly without running the full server.
Run: conda run -n NN python test_ai_search.py
"""
import asyncio
import os
import json
from dotenv import load_dotenv
load_dotenv()

import httpx

GEMINI_MODEL = "gemini-3-flash-preview"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
TACTICS_DIR = os.path.join(DATA_DIR, "tactics")


def load_catalog():
    catalog = []
    for filename in os.listdir(TACTICS_DIR):
        if not filename.endswith(".json"):
            continue
        with open(os.path.join(TACTICS_DIR, filename), encoding="utf-8") as f:
            data = json.load(f)
        catalog.append({
            "id": data.get("id", filename.replace(".json", "")),
            "name": data.get("name", "Untitled"),
            "category": data.get("category", "Other"),
            "tags": data.get("tags", []),
            "description": (data.get("description") or "")[:200],
        })
    return catalog


async def main():
    api_key = os.getenv("GEMINI_API_KEY", "")
    print(f"API Key loaded: {'YES (' + api_key[:8] + '...)' if api_key else 'NO - missing!'}")

    catalog = load_catalog()
    print(f"Loaded {len(catalog)} tactics from catalog")
    print("First 3 tactics:")
    for t in catalog[:3]:
        print(f"  id={t['id']} | name={t['name']} | tags={t['tags'][:3]}")

    query = "pick and roll offense"
    catalog_json = json.dumps(catalog, ensure_ascii=False)

    prompt = f"""You are an expert basketball coach.

USER QUERY: "{query}"

TACTIC DATABASE ({len(catalog)} tactics):
{catalog_json}

Return the top 5 most relevant tactics as a JSON array:
[
  {{
    "tactic_id": "the-tactic-id",
    "score": 85,
    "reason": "1-2 sentence recommendation reason"
  }}
]

If none are relevant, return: []"""

    print(f"\nSending request to Gemini model: {GEMINI_MODEL}")
    print(f"Prompt length: {len(prompt)} chars")

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{GEMINI_URL}?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": 4096,
                },
            },
        )
        print(f"\nHTTP Status: {resp.status_code}")
        data = resp.json()

        # Show full response structure
        print(f"\nFull response keys: {list(data.keys())}")

        if "error" in data:
            print(f"ERROR from Gemini: {data['error']}")
            return

        candidates = data.get("candidates", [])
        print(f"Candidates: {len(candidates)}")

        if candidates:
            c0 = candidates[0]
            print(f"FinishReason: {c0.get('finishReason')}")
            parts = c0.get("content", {}).get("parts", [])
            print(f"Parts count: {len(parts)}")
            if parts:
                text = parts[0].get("text", "")
                print(f"\nGemini raw text output ({len(text)} chars):")
                print("-" * 60)
                print(text[:2000])
                print("-" * 60)
            else:
                print("NO TEXT in parts!")
                print(f"Full candidate: {json.dumps(c0, indent=2)[:1000]}")


asyncio.run(main())
