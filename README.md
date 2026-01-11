# Clausify

> AI-powered contract analysis that explains legal documents in plain English.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)

## What is Clausify?

Clausify helps you understand contracts before you sign them. Upload any legal document (PDF or DOCX) and get:

- **Plain English Summary** - Understand what you're agreeing to
- **Key Terms Extracted** - Important dates, amounts, and obligations
- **Red Flags Identified** - Potential concerns highlighted
- **Risk Assessment** - Overall risk score for the contract

## Features

- Upload PDF and DOCX contracts
- AI-powered analysis using Claude or Ollama (local)
- User authentication with NextAuth.js
- Freemium pricing model with Stripe integration
- Dashboard to manage your contracts
- PDF export of analysis results
- Demo mode for trying without signup

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Supabase or Docker) |
| ORM | Prisma |
| Auth | NextAuth.js |
| AI | Anthropic Claude / Ollama (local) |
| Payments | Stripe |
| Testing | Vitest + Playwright |

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL)
- Ollama (optional, for local AI)

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/byrzohod/clausify.git
cd clausify

# Install dependencies
npm install

# Start PostgreSQL database
docker compose up -d

# Setup database schema
DATABASE_URL="postgresql://clausify:clausify_dev_password@localhost:5432/clausify" npx prisma db push

# Start Ollama for local AI (optional, in separate terminal)
ollama serve
ollama pull llama3.2

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Environment Variables

Create a `.env.local` file:

```bash
# Database
DATABASE_URL="postgresql://clausify:clausify_dev_password@localhost:5432/clausify"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AI Provider: "ollama", "anthropic", or "auto"
AI_PROVIDER="ollama"
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2"

# Storage: "local" or "supabase"
STORAGE_PROVIDER="local"

# For production, add:
# ANTHROPIC_API_KEY="sk-ant-..."
# STRIPE_SECRET_KEY="sk_..."
```

## Development

```bash
# Run development server
npm run dev

# Run tests
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests (Playwright)

# Code quality
npm run lint            # ESLint
npm run typecheck       # TypeScript
npm run format          # Prettier

# Database
npm run db:push         # Push schema changes
npm run db:studio       # Open Prisma Studio
```

## Project Structure

```
clausify/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (auth)/       # Login, signup pages
│   │   ├── (dashboard)/  # Protected dashboard pages
│   │   ├── (marketing)/  # Public pages (home, pricing)
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── forms/        # Form components
│   │   └── analysis/     # Analysis display components
│   ├── lib/              # Utility libraries
│   │   ├── ai/           # AI integration (Claude/Ollama)
│   │   ├── storage/      # File storage (local/Supabase)
│   │   └── parsers/      # PDF/DOCX parsing
│   └── types/            # TypeScript types
├── prisma/               # Database schema
├── tests/                # Test files
├── plans/                # Planning documents
└── docker-compose.yml    # Local PostgreSQL
```

## Testing

The project has comprehensive test coverage:

| Test Type | Count | Status |
|-----------|-------|--------|
| Unit Tests | 57 | ✅ Passing |
| Integration Tests | 13 | ✅ Passing |
| E2E Tests | 27 | ✅ Passing |

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Environment Variables for Production

Set these in your deployment platform:

- `DATABASE_URL` - Supabase PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for sessions
- `NEXTAUTH_URL` - Your production URL
- `ANTHROPIC_API_KEY` - Claude API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Anthropic](https://www.anthropic.com/) - Claude AI
- [Ollama](https://ollama.ai/) - Local AI
- [Prisma](https://www.prisma.io/) - Database ORM
- [Stripe](https://stripe.com/) - Payment processing
