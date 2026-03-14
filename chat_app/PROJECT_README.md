High-fidelity chat app scaffold

Structure:
- backend/: FastAPI + Socket.IO + SQLAlchemy + Beanie models
- frontend/: React + Zustand + Tailwind + Framer Motion

Quick run (dev):

Backend (create virtualenv, install requirements):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate; pip install -r backend/requirements.txt; uvicorn chat_app.backend.app.main:app --reload
```

Frontend (from frontend folder):

```powershell
npm install; npm start
```

Notes: This scaffold focuses on architecture and key components; replace storage upload stubs with S3/Cloudinary code and secure authentication for production.
