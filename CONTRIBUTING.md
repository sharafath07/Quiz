# Contributing to Quiz

Thank you for your interest in contributing to Quiz!

Quiz is an open-source real-time multiplayer quiz platform. Contributions are welcome, including bug fixes, documentation improvements, accessibility improvements, UI improvements, tests, performance work, and new features.

## Before You Start

1. Check existing GitHub Issues and Pull Requests.
2. For significant features, open an issue first so the approach can be discussed.
3. Keep changes focused. Avoid mixing unrelated refactors with a feature or bug fix.

## Development Setup

### Requirements

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer

### Setup

```bash
git clone https://github.com/sharafath07/Quiz.git
cd Quiz
npm install
copy .env.example .env
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

On macOS/Linux, use:

```bash
cp .env.example .env
```

### Run Locally

```bash
npm run dev
```

The default development URLs are:

- Host: `http://localhost:5173/host`
- Participant: `http://localhost:5173/join`
- Server: `http://localhost:3000`

## Branches

Create a separate branch for your work:

```bash
git checkout -b feature/your-feature
```

Recommended naming:

- `feature/...` for new functionality
- `fix/...` for bug fixes
- `docs/...` for documentation
- `refactor/...` for code-only refactoring
- `test/...` for tests

## Code Quality

Before opening a Pull Request:

```bash
npm test
npm run build
```

Make sure the project builds successfully and existing tests pass.

## Pull Requests

A good Pull Request should include:

- A clear title
- A concise explanation of the problem and solution
- Screenshots or a short recording for UI changes
- Tests for important behavior when practical
- Any database migration required by the change
- Notes about configuration or environment-variable changes

Keep Pull Requests focused and easy to review.

## Database Changes

If you change the Prisma schema:

1. Create an appropriate migration.
2. Test the migration locally.
3. Include the migration files in your Pull Request.
4. Update documentation if setup or environment variables change.

Do not commit production database credentials.

## Commit Messages

Use clear, descriptive commit messages. For example:

```text
feat: add quiz pause control
fix: prevent duplicate answer submissions
docs: improve local setup instructions
test: add scoring edge cases
```

## Reporting Bugs

Please use GitHub Issues for reproducible bugs.

Include:

- What happened
- What you expected to happen
- Steps to reproduce
- Browser/Node.js version when relevant
- Relevant logs or screenshots
- Whether the issue occurs consistently

Do not post passwords, API keys, database credentials, session tokens, or other secrets in an issue.

## Security Vulnerabilities

Please do not publicly disclose security vulnerabilities through GitHub Issues. See `SECURITY.md` for the reporting process.

## License

By contributing to this repository, you agree that your contributions will be licensed under the MIT License included in this repository.
