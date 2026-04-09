# Planet (Plan It)

A gamified multi-productivity hub targeted at neurodivergent users. Built as an interactive tile grid where each tool is its own unique experience.

## Features

### Productivity Tools ("Get It Done")
- **Master List** — Central task hub with categories, priorities, due dates
- **Bingo Board** — 5×5 grid from your tasks; complete them to get bingo
- **Wheel of To-Dos** — Spin and do whatever it lands on
- **Bet on Yourself** — Wager Stardust on completing tasks by a deadline
- **Jar of Marbles** — Watch colorful marbles fill a jar as you complete tasks
- **Pomodoro Timer** — Focus in timed sprints with a visual ring
- **Calendar** — Monthly view of task due dates and completions
- **Boss Battle** — Turn big tasks into boss fights with HP bars
- **Task Garden** — Plant seeds (tasks), water them, watch them grow
- **Focus Fortress** — Build a brick fortress with Pomodoro sessions
- **Dice Roll** — Roll dice and commit to that many tasks

### Relaxation Tools ("Recharge")
- **Vent Into the Void** — Type and watch it dissolve; nothing is saved
- **Breathing Bubbles** — Guided breathing with visual bubble animation
- **Soundscape Mixer** — Layer ambient sounds (rain, fire, cafe, etc.)
- **Doodle Pad** — Free-draw canvas with no judgment
- **Affirmation Cards** — Flip through encouraging affirmations
- **Stretch Timer** — Guided micro-stretch routines
- **Mindful Minute** — 60-second meditation with floating particles

### Gamification
- **Stardust** currency earned from tasks, quests, and achievements
- **3 Daily Quests** that rotate each day
- **Achievements** with progress tracking and unlock rewards
- **Streaks** for consecutive active days

## Tech Stack

- **Frontend**: Vite + React 19 + Tailwind v4 + JavaScript
- **Backend**: Express.js
- **Database**: MySQL
- **Auth**: bcrypt + JWT (httpOnly cookies)
- **Encryption**: AES-256-GCM for all user content at rest

## Setup

### Prerequisites
- Node.js 18+
- MySQL 8+

### Install

```bash
npm install
cd client && npm install
cd ../server && npm install
```

### Database

Create a MySQL database named `planet`:

```sql
CREATE DATABASE planet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Run

```bash
npm run dev
```

This starts both the client (port 5173) and server (port 3001) concurrently.

### Build

```bash
npm run build
```

## Deployment (DigitalOcean)

1. Create a **Managed MySQL Database** on DigitalOcean
2. Create a **Droplet** or use **App Platform**
3. Set environment variables from `.env.example`
4. Build the client and serve from the Express server or a CDN
