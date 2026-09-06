-- Add the shuffled question sequence stored for each quiz session.
ALTER TABLE "QuizSession" ADD COLUMN "questionOrder" JSONB;
