# RozWork

RozWork is a production-ready local employment marketplace with a React frontend and an Express backend.

## Stack
- Frontend: React + React Router + Tailwind + Axios + React Hook Form
- Backend: Node.js + Express + JWT + bcrypt + MongoDB-ready API

## Run locally

### Backend
```bash
cd server
npm install
cp .env.example .env
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend on http://localhost:5000/api.
