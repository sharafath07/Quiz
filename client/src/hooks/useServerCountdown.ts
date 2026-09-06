import { useEffect, useState } from 'react';
import type { Question } from '../types/quiz';

export function useServerCountdown(question?: Question) {
    const [seconds, setSeconds] = useState(question?.timeLimit ?? 0);

    useEffect(() => {
        if (!question) return;
        const serverOffset = question.serverNow
            ? new Date(question.serverNow).getTime() - Date.now()
            : 0;
        const getRemaining = () => Math.max(0, Math.ceil((new Date(question.endsAt).getTime() - (Date.now() + serverOffset)) / 1000));
        setSeconds(getRemaining());
        const timer = window.setInterval(() => setSeconds(getRemaining()), 250);
        return () => window.clearInterval(timer);
    }, [question]);

    return seconds;
}
