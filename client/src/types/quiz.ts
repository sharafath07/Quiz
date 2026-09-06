export type Leader = {
    id: string;
    name: string;
    score: number;
    correct: number;
    wrong: number;
    rank: number;
    answered: number;
    averageTime: number;
    rankMovement?: number | null;
};

export type QuizOption = { key: string; text: string };

export type Question = {
    id: string;
    order: number;
    text: string;
    options: QuizOption[];
    correctAnswer?: QuizOption | null;
    timeLimit: number;
    startedAt: string;
    endsAt: string;
    serverNow?: string;
};

export type QuestionResult = {
    order: number;
    correctAnswer: QuizOption | null;
    yourAnswer: QuizOption | null;
    isCorrect: boolean;
    timeTaken: number | null;
    score: number;
    fastestCorrect?: { name: string; timeTaken: number | null } | null;
};
