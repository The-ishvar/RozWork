# Super Admin Panel Installation Guide

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB (optional; the API also works with its JSON fallback when MongoDB is unavailable)

## 1. Install dependencies

```bash
cd server && npm install
cd ../frontend && npm install
```

## 2. Configure environment variables

Create a `.env` file in the server folder with:

```env
PORT=5000
JWT_SECRET=rozwork-secret
MONGO_URI=mongodb://127.0.0.1:27017/rozwork
CLIENT_URL=http://localhost:5173
```

## 3. Start the backend

```bash
cd server
npm run start
```

## 4. Start the frontend

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

## 5. Sign in as Super Admin

- Mobile Number: 9660585691
- Password: 123456789

## 6. Main capabilities

- JWT-protected super admin authentication
- User management and moderation
- Content management and site settings
- Activity feed, notifications, and analytics cards

## 7. Project structure

```text
server/
  src/
    controllers/
    middleware/
    models/
    routes/
    services/
frontend/
  src/
    components/
    context/
    pages/
```
