export const MAX_SCORE = 1000;

export function scoreAnswer(
    isCorrect: boolean,
    timeTaken: number | null,
    timeLimit = 20
): number {
    if (
        !isCorrect ||
        timeTaken === null ||
        timeTaken < 0 ||
        timeTaken > timeLimit
    ) {
        return 0;
    }

    const remaining = Math.max(0, timeLimit - timeTaken);

    return Math.round(
        MAX_SCORE *
        (0.5 + 0.5 * (remaining / timeLimit))
    );
}