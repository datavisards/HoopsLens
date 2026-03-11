from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
import json
from uuid import uuid4
from datetime import datetime

router = APIRouter(prefix="/api/tactics", tags=["Tactics"])

# --- Tactics Library Config ---
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
TACTICS_DIR = os.path.join(DATA_DIR, 'tactics')
os.makedirs(TACTICS_DIR, exist_ok=True)

class TacticExternalLinks(BaseModel):
    video: Optional[str] = None
    article: Optional[str] = None

class TacticMetadata(BaseModel):
    id: str
    name: str = "Untitled Tactic"
    category: str = "Strategy & Concepts"
    sub_category: Optional[str] = None
    description: str = ""
    tags: List[str] = []
    playtypes: List[Dict[str, str]] = []
    external_links: TacticExternalLinks = Field(default_factory=TacticExternalLinks)
    preview_image: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Tactic(TacticMetadata):
    animation_data: Dict[str, Any] = {}

def auto_categorize(name: str) -> str:
    lower_name = name.lower()
    if "offense" in lower_name or "pick" in lower_name or "iso" in lower_name:
        return "Offense"
    if "defense" in lower_name or "zone" in lower_name or "press" in lower_name:
        return "Defense"
    return "Other"

@router.get("", response_model=List[TacticMetadata])
async def get_tactics_list():
    tactics = []
    try:
        if os.path.exists(TACTICS_DIR):
            for filename in os.listdir(TACTICS_DIR):
                if filename.endswith(".json"):
                    file_path = os.path.join(TACTICS_DIR, filename)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            
                        if "animation_data" in data or "id" in data:
                            tactic = TacticMetadata(
                                id=data.get("id", filename.replace(".json", "")),
                                name=data.get("name", "Untitled"),
                                category=data.get("category", auto_categorize(data.get("name", ""))),
                                sub_category=data.get("sub_category"),
                                description=data.get("description", ""),
                                tags=data.get("tags", []),
                                playtypes=data.get("playtypes", []),
                                external_links=data.get("external_links", {}),
                                preview_image=data.get("preview_image"),
                                created_at=data.get("created_at"),
                                updated_at=data.get("updated_at")
                            )
                        else:
                            meta = data.get("meta", {})
                            name = meta.get("name", filename.replace(".json", "").replace("_", " ").title())
                            tactic = TacticMetadata(
                                id=filename.replace(".json", ""),
                                name=name,
                                category=auto_categorize(name),
                                sub_category="Concept",
                                description=meta.get("description", ""),
                                tags=[],
                                playtypes=[],
                                external_links={},
                                preview_image=None
                            )
                        tactics.append(tactic)
                    except Exception as e:
                        print(f"Error loading custom tactic {filename}: {e}")
    except Exception as e:
        print(f"Error scanning tactics directory: {e}")

    return tactics

@router.get("/{tactic_id}")
async def get_tactic_detail(tactic_id: str):
    try:
        file_path = os.path.join(TACTICS_DIR, f"{tactic_id}.json")
        
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            if "animation_data" not in data and "frames" in data:
                meta = data.get("meta", {})
                name = meta.get("name", tactic_id.replace("_", " ").title())
                
                return {
                    "id": tactic_id,
                    "name": name,
                    "category": auto_categorize(name),
                    "sub_category": "Concept",
                    "description": meta.get("description", ""),
                    "tags": [],
                    "playtypes": [],
                    "external_links": {},
                    "preview_image": None,
                    "animation_data": data 
                }
            return data

        raise HTTPException(status_code=404, detail="Tactic not found")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading tactic detail: {str(e)}")

@router.post("")
async def save_tactic(request: Dict[str, Any]):
    try:
        tactic_data = request

        if not isinstance(tactic_data.get("tags", []), list):
            tactic_data["tags"] = []
        if not isinstance(tactic_data.get("playtypes", []), list):
            tactic_data["playtypes"] = []
        
        if "id" not in tactic_data or not tactic_data["id"]:
            tactic_data["id"] = str(uuid4())
            
        tactic_data["updated_at"] = datetime.utcnow().isoformat()
        if "created_at" not in tactic_data:
             tactic_data["created_at"] = datetime.utcnow().isoformat()
             
        file_path = os.path.join(TACTICS_DIR, f"{tactic_data['id']}.json")
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(tactic_data, f, indent=2)
            
        return {"id": tactic_data["id"], "message": "Tactic saved successfully"}
    except Exception as e:
        print(f"Error saving tactic: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tactic_id}")
async def delete_tactic(tactic_id: str):
    try:
        file_path = os.path.join(TACTICS_DIR, f"{tactic_id}.json")
        if os.path.exists(file_path):
            os.remove(file_path)
            return {"message": "Tactic deleted"}
        raise HTTPException(status_code=404, detail="Tactic not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
