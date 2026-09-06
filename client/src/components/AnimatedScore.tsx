import { useEffect, useState } from 'react';

export function AnimatedScore({ value }: { value: number }) {
    const [display, setDisplay] = useState(value);

    useEffect(() => {
        const start = display;
        const distance = value - start;
        if (!distance) return;
        const started = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const progress = Math.min(1, (now - started) / 550);
            setDisplay(Math.round(start + distance * (1 - Math.pow(1 - progress, 3))));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value]);

    return <>{display.toLocaleString()}</>;
}
