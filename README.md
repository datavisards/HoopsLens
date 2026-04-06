# HoopsLens
[![Demo: HoopsLens](https://img.shields.io/badge/Demo-hoopslens.vercel.app-success)](https://hoopslens.vercel.app/)

HoopsLens is an interactive basketball tactics and lineup analysis tool that captures and operationalizes tactical design behavior. Using in-situ (inside the tactics board) and ex-situ (in external analysis panels) visualization and AI techniques, HoopsLens provides real-time feedback to help users reflect on play structure, role assignments, and lineup compatibility. For example, HoopsLens maps frame-level action tags to Synergy-style dimensions and compares tactic demand with lineup supply to surface fit gaps and substitution suggestions.

This codebase comprises an easy-to-extend <a href="https://react.dev/" target="_blank">React</a> frontend and a <a target="_blank" href="https://www.python.org/downloads/release/python-310/">Python 3.10+</a>, <a target="_blank" href="https://fastapi.tiangolo.com/">FastAPI</a>, <a target="_blank" href="https://www.uvicorn.org/">Uvicorn</a> backend with an API for player lookup, tactics library CRUD, AI semantic tactic search, and lineup diagnostics over HTTP REST.


## Setup
Instructions can be found in the following sub-directories:
- [frontend](frontend) (frontend)
- [backend](backend) (backend)

### Local Deploy (Quick Start)
Open 2 terminals and run:

1. Backend (Terminal A)

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# edit .env and set GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

2. Frontend (Terminal B)

```bash
cd frontend
npm install
npm run dev
```

3. Open in browser
- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/health


## Credits
HoopsLens is maintained by DataVisards contributors.


### Citation


## Local Deployment Notes
- This README documents local deployment only.
- For production server deployment (Nginx + systemd + HTTPS), see [DIGITALOCEAN_DEPLOYMENT.md](DIGITALOCEAN_DEPLOYMENT.md).


## License
The software is available under the [MIT License](LICENSE).


## Contact
If you have any questions, feel free to [open an issue](https://github.com/datavisards/HoopsLens/issues/new/choose) or contact [Jianheng Ouyang](mailto:leon4591963565@gmail.com).
