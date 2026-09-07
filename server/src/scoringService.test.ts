import { describe, expect, it } from "vitest";

import { scoreAnswer } from "./scoringService";

describe("scoreAnswer", () => {
    it("returns maximum for immediate correct answers", () => {
        expect(scoreAnswer(true, 0)).toBe(1000);
    });

    it("scales a slow correct answer", () => {
        expect(scoreAnswer(true, 10)).toBe(750);
    });

    it("returns minimum for a correct answer at the limit", () => {
        expect(scoreAnswer(true, 20)).toBe(500);
    });

    it("returns zero for wrong, missing, or expired answers", () => {
        expect(scoreAnswer(false, 1)).toBe(0);
        expect(scoreAnswer(true, null)).toBe(0);
        expect(scoreAnswer(true, 21)).toBe(0);
    });
});