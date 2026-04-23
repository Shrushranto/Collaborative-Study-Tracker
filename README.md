# 📚 Collaborative Study Tracker

A full-stack **MERN** web app where a group of users log their study sessions, compete on a real-time leaderboard, track progress toward personal goals, and visualise daily consistency on a calendar.

---

## 🎯 Features

- 🔐 **Secure authentication** — JWT-based signup & login with hashed passwords (bcrypt) and password-strength meter
- ⏱️ **Study timer** — start, pause, resume, and save sessions with subject + reflection notes
- 🎯 **Focus mode** — OS-level fullscreen Pomodoro view with 25 / 50 / 90 min presets; `Space` toggles start/pause, `Esc` exits
- 🦉 **Focus pet** — animated companion that wanders the screen while you study
- 🏆 **Real-time leaderboard** — participants ranked by total study hours
- 📊 **Personal goals** — create targets and track progress with animated progress bars
- 📅 **Monthly calendar** — hover to see topics studied + time; click a day to open a slide-in panel with full session details and notes
- 🗺️ **Activity heatmap** — year-at-a-glance contribution graph on your public profile
- 💡 **Daily motivational quote** — fetched from a public API once per day, cached locally
- 🎨 **Theme switcher** — light / dark / system preference with a navbar toggle (cycles through all three)
- 🧩 **Draggable dashboard** — rearrange and resize widgets via drag-and-drop; layout saved per-browser
- 🧑‍🤝‍🧑 **Social** — follow/unfollow users, view public profiles, real-time group study rooms, direct messages (end-to-end encrypted)
- 🧠 **AI quizzes & flashcards** — generate practice questions from your study sessions (powered by OpenAI)
- 📁 **File sharing** — upload and share study files within your group
- ⚙️ **Account settings** — edit username, change password, customise notifications and personalisation, or permanently delete your account
- 👋 **Welcome screen** — landing page with "Get Started" CTA for unauthenticated visitors

---

## 🛠️ Tech Stack

**Frontend:** React 18 · Vite · React Router · Axios · Context API  
**Backend:** Node.js · Express · Mongoose · JSON Web Tokens · bcryptjs · OpenAI SDK  
**Database:** MongoDB (local dev or Atlas in production)

---

## 📁 Project Structure

```
Collaborative Study Tracker/
├── server/                  # Express + MongoDB API
│   ├── config/db.js         # Mongoose connection
│   ├── models/              # User, StudySession, Goal, Message, GroupSession, StudyFile, QuizAttempt, Flashcard
│   ├── routes/              # auth, users, sessions, goals, messages, groupSessions, files, quiz, ai
│   ├── controllers/         # Business logic per route group
│   ├── middleware/          # JWT auth, optionalAuth
│   └── server.js            # App entry point
├── client/                  # React + Vite SPA
│   ├── index.html
│   ├── public/sw.js         # Service worker
│   └── src/
│       ├── api/             # Axios instance with auth interceptor
│       ├── components/      # Timer, Leaderboard, MonthlyCalendar, SessionLog, Heatmap, FocusPet, …
│       ├── context/         # AuthContext, ThemeContext, TimerContext
│       ├── pages/           # Welcome, Login, Signup, Dashboard, Goals, Profile, People, Messages, Quiz, Files, …
│       └── utils/           # dashboardLayout, toast, notifications, avatars, crypto
├── package.json             # Root scripts (runs server + client concurrently)
├── CLAUDE.md                # AI assistant guidance for this repo
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js **18+**
- MongoDB running locally **or** a MongoDB Atlas connection string
- An OpenAI API key (for the quiz/flashcard AI features)

### 1. Install dependencies

```bash
npm run install-all
```

### 2. Configure environment variables

**`server/.env`** (copy from `server/.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/study-tracker
JWT_SECRET=replace_me_with_a_long_random_string
CLIENT_URL=http://localhost:5173
STUDY_GOAL_HOURS=400
OPENAI_API_KEY=sk-...
```

**`client/.env`** (copy from `client/.env.example`):

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run both servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| API     | http://localhost:5000 |
| App     | http://localhost:5173 |

---

## 📡 API Reference

| Method | Endpoint                        | Auth | Purpose                                        |
| ------ | ------------------------------- | ---- | ---------------------------------------------- |
| POST   | `/api/auth/signup`              | ❌   | Register a new user                            |
| POST   | `/api/auth/login`               | ❌   | Log in, returns JWT                            |
| GET    | `/api/auth/me`                  | ✅   | Get current user                               |
| PUT    | `/api/auth/profile`             | ✅   | Update display name / avatar                   |
| PUT    | `/api/auth/password`            | ✅   | Change password                                |
| DELETE | `/api/auth/account`             | ✅   | Permanently delete account + all data          |
| GET    | `/api/users/leaderboard`        | ❌   | Participants ranked by total study hours        |
| GET    | `/api/users/:id/profile`        | ✅   | Public profile + achievements + heatmap        |
| GET    | `/api/goals/mine`               | ✅   | Current user's goals                           |
| POST   | `/api/goals`                    | ✅   | Create a personal goal                         |
| DELETE | `/api/goals/:id`                | ✅   | Delete a goal                                  |
| POST   | `/api/sessions`                 | ✅   | Log a completed study session                  |
| GET    | `/api/sessions/me`              | ✅   | Current user's sessions (last 100)             |
| GET    | `/api/sessions/calendar`        | ✅   | Daily totals for the monthly calendar          |
| GET    | `/api/sessions/by-date`         | ✅   | Full session details for a specific date       |
| GET    | `/api/messages/:userId`         | ✅   | Message thread with a user                     |
| POST   | `/api/messages/:userId`         | ✅   | Send an encrypted message                      |
| GET    | `/api/group-sessions`           | ✅   | List group study rooms                         |
| POST   | `/api/group-sessions`           | ✅   | Create a group study room                      |
| GET    | `/api/files`                    | ✅   | List shared study files                        |
| POST   | `/api/files`                    | ✅   | Upload a study file                            |
| POST   | `/api/quiz/generate`            | ✅   | Generate AI quiz from session content          |
| POST   | `/api/ai/chat`                  | ✅   | AI study assistant chat (OpenAI)               |

Authenticated requests must include: `Authorization: Bearer <token>`

---

## 🚀 Deployment

Structured for split deployment: **backend on Render/Railway, frontend on Vercel/Netlify, database on MongoDB Atlas.**

### A. MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Whitelist `0.0.0.0/0` in **Network Access**.
3. Create a DB user and copy the connection string into `MONGO_URI`.

### B. Backend — Render
1. Push the repo to GitHub.
2. **New → Web Service**, connect the repo.
3. Set **Root Directory:** `server`, **Build Command:** `npm install`, **Start Command:** `npm start`.
4. Add env vars: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL), `OPENAI_API_KEY`, `STUDY_GOAL_HOURS`.

### C. Frontend — Vercel
1. **Add New → Project**, import the repo.
2. Set **Root Directory:** `client`, **Framework Preset:** Vite, **Output Directory:** `dist`.
3. Add env var: `VITE_API_URL=https://<your-render-url>/api`.
4. Deploy and update `CLIENT_URL` on the backend to your Vercel domain.

---

## 🔒 Security Notes
- Passwords are salted + hashed with bcrypt before storage.
- JWTs expire after 7 days; rotate `JWT_SECRET` to invalidate all sessions.
- Direct messages are end-to-end encrypted in the browser via the Web Crypto API.
- CORS is locked to a single origin via `CLIENT_URL`.
- Never commit `.env` files — they're in `.gitignore`.

---

## 📜 License
MIT — feel free to fork and adapt.
