import { useEffect, useRef, useState } from "react";

export function AnimatedScore({ value }: { value: number }) {
    const [display, setDisplay] = useState(value);
    const displayRef = useRef(value);

    useEffect(() => {
        const start = displayRef.current;
        const distance = value - start;

        if (!distance) {
            displayRef.current = value;
            setDisplay(value);
            return;
        }

        const started = performance.now();
        let frame = 0;

        const tick = (now: number) => {
            const progress = Math.min(1, (now - started) / 550);

            const eased =
                1 - Math.pow(1 - progress, 3);

            const current = Math.round(
                start + distance * eased
            );

            displayRef.current = current;
            setDisplay(current);

            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            } else {
                displayRef.current = value;
                setDisplay(value);
            }
        };

        frame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frame);
    }, [value]);

    return <>{display.toLocaleString()}</>;
}