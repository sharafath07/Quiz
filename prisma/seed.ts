import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const questions = [
    ['What does CPU stand for?', ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing User'], 'A'],
    ['What does RAM provide to a computer?', ['Temporary working memory', 'Permanent file storage', 'Internet access', 'Power backup'], 'A'],
    ['Which memory keeps data when power is off?', ['RAM', 'ROM', 'Cache', 'Register'], 'B'],
    ['Which is an operating system?', ['Linux', 'Oracle', 'HTML', 'Python'], 'A'],
    ['Which is a common storage device?', ['SSD', 'Keyboard', 'Monitor', 'Microphone'], 'A'],
    ['Which is an input device?', ['Keyboard', 'Printer', 'Speaker', 'Projector'], 'A'],
    ['Which is an output device?', ['Monitor', 'Mouse', 'Scanner', 'Webcam'], 'A'],
    ['What is hardware?', ['Physical computer components', 'A web page', 'A computer instruction', 'An online account'], 'A'],
    ['What is software?', ['Programs and instructions', 'A computer cable', 'A processor chip', 'A power supply'], 'A'],
    ['What is a byte?', ['A unit of digital information', 'A display type', 'A network cable', 'A browser'], 'A'],
    ['What does HTML describe?', ['The structure of web pages', 'The color of a CPU', 'A database engine', 'A network password'], 'A'],
    ['What does CSS control?', ['Web page style and layout', 'Computer power', 'Email delivery', 'Database backups'], 'A'],
    ['What is a URL?', ['An address for an internet resource', 'A computer virus', 'A programming loop', 'A storage format'], 'A'],
    ['What is a web browser?', ['Software for viewing websites', 'A search result', 'A type of cable', 'A database table'], 'A'],
    ['What does HTTPS add to HTTP?', ['Encryption and security', 'More storage', 'A larger screen', 'Faster typing'], 'A'],
    ['What is a domain name?', ['A human-readable website address', 'A computer monitor', 'A file extension', 'A programming language'], 'A'],
    ['What is a hyperlink?', ['A clickable link to another resource', 'A printer setting', 'A CPU instruction', 'A password rule'], 'A'],
    ['Which is a search engine?', ['Google', 'Firefox', 'Windows', 'Bluetooth'], 'A'],
    ['What does a website contain?', ['Related web pages and resources', 'Only computer hardware', 'Only phone contacts', 'A single CPU'], 'A'],
    ['What is a download?', ['Receiving data from another system', 'Deleting a file', 'Printing a page', 'Starting a computer'], 'A'],
    ['Which is a programming language?', ['Python', 'HTML', 'JPEG', 'Wi-Fi'], 'A'],
    ['What is a variable?', ['A named place for a changing value', 'A computer screen', 'A web address', 'A fixed cable'], 'A'],
    ['Which is a common integer value?', ['42', 'Hello', 'True/False only', 'A paragraph'], 'A'],
    ['What is an algorithm?', ['A step-by-step solution method', 'A screen resolution', 'A file name', 'A web browser'], 'A'],
    ['What is debugging?', ['Finding and fixing program errors', 'Designing a logo', 'Connecting a printer', 'Compressing music'], 'A'],
    ['What does a loop do?', ['Repeats instructions', 'Deletes variables', 'Opens a browser', 'Changes hardware'], 'A'],
    ['What does an if statement express?', ['A condition and choice', 'A database connection', 'A screen size', 'A file format'], 'A'],
    ['What is a function?', ['A reusable block of code', 'A type of monitor', 'A web domain', 'A storage disk'], 'A'],
    ['What does C++ commonly support?', ['Object-oriented programming', 'Only web styling', 'Image compression only', 'Email hosting only'], 'A'],
    ['What is the output of 2 + 3 in most languages?', ['5', '6', '23', '2'], 'A'],
    ['What is a database?', ['An organized collection of data', 'A type of keyboard', 'A drawing tool', 'A web browser'], 'A'],
    ['What is GitHub mainly used for?', ['Hosting and collaborating on code', 'Streaming movies', 'Editing photos', 'Sending SMS'], 'A'],
    ['What is version control?', ['Tracking changes to files', 'Increasing screen brightness', 'Blocking all websites', 'Formatting a keyboard'], 'A'],
    ['What is Generative AI?', ['AI that creates new content', 'A computer battery', 'A network cable', 'A database index'], 'A'],
    ['What does VPN stand for?', ['Virtual Private Network', 'Verified Public Number', 'Visual Program Node', 'Variable Protected Network'], 'A'],
    ['What is cloud computing?', ['Using remote internet-hosted computing resources', 'Saving only to a USB drive', 'Typing without a keyboard', 'Drawing with CSS'], 'A'],
    ['What is cybersecurity?', ['Protecting systems and data from threats', 'Building computer cases', 'Writing web colors', 'Measuring screen size'], 'A'],
    ['What is an API?', ['A defined way for software to communicate', 'A type of processor', 'A video format', 'A keyboard shortcut'], 'A'],
    ['What is phishing?', ['A deceptive attempt to steal information', 'A database query', 'A safe backup', 'A programming language'], 'A'],
    ['What does software development involve?', ['Designing, building, testing, and maintaining software', 'Only buying hardware', 'Only browsing websites', 'Only printing documents'], 'A']
].map(([text, options, correctKey], index) => ({ text: text as string, options: options as string[], correctKey: correctKey as string, order: index + 1 }));

async function main() {
    const host = await prisma.host.upsert({ where: { id: 'seed-host' }, update: {}, create: { id: 'seed-host', name: 'Quiz Host' } });
    const quiz = await prisma.quiz.upsert({ where: { id: 'technical-awareness' }, update: { title: 'Technical Awareness - MCQ' }, create: { id: 'technical-awareness', title: 'Technical Awareness - MCQ', hostId: host.id } });
    await prisma.question.deleteMany({ where: { quizId: quiz.id } });
    await prisma.question.createMany({ data: questions.map(question => ({ ...question, quizId: quiz.id })) });
    console.log(`Seeded ${questions.length} questions for ${quiz.title}`);
}

main().finally(() => prisma.$disconnect());
