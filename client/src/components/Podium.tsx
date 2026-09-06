import type { Leader } from '../types/quiz';
import { AnimatedScore } from './AnimatedScore';
import { Crown, Sparkles, Trophy } from 'lucide-react';

export function Podium({ leaders }: { leaders: Leader[] }) {
    const places = [leaders[1], leaders[0], leaders[2]];
    return <section className="final-podium">
        <div className="podium-heading"><span className="podium-kicker"><Sparkles size={15} /> FINAL RESULTS</span><h2>And the room's top three are...</h2><p>Every answer counted. Every point was earned.</p></div>
        <div className="podium-stage"><div className="podium-sheen" />{places.map((leader, index) => leader ? <div className={`podium-card place-${leader.rank}`} key={leader.id}>
            <div className="podium-avatar">{leader.rank === 1 ? <Crown size={26} /> : leader.rank === 2 ? '2' : '3'}</div>
            <span className="podium-medal">{leader.rank === 1 ? 'CHAMPION' : leader.rank === 2 ? 'RUNNER UP' : 'THIRD PLACE'}</span>
            <strong>{leader.name}</strong>
            <b><AnimatedScore value={leader.score} /></b>
            <small><Trophy size={13} /> {leader.correct} correct answers</small>
            <div className="podium-block"><span>{leader.rank}</span></div>
        </div> : <div className="podium-slot" key={index} />)}</div>
    </section>;
}
