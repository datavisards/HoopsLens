from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from dotenv import load_dotenv
import uvicorn

load_dotenv()

from routers import players, epv, tactics, ai_diagnostics

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(players.router)
app.include_router(players.shotchart_router)
app.include_router(epv.router)
app.include_router(tactics.router)
app.include_router(ai_diagnostics.router)

@app.get('/')
async def root():
    return {'message': 'Basketball Tactics Board Backend is running'}

@app.get('/health')
async def health_check():
    return {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }

if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)
