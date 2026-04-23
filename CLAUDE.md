# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Collaborative Study Tracker with Leaderboard** — a MERN stack web app where multiple users log study sessions via a timer, view rankings on a real-time leaderboard, track progress toward a shared group goal (e.g., 400 hours), and visualize daily study consistency on a calendar.

## Tech Stack

- **Frontend:** React 18 + Vite, React Router, Axios, Context API for auth state
- **Backend:** Node.js + Express, Mongoose ODM, JWT auth, bcrypt for password hashing
- **Database:** MongoDB (Atlas in production, local in dev)
- **Deployment:** Backend on Render/Railway, Frontend on Vercel/Netlify, DB on MongoDB Atlas

## Repository Structure

```
.
├── server/          # Express API
│   ├── config/      # DB connection
│   ├── models/      # Mongoose schemas (User, StudySession)
│   ├── routes/      # Express routers
│   ├── controllers/ # Route handlers
│   ├── middleware/  # JWT auth middleware
│   └── server.js    # App entry point
├── client/          # React + Vite SPA
│   └── src/
│       ├── api/         # Axios instance
│       ├── components/  # Reusable UI (Timer, Leaderboard, etc.)
│       ├── context/     # AuthContext
│       └── pages/       # Login, Signup, Dashboard
└── package.json     # Root scripts (concurrently runs both)
```

## Common Commands

From the project root:

| Command            | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `npm run install-all` | Install root + server + client deps       |
| `npm run dev`      | Run server (nodemon) and client (vite) together |
| `npm run server`   | Run backend only                             |
| `npm run client`   | Run frontend only                            |
| `npm run build`    | Build the client for production              |

## Environment Variables

**server/.env** (see `server/.env.example`):
- `PORT` — backend port (default 5000)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — token signing secret
- `CLIENT_URL` — frontend origin for CORS
- `STUDY_GOAL_HOURS` — group goal (default 400)

**client/.env** (see `client/.env.example`):
- `VITE_API_URL` — backend API base URL

## API Surface

- `POST   /api/auth/signup` — register
- `POST   /api/auth/login` — returns JWT
- `GET    /api/auth/me` — current user (auth required)
- `PUT    /api/auth/profile` — update display name (auth required)
- `PUT    /api/auth/password` — change password (auth required)
- `DELETE /api/auth/account` — permanently delete account + data (auth required)
- `GET    /api/users/leaderboard` — ranked participants (grouped by goal)
- `GET    /api/users/:id/profile` — public profile + heatmap + achievements
- `GET    /api/goals/me` — current user's goals
- `POST   /api/goals` — create a personal goal (auth required)
- `DELETE /api/goals/:id` — delete a goal (auth required)
- `POST   /api/sessions` — log a completed session (auth required)
- `GET    /api/sessions/me` — current user's sessions
- `GET    /api/sessions/calendar` — daily totals for calendar view

## Frontend Notes

- The Study Timer has a **focus mode** (maximize button on the timer card) that opens a full-screen, distraction-free Pomodoro view with 25/50/90-minute presets and minimal Start/Pause/Reset controls. Keyboard shortcuts: `Space` toggles start/pause, `Esc` exits.
- Account Settings displays both the username and email, and supports inline username editing via `PUT /api/auth/profile`.
- A `/welcome` landing screen is the default route for unauthenticated users (PrivateRoute redirects there). It has a "Get Started" CTA → `/signup` and a secondary link to `/login`.
- Theme is managed by `ThemeContext` (`client/src/context/ThemeContext.jsx`). Preference (`light` | `dark` | `system`) is persisted in `localStorage` under `study-tracker-theme`, applied via `html[data-theme="..."]`. To avoid FOUC, `client/index.html` includes a tiny boot script that sets the attribute before React mounts. Dark-mode CSS overrides live under `html[data-theme="dark"]` (no `prefers-color-scheme` media query).
- The Dashboard renders a `QuoteOfTheDay` panel that fetches from `https://api.quotable.io/random` once per day (cached in `localStorage` under `study-tracker-quote`) and falls back to a built-in list if the API is unreachable.
- The activity Heatmap is grouped into per-month blocks with horizontal spacing between months. Weekday labels (Mon/Wed/Fri) have been removed for a cleaner look.
- The Navbar no longer shows a "Dashboard" link — the brand logo (📚 Study Tracker) on the left is the dashboard link. The navbar also includes a theme toggle button that cycles light → dark → system.

## Conventions

- ES modules (`"type": "module"`) in both client and server.
- Controllers handle business logic; routes only wire URLs to controllers.
- All write endpoints require the `authMiddleware` (Bearer token).
- Frontend stores JWT in `localStorage`, attaches via Axios interceptor.

## Deployment Notes

- Backend reads `process.env.PORT` so it works on Render/Railway out of the box.
- CORS is restricted to `CLIENT_URL`; update env var per environment.
- Frontend `VITE_API_URL` must point at the deployed backend.
