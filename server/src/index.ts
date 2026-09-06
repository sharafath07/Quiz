import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { scoreAnswer } from './scoringService';

const app = express();
const httpServer = createServer(app);
const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
const io = new Server(httpServer, { cors: { origin: clientUrl } });
app.use(cors({ origin: clientUrl }));
app.use(express.json());

const cleanName = (name: string) => name.trim().replace(/[^a-zA-Z0-9 ._'-]/g, '').slice(0, 28);
const room = (gameCode: string) => `game:${gameCode}`;
const code = () => `TECH${randomBytes(2).toString('hex').toUpperCase()}`;
const closedQuestions = new Set<string>();
const leaderboardSnapshots = new Map<string, Map<string, number>>();

type QuestionPayload = { id: string; order: number; text: string; options: { key: string; text: string }[]; timeLimit: number; startedAt: string; endsAt: string };
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);
const questionDbOrder = (session: { questionOrder: unknown }, position: number) => {
    const order = Array.isArray(session.questionOrder) ? session.questionOrder[position - 1] : position;
    return typeof order === 'number' ? order : position;
};

async function getLeaderboard(sessionId: string) {
    const participants = await prisma.participant.findMany({ where: { sessionId }, include: { answers: true } });
    return participants.map(participant => {
        const answered = participant.answers.filter(answer => answer.answeredAt);
        const correct = answered.filter(answer => answer.isCorrect).length;
        const score = answered.reduce((sum, answer) => sum + answer.score, 0);
        const responseTime = answered.reduce((sum, answer) => sum + (answer.timeTaken ?? 0), 0);
        return { id: participant.id, name: participant.name, score, correct, wrong: answered.filter(answer => !answer.isCorrect).length, answered: answered.length, averageTime: answered.length ? responseTime / answered.length : 0, totalTime: responseTime };
    }).sort((a, b) => b.score - a.score || b.correct - a.correct || a.totalTime - b.totalTime).map((item, index) => ({ ...item, rank: index + 1 }));
}

async function getAnalytics(sessionId: string) {
    const session = await prisma.quizSession.findUnique({ where: { id: sessionId }, include: { quiz: { include: { questions: { orderBy: { order: 'asc' } } } }, participants: { include: { answers: true } } } });
    if (!session) return null;
    const leaderboard = await getLeaderboard(sessionId);
    const allAnswers = session.participants.flatMap(participant => participant.answers);
    const answered = allAnswers.filter(answer => answer.answeredAt);
    const correct = answered.filter(answer => answer.isCorrect);
    const questionAnalytics = session.quiz.questions.map(question => {
        const entries = allAnswers.filter(answer => answer.questionId === question.id);
        const answeredEntries = entries.filter(answer => answer.answeredAt);
        const correctEntries = answeredEntries.filter(answer => answer.isCorrect);
        const times = answeredEntries.map(answer => answer.timeTaken ?? 0);
        return { order: question.order, text: question.text, answered: answeredEntries.length, correct: correctEntries.length, incorrect: answeredEntries.filter(answer => !answer.isCorrect).length, unanswered: entries.filter(answer => !answer.answeredAt).length, percentCorrect: answeredEntries.length ? (correctEntries.length / answeredEntries.length) * 100 : 0, percentIncorrect: answeredEntries.length ? (answeredEntries.filter(answer => !answer.isCorrect).length / answeredEntries.length) * 100 : 0, averageResponseTime: times.length ? times.reduce((sum, time) => sum + time, 0) / times.length : 0, fastestCorrect: correctEntries.length ? Math.min(...correctEntries.map(answer => answer.timeTaken ?? Infinity)) : null, averagePoints: entries.length ? entries.reduce((sum, answer) => sum + answer.score, 0) / entries.length : 0 };
    });
    const scoreValues = leaderboard.map(entry => entry.score);
    const averageScore = scoreValues.length ? scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length : 0;
    const averageResponseTime = answered.length ? answered.reduce((sum, answer) => sum + (answer.timeTaken ?? 0), 0) / answered.length : 0;
    return { overall: { totalParticipants: session.participants.length, participationRate: session.participants.length ? (answered.length / (session.participants.length * session.quiz.questions.length)) * 100 : 0, averageScore, highestScore: Math.max(0, ...scoreValues), lowestScore: scoreValues.length ? Math.min(...scoreValues) : 0, averageResponseTime, totalCorrect: correct.length, totalIncorrect: answered.length - correct.length, totalUnanswered: allAnswers.length - answered.length }, questions: questionAnalytics, highlights: { easiest: questionAnalytics.reduce((best, item) => item.percentCorrect > best.percentCorrect ? item : best, questionAnalytics[0]), hardest: questionAnalytics.reduce((best, item) => item.percentCorrect < best.percentCorrect ? item : best, questionAnalytics[0]), fastest: questionAnalytics.filter(item => item.averageResponseTime > 0).reduce((best, item) => item.averageResponseTime < best.averageResponseTime ? item : best, questionAnalytics.find(item => item.averageResponseTime > 0) ?? questionAnalytics[0]), mostWrong: questionAnalytics.reduce((best, item) => item.incorrect > best.incorrect ? item : best, questionAnalytics[0]) } };
}

async function sessionState(sessionId: string) {
    const session = await prisma.quizSession.findUnique({ where: { id: sessionId }, include: { quiz: { include: { questions: { orderBy: { order: 'asc' } } } }, participants: true } });
    if (!session) return null;
    return { id: session.id, gameCode: session.gameCode, status: session.status, currentOrder: session.currentOrder, questionStartedAt: session.questionStartedAt, questionEndsAt: session.questionEndsAt, quiz: { id: session.quiz.id, title: session.quiz.title, questionCount: session.quiz.questions.length }, participants: session.participants.map(p => ({ id: p.id, name: p.name })) };
}

function csvEscape(value: unknown) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/quizzes', async (_req, res) => res.json(await prisma.quiz.findMany({ include: { _count: { select: { questions: true } } }, orderBy: { createdAt: 'desc' } })));
app.get('/api/quizzes/:id', async (req, res) => {
    const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id }, include: { questions: { orderBy: { order: 'asc' } } } });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });
    return res.json(quiz);
});
app.post('/api/quizzes', async (req, res) => {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    const quiz = await prisma.quiz.create({ data: { title } });
    return res.status(201).json(quiz);
});
app.put('/api/quizzes/:id', async (req, res) => {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    try { return res.json(await prisma.quiz.update({ where: { id: req.params.id }, data: { title } })); } catch { return res.status(404).json({ error: 'Quiz not found.' }); }
});
app.delete('/api/quizzes/:id', async (req, res) => {
    try { await prisma.quiz.delete({ where: { id: req.params.id } }); return res.status(204).send(); } catch { return res.status(404).json({ error: 'Quiz not found.' }); }
});
app.post('/api/quizzes/:id/questions', async (req, res) => {
    const { text, options, correctKey, order, timeLimit = 15 } = req.body;
    if (!text || !Array.isArray(options) || options.length !== 4 || !['A', 'B', 'C', 'D'].includes(correctKey)) return res.status(400).json({ error: 'Question must have four options and one correct key.' });
    return res.status(201).json(await prisma.question.create({ data: { quizId: req.params.id, text, options, correctKey, order, timeLimit } }));
});
app.put('/api/questions/:id', async (req, res) => {
    const { text, options, correctKey, timeLimit } = req.body;
    try { return res.json(await prisma.question.update({ where: { id: req.params.id }, data: { text, options, correctKey, timeLimit } })); } catch { return res.status(404).json({ error: 'Question not found.' }); }
});
app.delete('/api/questions/:id', async (req, res) => {
    try { await prisma.question.delete({ where: { id: req.params.id } }); return res.status(204).send(); } catch { return res.status(404).json({ error: 'Question not found.' }); }
});
app.post('/api/sessions', async (req, res) => {
    const quiz = await prisma.quiz.findUnique({ where: { id: req.body.quizId }, include: { questions: true } });
    if (!quiz || quiz.questions.length !== 40) return res.status(400).json({ error: 'A quiz with exactly 40 questions is required.' });
    let gameCode = code();
    while (await prisma.quizSession.findUnique({ where: { gameCode } })) gameCode = code();
    const questionOrder = shuffle(quiz.questions.map(question => question.order));
    const session = await prisma.quizSession.create({ data: { quizId: quiz.id, gameCode, questionOrder: questionOrder as Prisma.InputJsonValue } });
    return res.status(201).json(await sessionState(session.id));
});
app.get('/api/sessions/:id', async (req, res) => { const state = await sessionState(req.params.id); return state ? res.json(state) : res.status(404).json({ error: 'Session not found.' }); });
app.get('/api/sessions/:id/participants', async (req, res) => res.json(await prisma.participant.findMany({ where: { sessionId: req.params.id }, orderBy: { joinedAt: 'asc' } })));
app.get('/api/sessions/:id/participants/:participantId/results', async (req, res) => {
    const participant = await prisma.participant.findFirst({ where: { id: req.params.participantId, sessionId: req.params.id }, include: { answers: { include: { question: true }, orderBy: { question: { order: 'asc' } } } } });
    if (!participant) return res.status(404).json({ error: 'Participant not found.' });
    const leaderboard = await getLeaderboard(req.params.id); const summary = leaderboard.find(item => item.id === participant.id);
    return res.json({ participant: { id: participant.id, name: participant.name }, summary, answers: participant.answers.map(answer => { const options = answer.question.options as string[]; const displayed = Array.isArray(answer.displayedOptions) ? answer.displayedOptions as Array<{ key: string; text: string; correctKey: string }> : []; const selected = displayed.find(option => option.key === answer.selectedKey); const correct = displayed.find(option => option.correctKey === answer.question.correctKey); return { question: answer.question.text, questionOrder: answer.question.order, selectedAnswer: selected ? `${selected.key}) ${selected.text}` : null, correctAnswer: correct ? `${correct.key}) ${correct.text}` : `${answer.question.correctKey}) ${options[answer.question.correctKey.charCodeAt(0) - 65]}`, isCorrect: answer.isCorrect, timeTaken: answer.timeTaken, score: answer.score }; }) });
});
app.get('/api/sessions/:id/results', async (req, res) => { const session = await sessionState(req.params.id); return session ? res.json(await getLeaderboard(req.params.id)) : res.status(404).json({ error: 'Session not found.' }); });
app.get('/api/sessions/:id/analytics', async (req, res) => { const analytics = await getAnalytics(req.params.id); return analytics ? res.json(analytics) : res.status(404).json({ error: 'Session not found.' }); });
app.get('/api/sessions/:id/export', async (req, res) => {
    const session = await prisma.quizSession.findUnique({ where: { id: req.params.id }, include: { quiz: { include: { questions: { orderBy: { order: 'asc' } } } }, participants: { include: { answers: true } } } });
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    const leaderboard = await getLeaderboard(session.id); const rows = session.participants.map(participant => {
        const result = leaderboard.find(item => item.id === participant.id)!; const cells: unknown[] = [participant.name, result.rank, result.score, result.correct, result.wrong, `${((result.correct / 40) * 100).toFixed(1)}%`, result.averageTime.toFixed(2)];
        session.quiz.questions.forEach(question => { const answer = participant.answers.find(item => item.questionId === question.id); const displayed = Array.isArray(answer?.displayedOptions) ? answer.displayedOptions as Array<{ key: string; text: string }> : []; const selected = displayed.find(option => option.key === answer?.selectedKey); cells.push(selected ? `${selected.key}) ${selected.text}` : 'No answer', answer?.isCorrect ? 'Yes' : 'No', answer?.timeTaken?.toFixed(2) ?? '', answer?.score ?? 0); });
        return cells.map(csvEscape).join(',');
    });
    const header = ['Name', 'Rank', 'Total Score', 'Correct', 'Wrong', 'Accuracy', 'Average Response Time']; session.quiz.questions.forEach((_, index) => header.push(`Q${index + 1} Answer`, `Q${index + 1} Correct`, `Q${index + 1} Time`, `Q${index + 1} Score`));
    res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="quiz-${session.gameCode}.csv"`); return res.send([header.map(csvEscape).join(','), ...rows].join('\n'));
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    if (error instanceof Prisma.PrismaClientInitializationError) return res.status(503).json({ error: 'Database unavailable. Check DATABASE_URL and PostgreSQL credentials.' });
    return res.status(500).json({ error: 'Unexpected server error.' });
});

async function emitLeaderboard(sessionId: string) {
    const session = await prisma.quizSession.findUniqueOrThrow({ where: { id: sessionId } });
    const current = await getLeaderboard(sessionId);
    const previous = leaderboardSnapshots.get(sessionId) ?? new Map<string, number>();
    const withMovement = current.map(entry => ({ ...entry, rankMovement: previous.has(entry.id) ? previous.get(entry.id)! - entry.rank : null }));
    leaderboardSnapshots.set(sessionId, new Map(current.map(entry => [entry.id, entry.rank])));
    io.to(room(session.gameCode)).emit('leaderboard_updated', withMovement);
    for (const socket of await io.in(room(session.gameCode)).fetchSockets()) {
        const participantId = socket.data.participantId as string | undefined;
        const personal = withMovement.find(entry => entry.id === participantId);
        if (personal) socket.emit('personal_rank', { rank: personal.rank, previousRank: previous.get(personal.id) ?? null, movement: personal.rankMovement, score: personal.score });
    }
}
function randomizedOptions(question: { options: unknown[] }) {
    return shuffle(question.options.map((text, index) => ({ key: String.fromCharCode(65 + index), text: String(text), correctKey: String.fromCharCode(65 + index) })));
}

async function sendQuestionToSocket(socket: any, sessionId: string) {
    const session = await prisma.quizSession.findUnique({ where: { id: sessionId } });
    if (!session?.currentOrder || !session.questionStartedAt || !session.questionEndsAt) return;
    const question = await prisma.question.findFirst({ where: { quizId: session.quizId, order: questionDbOrder(session, session.currentOrder) } });
    if (!question) return;
    const participantId = socket.data.participantId as string | undefined;
    const answer = participantId ? await prisma.participantAnswer.findUnique({ where: { participantId_questionId: { participantId, questionId: question.id } } }) : null;
    const options = (Array.isArray(answer?.displayedOptions) ? answer.displayedOptions : randomizedOptions({ options: question.options as string[] })) as Array<{ key: string; text: string; correctKey: string }>;
    const payload: Record<string, unknown> = { id: question.id, order: session.currentOrder, text: question.text, options: options.map((option: any) => ({ key: option.key, text: option.text })), timeLimit: question.timeLimit, startedAt: session.questionStartedAt.toISOString(), endsAt: session.questionEndsAt.toISOString(), serverNow: new Date().toISOString(), answered: Boolean(answer?.answeredAt), selectedKey: answer?.selectedKey ?? null };
    if (!participantId && !socket.data.isHost) {
        const correctOption = options.find((option: any) => option.correctKey === question.correctKey);
        payload.correctAnswer = correctOption ? { key: correctOption.key, text: correctOption.text } : null;
    }
    socket.emit('question_started', payload);
}

async function broadcastQuestion(sessionId: string, questionOrder: number) {
    const session = await prisma.quizSession.findUnique({ where: { id: sessionId }, include: { quiz: true } });
    if (!session) return;
    const question = await prisma.question.findFirst({ where: { quizId: session.quizId, order: questionDbOrder(session, questionOrder) } });
    if (!question) return;
    const startedAt = new Date(); const endsAt = new Date(startedAt.getTime() + question.timeLimit * 1000);
    await prisma.quizSession.update({ where: { id: sessionId }, data: { status: 'ACTIVE', currentOrder: questionOrder, questionStartedAt: startedAt, questionEndsAt: endsAt } });
    const participants = await prisma.participant.findMany({ where: { sessionId } });
    const existingAnswers = await prisma.participantAnswer.findMany({ where: { questionId: question.id, participantId: { in: participants.map(participant => participant.id) } }, select: { participantId: true } });
    const existingIds = new Set(existingAnswers.map(answer => answer.participantId));
    await Promise.all(participants.filter(participant => !existingIds.has(participant.id)).map(participant => prisma.participantAnswer.create({ data: { participantId: participant.id, questionId: question.id, startedAt, displayedOptions: randomizedOptions({ options: question.options as string[] }) as Prisma.InputJsonValue } })));
    const sockets = await io.in(room(session.gameCode)).fetchSockets();
    await Promise.all(sockets.map(socket => sendQuestionToSocket(socket, sessionId)));
    io.to(room(session.gameCode)).emit('answer_progress', { answered: 0, total: participants.length });
    setTimeout(() => closeQuestion(sessionId, question.id, questionOrder), question.timeLimit * 1000 + 50);
}
async function closeQuestion(sessionId: string, questionId: string, order: number) {
    const session = await prisma.quizSession.findUnique({ where: { id: sessionId }, include: { quiz: true } }); if (!session || session.currentOrder !== order) return;
    const closeKey = `${sessionId}:${questionId}`;
    if (closedQuestions.has(closeKey)) return;
    closedQuestions.add(closeKey);
    const question = await prisma.question.findUnique({ where: { id: questionId } }); if (!question) return;
    const answers = await prisma.participantAnswer.findMany({ where: { questionId, participant: { sessionId } } });
    const distribution = ['A', 'B', 'C', 'D'].map(key => ({ key, count: answers.filter(answer => answer.answeredAt && answer.selectedKey === key).length }));
    const stats = { questionId, order, answered: answers.filter(a => a.answeredAt).length, correct: answers.filter(a => a.isCorrect).length, wrong: answers.filter(a => a.answeredAt && !a.isCorrect).length, unanswered: answers.filter(a => !a.answeredAt).length, distribution };
    const fastestAnswer = answers.filter(answer => answer.isCorrect && answer.answeredAt && answer.timeTaken !== null).sort((a, b) => (a.timeTaken ?? Infinity) - (b.timeTaken ?? Infinity))[0];
    const fastestParticipant = fastestAnswer ? await prisma.participant.findUnique({ where: { id: fastestAnswer.participantId }, select: { name: true } }) : null;
    const fastestCorrect = fastestAnswer && fastestParticipant ? { name: fastestParticipant.name, timeTaken: fastestAnswer.timeTaken } : null;
    await prisma.quizSession.update({ where: { id: sessionId }, data: { status: 'REVEAL' } });
    io.to(room(session.gameCode)).emit('question_ended', stats);
    for (const socket of await io.in(room(session.gameCode)).fetchSockets()) {
        const participantId = socket.data.participantId as string | undefined;
        if (!participantId) continue;
        const answer = answers.find(item => item.participantId === participantId);
        const displayedOptions = Array.isArray(answer?.displayedOptions) ? answer.displayedOptions as Array<{ key: string; text: string; correctKey: string }> : [];
        const correctOption = displayedOptions.find(option => option.correctKey === question.correctKey);
        const selectedOption = displayedOptions.find(option => option.key === answer?.selectedKey);
        socket.emit('question_result', { ...stats, fastestCorrect, correctAnswer: correctOption ? { key: correctOption.key, text: correctOption.text } : null, yourAnswer: selectedOption ? { key: selectedOption.key, text: selectedOption.text } : null, isCorrect: answer?.isCorrect ?? false, timeTaken: answer?.timeTaken ?? null, score: answer?.score ?? 0 });
    }
    io.to(room(session.gameCode)).emit('fastest_correct', fastestCorrect);
}

io.on('connection', socket => {
    socket.on('host_join_session', async ({ sessionId }, callback) => {
        try {
            const session = await prisma.quizSession.findUnique({ where: { id: String(sessionId) } });
            if (!session) return callback?.({ error: 'Session not found.' });
            socket.join(room(session.gameCode));
            socket.data = { isHost: true, sessionId: session.id, gameCode: session.gameCode };
            callback?.({ ok: true, state: await sessionState(session.id) });
        } catch {
            callback?.({ error: 'Unable to join host session.' });
        }
    });
    socket.on('join_game', async ({ gameCode, name, reconnectToken }, callback) => {
        try {
            const normalizedCode = String(gameCode ?? '').trim().toUpperCase(); const clean = cleanName(String(name ?? ''));
            const session = await prisma.quizSession.findUnique({ where: { gameCode: normalizedCode } }); if (!session) return callback({ error: 'Quiz not found.' });
            if (session.status !== 'LOBBY' && !reconnectToken) return callback({ error: 'This quiz has already started.' });
            let participant = reconnectToken ? await prisma.participant.findFirst({ where: { sessionId: session.id, reconnectToken } }) : null;
            if (!participant) { if (!clean) return callback({ error: 'Enter your name.' }); participant = await prisma.participant.findFirst({ where: { sessionId: session.id, name: clean } }); if (participant) return callback({ error: 'That name is already being used.' }); participant = await prisma.participant.create({ data: { sessionId: session.id, name: clean, reconnectToken: randomBytes(18).toString('hex') } }); }
            socket.join(room(normalizedCode)); socket.data = { sessionId: session.id, participantId: participant.id, gameCode: normalizedCode };
            callback({ participantId: participant.id, reconnectToken: participant.reconnectToken, state: await sessionState(session.id) }); io.to(room(normalizedCode)).emit('participant_joined', { id: participant.id, name: participant.name });
            if (session.status === 'ACTIVE' && session.currentOrder && session.questionStartedAt) {
                const activeQuestion = await prisma.question.findFirst({ where: { quizId: session.quizId, order: questionDbOrder(session, session.currentOrder) } });
                if (activeQuestion) {
                    const existingAnswer = await prisma.participantAnswer.findUnique({ where: { participantId_questionId: { participantId: participant.id, questionId: activeQuestion.id } } });
                    if (!existingAnswer) await prisma.participantAnswer.create({ data: { participantId: participant.id, questionId: activeQuestion.id, startedAt: session.questionStartedAt, displayedOptions: randomizedOptions({ options: activeQuestion.options as string[] }) as Prisma.InputJsonValue } });
                }
                await sendQuestionToSocket(socket, session.id);
            }
        } catch { callback({ error: 'Unable to join quiz.' }); }
    });
    socket.on('host_start_game', async ({ sessionId }, callback) => { const session = await prisma.quizSession.findUnique({ where: { id: sessionId } }); if (!session || session.status !== 'LOBBY') return callback?.({ error: 'Quiz cannot be started.' }); socket.join(room(session.gameCode)); await broadcastQuestion(sessionId, 1); callback?.({ ok: true }); });
    socket.on('host_view_leaderboard', async ({ sessionId }, callback) => { const session = await prisma.quizSession.findUnique({ where: { id: sessionId } }); if (!session || session.status !== 'REVEAL') return callback?.({ error: 'The answer reveal is not ready.' }); await prisma.quizSession.update({ where: { id: sessionId }, data: { status: 'LEADERBOARD' } }); await emitLeaderboard(sessionId); io.to(room(session.gameCode)).emit('leaderboard_opened'); callback?.({ ok: true }); });
    socket.on('host_next_question', async ({ sessionId }, callback) => { const session = await prisma.quizSession.findUnique({ where: { id: sessionId } }); if (!session || session.status !== 'LEADERBOARD' || !session.currentOrder) return callback?.({ error: 'Open the leaderboard before moving on.' }); if (session.currentOrder >= 40) { await prisma.quizSession.update({ where: { id: sessionId }, data: { status: 'FINISHED' } }); io.to(room(session.gameCode)).emit('game_finished', await getLeaderboard(sessionId)); return callback?.({ ok: true }); } await broadcastQuestion(sessionId, session.currentOrder + 1); callback?.({ ok: true }); });
    socket.on('submit_answer', async ({ questionId, selectedKey }, callback) => {
        const { sessionId, participantId } = socket.data as { sessionId?: string; participantId?: string }; if (!sessionId || !participantId) return callback?.({ error: 'Not joined.' });
        const session = await prisma.quizSession.findUnique({ where: { id: sessionId } }); if (!session || session.questionEndsAt && session.questionEndsAt.getTime() < Date.now()) return callback?.({ error: 'Time is up.' });
        const question = await prisma.question.findUnique({ where: { id: questionId } }); if (!question || question.order !== questionDbOrder(session, session.currentOrder ?? 0)) return callback?.({ error: 'Question is not active.' });
        const answer = await prisma.participantAnswer.findUnique({ where: { participantId_questionId: { participantId, questionId } } }); if (!answer || answer.answeredAt) return callback?.({ error: 'You have already submitted an answer.' });
        const displayedOptions = Array.isArray(answer.displayedOptions) ? answer.displayedOptions as Array<{ key: string; correctKey: string }> : [];
        const selectedOption = displayedOptions.find(option => option.key === selectedKey); if (!selectedOption) return callback?.({ error: 'Invalid answer option.' });
        const answeredAt = new Date(); const timeTaken = Math.min(question.timeLimit, Math.max(0, (answeredAt.getTime() - answer.startedAt.getTime()) / 1000)); const isCorrect = selectedOption.correctKey === question.correctKey; const score = scoreAnswer(isCorrect, timeTaken, question.timeLimit);
        await prisma.participantAnswer.update({ where: { id: answer.id }, data: { selectedKey, answeredAt, timeTaken, isCorrect, score } }); callback?.({ ok: true });
        const activeAnswers = await prisma.participantAnswer.count({ where: { questionId, participant: { sessionId } } });
        const answeredAnswers = await prisma.participantAnswer.count({ where: { questionId, participant: { sessionId }, answeredAt: { not: null } } });
        io.to(room(session.gameCode)).emit('answer_progress', { answered: answeredAnswers, total: activeAnswers });
        if (activeAnswers > 0 && activeAnswers === answeredAnswers) await closeQuestion(sessionId, questionId, session.currentOrder ?? 0);
    });
    socket.on('host_end_game', async ({ sessionId }) => { const session = await prisma.quizSession.update({ where: { id: sessionId }, data: { status: 'FINISHED' } }); io.to(room(session.gameCode)).emit('game_finished', await getLeaderboard(sessionId)); });
});

const port = Number(process.env.PORT ?? 3000);
httpServer.listen(port, () => console.log(`Quiz server listening on http://localhost:${port}`));
