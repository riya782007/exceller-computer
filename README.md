# Exceller Computer — Integrated Business Platform

**Exceller Infosolutions LLP** — Laptop & Computer Repair | Dwarka Mor, New Delhi

## Overview

A complete integrated operational platform replacing fragmented manual communication with a unified system covering:

- 🌐 Customer-facing website
- 🔧 Repair price estimator
- 💻 Refurbished laptop catalog
- 📊 Internal ERP
- 🔄 Repair job lifecycle management
- 👨‍🔧 Technician management
- 📦 Inventory management
- 🧾 GST invoicing
- 💬 WhatsApp automation
- 🤖 AI customer service agent
- 📈 Local SEO

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Validation | Zod |
| PDF | @react-pdf/renderer |
| Messaging | Evolution API + n8n |
| AI | OpenAI / Anthropic |
| Hosting | Vercel + Railway |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account (or local via Docker)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in your Supabase credentials and other config

# Run development server
npm run dev
```

### Database Setup

1. Create a Supabase project
2. Run migrations in order:
   ```bash
   supabase db push
   ```
   Or manually apply files from `supabase/migrations/` in sequence.

3. (Optional) Seed development data:
   ```bash
   supabase db seed
   ```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run test         # Run unit tests
npm run test:watch   # Tests in watch mode
```

## Project Structure

```
src/
├── app/
│   ├── (public)/          # Customer website
│   ├── (auth)/            # Login/register
│   ├── admin/             # Internal ERP (protected)
│   └── api/               # Webhook endpoints
├── components/
│   ├── ui/                # shadcn/ui components
│   └── domain/            # Business components
├── lib/
│   ├── supabase/          # Database clients
│   ├── validations/       # Zod schemas
│   ├── auth/              # Auth utilities
│   ├── utils/             # Utilities
│   └── constants/         # Business constants
├── types/                 # TypeScript types
└── styles/                # Global CSS
```

## Architecture

- **Route Groups**: `(public)` for customer-facing, `(auth)` for auth flows, `admin/` for ERP
- **Server Components**: Default rendering mode
- **Server Actions**: All sensitive mutations
- **RLS**: Database-level access control on every table
- **Zod Validation**: Every user input validated before processing

## Database

PostgreSQL with 7 migrations covering:
- Enum types
- Profiles (linked to auth)
- Inventory items (CHECK: quantity >= 0)
- Repair jobs (state machine)
- Job parts allocation (atomic function)
- Invoices + items (GST engine)
- Chat sessions (bot state management)

## Security

- Row Level Security on all tables
- Server-side secrets never exposed to browser
- Role-based access (admin, technician, customer)
- Webhook authentication via shared secrets
- Zod validation on all inputs

## Environment Variables

See `.env.local.example` for all required configuration.

## License

Private — Exceller Infosolutions LLP
