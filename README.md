# HoopsLens
[![Demo: HoopsLens](https://img.shields.io/badge/Demo-hoopslens.vercel.app-success)](https://hoopslens.vercel.app/)

HoopsLens is an interactive basketball tactics and lineup analysis tool that captures and operationalizes tactical design behavior. Using in-situ (inside the tactics board) and ex-situ (in external analysis panels) visualization and AI techniques, HoopsLens provides real-time feedback to help users reflect on play structure, role assignments, and lineup compatibility. For example, HoopsLens maps frame-level action tags to Synergy-style dimensions and compares tactic demand with lineup supply to surface fit gaps and substitution suggestions.

This codebase comprises an easy-to-extend <a href="https://react.dev/" target="_blank">React</a> frontend and a <a target="_blank" href="https://www.python.org/downloads/release/python-310/">Python 3.10+</a>, <a target="_blank" href="https://fastapi.tiangolo.com/">FastAPI</a>, <a target="_blank" href="https://www.uvicorn.org/">Uvicorn</a> backend with an API for player lookup, tactics library CRUD, AI semantic tactic search, and lineup diagnostics over HTTP REST.


## Setup
Instructions can be found in the following sub-directories:
- [frontend](frontend) (frontend)
- [backend](backend) (backend)

### Local Setup (Run on your machine)
1. Start backend

```bash
cd backend
python -m venv .venv
```

Activate environment:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

Install dependencies and create env file:

```bash
pip install -r requirements.txt
```

Copy environment template:

```bash
# Windows CMD
copy .env.example .env

# PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Set your API key in .env:
- GEMINI_API_KEY (required for AI search and lineup diagnosis)

Run backend:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

2. Start frontend in another terminal

```bash
cd frontend
npm install
npm run dev
```

3. Verify local services
- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/health
- Local API base URL is configured in [frontend/.env.development](frontend/.env.development)


## Credits
HoopsLens is maintained by DataVisards contributors.


### Citation


## Local Deployment Notes
- This README documents local deployment only.
- For production server deployment (Nginx + systemd + HTTPS), see [DIGITALOCEAN_DEPLOYMENT.md](DIGITALOCEAN_DEPLOYMENT.md).


## License
The software is available under the [MIT License](LICENSE).


## Contact
If you have any questions, feel free to [open an issue](https://github.com/datavisards/HoopsLens/issues/new/choose) or contact Jianheng Ouyang at [leon4591963565@gmai.com](mailto:leon4591963565@gmai.com).
