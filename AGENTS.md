# AGENTS instructions for Roz

## Project overview

- This repo is a monorepo with three app surfaces:
  - frontend/ for the React + Vite web app
  - server/ for the Express API
  - mobile/ for the React Native app
- Start with [README.md](README.md) and [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for setup details.

## Working conventions

- Prefer small, targeted changes that match the existing folder structure.
- Backend changes usually belong in server/src/routes, server/src/controllers, server/src/models, or server/src/services.
- Frontend changes usually belong in frontend/src/pages, frontend/src/components, or frontend/src/context.
- Mobile screen changes usually belong in mobile/src/screens and mobile/src/navigation.

## Common commands

- Install root dependencies: npm install
- Start the frontend: cd frontend && npm run dev
- Build the frontend: cd frontend && npm run build
- Lint the frontend: cd frontend && npm run lint
- Start the backend: cd server && npm start
- Run backend tests: cd server && npm test
- Start the mobile app: cd mobile && npm start

## Environment and runtime notes

- The backend expects a server/.env file with PORT, JWT_SECRET, MONGO_URI, and CLIENT_URL; see [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md).
- The frontend expects the API to run at http://localhost:5000/api.
- The server is configured for MongoDB when available, but it also has local fallback data handling.

## When changing code

- Review nearby files before introducing new patterns, especially the server entrypoint in [server/src/app.js](server/src/app.js) and the frontend route guards in [frontend/src/App.jsx](frontend/src/App.jsx).
- Keep auth, routing, and API structure consistent with the existing implementation.
- Update or add tests when behavior changes; backend tests live under [server/**tests**](server/__tests__).
