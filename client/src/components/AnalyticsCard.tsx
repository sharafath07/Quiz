import { Gauge, Medal, Timer, Users, XCircle, Zap } from 'lucide-react';

export function AnalyticsCard({ analytics }: { analytics: any }) {
    if (!analytics) return null;
    const { overall, highlights } = analytics;
    const metrics = [
        { label: 'Participants', value: overall.totalParticipants, note: 'students joined', icon: Users, tone: 'lime' },
        { label: 'Average score', value: Math.round(overall.averageScore).toLocaleString(), note: 'points per student', icon: Medal, tone: 'gold' },
        { label: 'Average response', value: `${overall.averageResponseTime.toFixed(1)}s`, note: 'time per answer', icon: Timer, tone: 'blue' },
        { label: 'Participation', value: `${overall.participationRate.toFixed(1)}%`, note: 'answers submitted', icon: Gauge, tone: 'coral' },
    ];
    const insights = [
        { label: 'Easiest question', item: highlights.easiest, icon: Zap, tone: 'lime', detail: (item: any) => `${item.percentCorrect.toFixed(0)}% correct` },
        { label: 'Hardest question', item: highlights.hardest, icon: XCircle, tone: 'coral', detail: (item: any) => `${item.percentCorrect.toFixed(0)}% correct` },
        { label: 'Fastest question', item: highlights.fastest, icon: Timer, tone: 'blue', detail: (item: any) => `${item.averageResponseTime.toFixed(1)}s average` },
        { label: 'Most wrong answers', item: highlights.mostWrong, icon: XCircle, tone: 'gold', detail: (item: any) => `${item.incorrect} incorrect` },
    ];
    return <section className="analytics">
        <div className="analytics-heading"><div><p className="eyebrow">QUIZ ANALYTICS</p><h2>How the room performed</h2></div><span className="analytics-status"><i /> LIVE DATA</span></div>
        <div className="analytics-grid">{metrics.map(({ label, value, note, icon: Icon, tone }) => <div className={`analytics-metric ${tone}`} key={label}><div className="metric-icon"><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>)}</div>
        <div className="analytics-divider"><span>QUESTION INSIGHTS</span><i /></div>
        <div className="highlight-grid">{insights.map(({ label, item, icon: Icon, tone, detail }) => item && <div className={`analytics-insight ${tone}`} key={label}><div className="insight-icon"><Icon size={18} /></div><div><span>{label}</span><strong>Q{item.order}</strong><small>{detail(item)} <em>·</em> {item.averageResponseTime.toFixed(1)}s avg</small></div></div>)}</div>
    </section>;
}
