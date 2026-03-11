from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from nba_api.stats.static import players as nba_players_static
from nba_api.stats.endpoints import commonplayerinfo, playercareerstats
from datetime import datetime

from fetch_shot_chart import fetch_player_shot_chart

router = APIRouter(prefix="/api/players", tags=["Players"])
# We also have an endpoint for /shotchart/{player_name} which we can put here.
shotchart_router = APIRouter(prefix="/shotchart", tags=["Shotchart"])

@router.get("/search")
async def search_players(name: str):
    try:
        all_players = nba_players_static.get_players()
        results = [
            {
                "id": p['id'],
                "name": p['full_name'],
                "team": "NBA", # Placeholder
                "position": "Unknown", # Placeholder
                "photoUrl": f"https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/{p['id']}.png",
                "isActive": p['is_active']
            }
            for p in all_players if name.lower() in p['full_name'].lower()
        ]
        return results[:10] # Limit to 10 results
    except Exception as e:
        print(f"Error searching players: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{player_id}/stats")
async def get_player_stats(player_id: int):
    try:
        # Fetch basic info
        info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        data = info.get_dict()['resultSets'][0]['rowSet'][0]
        headers = info.get_dict()['resultSets'][0]['headers']
        player_info = dict(zip(headers, data))
        
        career = playercareerstats.PlayerCareerStats(player_id=player_id)
        career_df = career.get_data_frames()[0]
        
        print(f"Fetching stats for player {player_id}")
        
        stats = {
            "ppg": "-", "rpg": "-", "apg": "-", 
            "fg_pct": "-", "fg2_pct": "-", "fg3_pct": "-"
        }
        
        if not career_df.empty:
            latest = career_df.iloc[-1]
            
            gp = latest['GP']
            if gp > 0:
                stats['ppg'] = round(latest['PTS'] / gp, 1)
                stats['rpg'] = round(latest['REB'] / gp, 1)
                stats['apg'] = round(latest['AST'] / gp, 1)
                stats['fg_pct'] = round(latest['FG_PCT'] * 100, 1)
                stats['fg3_pct'] = round(latest['FG3_PCT'] * 100, 1)
                
                # Calculate 2PT%
                fg2m = latest['FGM'] - latest['FG3M']
                fg2a = latest['FGA'] - latest['FG3A']
                if fg2a > 0:
                    stats['fg2_pct'] = round((fg2m / fg2a) * 100, 1)
        
        print(f"Returning stats: {stats}")

        # Calculate age
        age = "N/A"
        birthdate_str = player_info.get('BIRTHDATE', '')
        if birthdate_str:
            try:
                # Format is usually YYYY-MM-DDTHH:MM:SS
                birthdate = datetime.strptime(birthdate_str[:10], "%Y-%m-%d")
                today = datetime.today()
                age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
            except Exception as e:
                print(f"Error calculating age: {e}")

        return {
            "height": player_info.get('HEIGHT', ''),
            "weight": player_info.get('WEIGHT', ''),
            "position": player_info.get('POSITION', ''),
            "team": player_info.get('TEAM_ABBREVIATION', ''),
            "jersey": player_info.get('JERSEY', ''),
            "age": str(age),
            "stats": stats
        }
    except Exception as e:
        print(f"Error fetching player stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@shotchart_router.get("/{player_name}")
async def get_shot_chart(player_name: str):
    try:
        chart_data = fetch_player_shot_chart(player_name)
        if chart_data is None:
            raise HTTPException(status_code=404, detail="Player not found or no data")
        
        # Convert DataFrame to JSON-friendly format (records)
        result = chart_data.to_dict(orient='records')
        return result
    except Exception as e:
        print(f"Error fetching shot chart: {e}")
        raise HTTPException(status_code=500, detail=str(e))
