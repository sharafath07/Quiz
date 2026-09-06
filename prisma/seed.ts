import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const questions = [
    ['What does CPU stand for?', ['Central Processing Unit', 'Computer Processing Unit', 'Central Program Unit', 'Computer Program Utility'], 'A'],
    ['What does RAM stand for?', ['Read Access Memory', 'Random Access Memory', 'Rapid Access Machine', 'Random Application Memory'], 'B'],
    ['Which of the following is an operating system?', ['Python', 'Windows', 'HTML', 'Google'], 'B'],
    ['What is the primary function of the CPU?', ['To store files permanently', 'To process instructions and perform calculations', 'To display images on the screen', 'To connect the computer to the Internet'], 'B'],
    ['Which of the following is used to permanently store data?', ['RAM', 'CPU', 'Hard Disk', 'Cache'], 'C'],
    ['What does HTML stand for?', ['Hyper Text Markup Language', 'High Text Machine Language', 'Hyperlink Text Management Language', 'Hyperlink Tool Markup Language'], 'A'],
    ['Which language is primarily used to style the appearance of a web page?', ['HTML', 'CSS', 'Python', 'SQL'], 'B'],
    ['Which HTML tag is used to create a hyperlink?', ['<link>', '<href>', '<a>', '<url>'], 'C'],
    ['What does URL stand for?', ['Uniform Resource Locator', 'Universal Resource Link', 'Uniform Reference Link', 'Universal Reference Locator'], 'A'],
    ['Which of the following is a programming language?', ['Python', 'Google', 'Windows', 'Chrome'], 'A'],
    ['Which of the following is NOT a programming language?', ['Python', 'Java', 'C++', 'HTML'], 'D'],
    ['Which data type is commonly used to store whole numbers in C?', ['float', 'char', 'int', 'string'], 'C'],
    ['What is an algorithm?', ['A programming language', 'A step-by-step procedure for solving a problem', 'A type of computer hardware', 'A database system'], 'B'],
    ['What is debugging?', ['Creating a new program', 'Finding and fixing errors in a program', 'Installing software', 'Deleting a program'], 'B'],
    ['What is a variable in programming?', ['A place used to store a value', 'A computer hardware component', 'A type of operating system', 'A programming error'], 'A'],
    ['What will be the output of the following Python code?\n\nx = 5\ny = 3\nprint(x + y)', ['xy', '8', 'x + y', '53'], 'B'],
    ['What is a database?', ['A collection of organised data', 'A computer processor', 'A programming language', 'A type of operating system'], 'A'],
    ['What is GitHub mainly used for?', ['Watching videos', 'Storing and collaborating on code', 'Creating computer hardware', 'Sending emails'], 'B'],
    ['Which of the following is an example of Generative AI?', ['Calculator', 'ChatGPT', 'File Explorer', 'Keyboard'], 'B'],
    ['What does VPN stand for?', ['Virtual Private Network', 'Verified Public Network', 'Virtual Protected Node', 'Verified Private Node'], 'A'],
    ['Which country is known as the Land of the Rising Sun?', ['China', 'Thailand', 'Japan', 'Korea'], 'C'],
    ['Which is the longest river in India?', ['Yamuna', 'Godavari', 'Ganga', 'Narmada'], 'C'],
    ['Where is the headquarters of the United Nations located?', ['London', 'Geneva', 'Paris', 'New York'], 'D'],
    ['Which Indian state has the longest coastline?', ['Kerala', 'Tamil Nadu', 'Gujarat', 'Maharashtra'], 'C'],
    ["Which gas is most abundant in Earth's atmosphere?", ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], 'B'],
    ['Which is the largest ocean in the world?', ['Indian Ocean', 'Atlantic Ocean', 'Arctic Ocean', 'Pacific Ocean'], 'D'],
    ['Who discovered gravity?', ['Albert Einstein', 'Galileo Galilei', 'Isaac Newton', 'Thomas Edison'], 'C'],
    ['Who is known as the Missile Man of India?', ['Vikram Sarabhai', 'A. P. J. Abdul Kalam', 'C. V. Raman', 'Homi Bhabha'], 'B'],
    ['Which blood group is commonly known as the universal donor?', ['AB+', 'O+', 'O−', 'AB−'], 'C'],
    ['Which country gifted the Statue of Liberty to the United States?', ['Germany', 'France', 'Britain', 'Italy'], 'B'],
    ['Which Indian state is known as the “Spice Garden of India”?', ['Tamil Nadu', 'Karnataka', 'Kerala', 'Assam'], 'C'],
    ['Who was the first person to step on the Moon?', ['Yuri Gagarin', 'Neil Armstrong', 'Buzz Aldrin', 'Michael Collins'], 'B'],
    ['Which Indian classical dance form originated in Kerala?', ['Bharatanatyam', 'Kathak', 'Kathakali', 'Odissi'], 'C'],
    ['Which country has the largest population in the world?', ['China', 'India', 'USA', 'Indonesia'], 'B'],
    ['Which is the only metal that is liquid at room temperature?', ['Sodium', 'Mercury', 'Aluminium', 'Iron'], 'B'],
    ['The headquarters of the Reserve Bank of India is located in:', ['New Delhi', 'Kolkata', 'Mumbai', 'Chennai'], 'C'],
    ['Which Indian mission successfully landed near the Moon\'s south polar region?', ['Chandrayaan-1', 'Mangalyaan', 'Chandrayaan-2', 'Chandrayaan-3'], 'D'],
    ['Who was the first woman to win a Nobel Prize?', ['Mother Teresa', 'Marie Curie', 'Rosalind Franklin', 'Jane Goodall'], 'B'],
    ['What is the study of plants called?', ['Zoology', 'Botany', 'Biology', 'Ecology'], 'B'],
    ['The ozone layer is found in which layer of the atmosphere?', ['Troposphere', 'Stratosphere', 'Mesosphere', 'Thermosphere'], 'B']
].map(([text, options, correctKey], index) => ({ text: text as string, options: options as string[], correctKey: correctKey as string, order: index + 1, timeLimit: 15 }));

async function main() {
    const host = await prisma.host.upsert({ where: { id: 'seed-host' }, update: {}, create: { id: 'seed-host', name: 'Quiz Host' } });
    const quiz = await prisma.quiz.upsert({ where: { id: 'technical-awareness' }, update: { title: 'Technical Awareness – MCQ' }, create: { id: 'technical-awareness', title: 'Technical Awareness – MCQ', hostId: host.id } });
    await prisma.question.deleteMany({ where: { quizId: quiz.id } });
    await prisma.question.createMany({ data: questions.map(question => ({ ...question, quizId: quiz.id })) });
    console.log(`Seeded ${questions.length} questions for ${quiz.title}`);
}

main().finally(() => prisma.$disconnect());
