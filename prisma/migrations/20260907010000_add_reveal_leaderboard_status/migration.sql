-- Add explicit server-controlled phases between questions.
ALTER TYPE "SessionStatus" ADD VALUE IF NOT EXISTS 'REVEAL';
ALTER TYPE "SessionStatus" ADD VALUE IF NOT EXISTS 'LEADERBOARD';