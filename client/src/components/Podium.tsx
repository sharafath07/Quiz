import type { Leader } from '../types/quiz';
import { AnimatedScore } from './AnimatedScore';

export function Podium({ leaders }: { leaders: Leader[] }) {
    const places = [leaders[1], leaders[0], leaders[2]];
    return <div className="podium">
        {places.map((leader, index) => leader ? <div className={`podium-card place-${leader.rank}`} key={leader.id}>
            <span className="podium-medal">{leader.rank === 1 ? '1st' : leader.rank === 2 ? '2nd' : '3rd'}</span>
            <strong>{leader.name}</strong>
            <AnimatedScore value={leader.score} />
            <small>{leader.correct} correct</small>
        </div> : <div key={index} />)}
    </div>;
}
