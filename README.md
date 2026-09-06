# Technical Awareness Live Quiz

A real-time multiplayer technical awareness quiz for college classrooms. One host can run a 40-question, server-timed session for up to 40 students without student accounts.

## Features

- React/Vite student and host interfaces
- Express + Socket.IO realtime game engine
- PostgreSQL persistence through Prisma
- Server-side option mapping, answer validation, timing, and scoring
- Speed-based scores from 500 to 1000 points
- Live and final leaderboard
- CSV export with summary and question-level results
- Reconnection token support and duplicate-name protection

## Project structure

The frontend keeps shared quiz contracts in `client/src/types`, reusable UI in `client/src/components`, and server-synchronized behavior in `client/src/hooks`. The backend keeps persistence in Prisma and scoring in `server/src/scoringService.ts`.

Question countdowns use the server's `startedAt`, `endsAt`, and `serverNow` timestamps. The host and students therefore render the same authoritative remaining time; they do not start independent 15-second timers.

## Requirements

Node.js 20+, npm, and PostgreSQL 14+.

## Setup

```bash
npm install
copy .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

Set `DATABASE_URL`, `PORT` (default `3000`), and `CLIENT_URL` in `.env`. On macOS/Linux use `cp .env.example .env` instead of `copy`.

## Run

```bash
npm run dev
```

The host console is at `http://localhost:5173/host` and students join at `http://localhost:5173/join`.

## Conducting a quiz

1. Open the host console and create a live session.
2. Share the displayed `TECHxxxx` game code.
3. Students enter the code and a unique display name.
4. Start when everyone appears in the lobby.
5. Advance through the 40 server-timed questions.
6. Download the CSV from the final results screen.

## Testing and production

`npm test` runs the scoring tests. `npm run build` builds both client and server. For production, run migrations and seed against a managed PostgreSQL database, build, then serve the compiled server behind HTTPS with `CLIENT_URL` set to the deployed frontend origin.
