export function AnalyticsCard({ analytics }: { analytics: any }) {
    if (!analytics) return null;
    const { overall, highlights } = analytics;
    return <section className="analytics">
        <p className="eyebrow">QUIZ ANALYTICS</p>
        <div className="analytics-grid">
            <div><span>PARTICIPANTS</span><strong>{overall.totalParticipants}</strong></div>
            <div><span>AVG SCORE</span><strong>{Math.round(overall.averageScore).toLocaleString()}</strong></div>
            <div><span>AVG RESPONSE</span><strong>{overall.averageResponseTime.toFixed(1)}s</strong></div>
            <div><span>PARTICIPATION</span><strong>{overall.participationRate.toFixed(1)}%</strong></div>
        </div>
        <div className="highlight-grid">
            {([['Easiest', highlights.easiest], ['Hardest', highlights.hardest], ['Fastest', highlights.fastest], ['Most wrong', highlights.mostWrong]] as const).map(([label, item]) => item && <div key={label}><span>{label}</span><strong>Q{item.order}</strong><small>{item.percentCorrect.toFixed(0)}% correct · {item.averageResponseTime.toFixed(1)}s avg</small></div>)}
        </div>
    </section>;
}
