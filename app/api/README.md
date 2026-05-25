FastAPI backend

Setup:

1. Create a venv: `python -m venv .venv`
2. Install dependencies: `.venv\\Scripts\\pip.exe install -r requirements.txt`
3. Run dev server: `.venv\\Scripts\\uvicorn.exe main:app --reload --host 0.0.0.0 --port 8000`

API endpoints:
- `GET /api/health` - returns {"status":"ok"}
- `GET /api/items/{item_id}` - sample item
