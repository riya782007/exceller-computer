# Exeller Computer — Integrated Business Platform

**Exeller Infosolutions LLP** — Laptop & Computer Repair | Dwarka Mor, New Delhi

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

See `.env.example` for all required configuration.

## What is implemented

- PostgreSQL schema, RLS, atomic stock deduction, job status machine + audit log
- Admin ERP: Kanban repair board, job cards, inventory, invoices, customers, technicians, WhatsApp sessions
- Public site: home, services, local SEO pages, estimator, live refurbished catalog
- Server-side GST tax engine + PDF invoice upload to Storage
- WhatsApp Evolution API abstraction and n8n webhook forwarder
- Grounded AI replies with hard stop when `chat_sessions.bot_state` is paused

## Manual configuration still required

1. Create a Supabase project, run `supabase db push` (or apply `supabase/migrations/` in order), then `supabase db seed` for sample inventory
2. Create the first **admin** profile (signup creates `customer` by design — promote role in SQL or dashboard)
3. Fill `.env.local` from `.env.example`
4. Deploy n8n + Evolution API on Railway and point Evolution → n8n → `/api/webhooks/whatsapp`
5. Add real GSTIN, business phone, UPI ID, and OpenAI key for the agent

## License

Private — Exceller Infosolutions LLP
