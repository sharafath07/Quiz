import { Crown } from "lucide-react";
import { AnimatedScore } from "./AnimatedScore";
import type { Leader } from "../types/quiz";

function Movement({ value }: { value?: number | null }) {
    if (value === null || value === undefined) {
        return null;
    }

    return (
        <small
            className={
                value > 0
                    ? "movement up"
                    : value < 0
                        ? "movement down"
                        : "movement flat"
            }
        >
            {value > 0
                ? `up +${value}`
                : value < 0
                    ? `down ${Math.abs(value)}`
                    : "No change"}
        </small>
    );
}

export function Leaderboard({
    leaders,
    onSelect,
}: {
    leaders: Leader[];
    onSelect?: (leader: Leader) => void;
}) {
    return (
        <div className="leaderboard">
            <div className="leader-head">
                <span>RANK</span>
                <span>PLAYER</span>
                <span>CORRECT</span>
                <span>ACCURACY</span>
                <span>SCORE</span>
            </div>

            {leaders.map((leader, index) => (
                <div
                    className={`leader-row ${index === 0 ? "winner" : ""}`}
                    key={leader.id}
                    onClick={() => onSelect?.(leader)}
                >
                    <b>{leader.rank}</b>

                    <span>
                        {index === 0 && <Crown size={16} />}
                        {leader.name}
                        <Movement value={leader.rankMovement} />
                    </span>

                    <span>{leader.correct} / 40</span>

                    <span>
                        {((leader.correct / 40) * 100).toFixed(1)}%
                    </span>

                    <strong>
                        <AnimatedScore value={leader.score} />
                    </strong>
                </div>
            ))}
        </div>
    );
}