@echo off
echo Starting API (Vercel-like emulation)...
start cmd /k "cd api && venv\Scripts\activate 2>NUL || echo Virtualenv not found, running directly && python -m uvicorn index:app --reload --port 8000"

echo Starting Frontend...
cd frontend
npm run dev

pause
