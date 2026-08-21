# Exeller Platform — Module Architecture

## Design principles

1. **Customers are not auth users.** A walk-in customer must be creatable in
   10 seconds at the counter without provisioning a login. `customers` is
   therefore decoupled from `auth.users`, with an optional `profile_id` for the
   minority who register on the website.
2. **Permissions are data, not code.** The RBAC matrix has 5 staff roles × ~15
   capabilities with partial grants ("approve quotes under ₹5k"). An enum cannot
   express that. Roles and permissions are tables; RLS calls `has_permission()`.
3. **The AI agent is grounded in the database, never in prose.** Prices come from
   `service_catalog`, stock from `inventory_items`, job status from `repair_jobs`.
   Every agent action is written to `ai_tool_calls` so it is auditable.
4. **One source of truth per concern.** Tax lives in the tax engine. Status
   transitions live in `transition_job_status()`. Stock deduction lives in
   `allocate_part_to_job()`. No duplication in UI.
5. **Money and stock move only through database functions.** Never through a
   sequence of client requests.

---

## Modules

| # | Module | Tables | Purpose |
|---|--------|--------|---------|
| 1 | **Identity & Access** | `roles`, `permissions`, `role_permissions`, `profiles` | 5 staff roles, granular capability grants, RLS enforcement |
| 2 | **CRM** | `customers`, `devices`, `leads`, `customer_interactions` | Customer master, multi-device history, inbound lead capture |
| 3 | **Service Catalog** | `service_categories`, `service_catalog` | Priced service list — powers the public estimator *and* grounds the AI agent |
| 4 | **Service Desk** | `repair_jobs`, `ticket_status_log`, `ticket_checklists`, `attachments` | Ticket lifecycle, audit trail, QC checklists, intake photos |
| 5 | **Inventory** | `inventory_items`, `serialized_parts`, `stock_movements`, `vendors`, `purchase_orders`, `purchase_order_items` | Dual tracking (bulk + serialised), reorder alerts, PO flow |
| 6 | **Billing** | `invoices`, `invoice_items`, `payments` | GST invoicing, deposits, part payments |
| 7 | **Warranty & RMA** | `warranty_records`, `rma_tickets` | Post-repair warranty clock, vendor returns |
| 8 | **AMC** | `amc_contracts`, `amc_visits` | Corporate maintenance contracts and visit scheduling |
| 9 | **AI Agent** | `ai_conversations`, `ai_messages`, `ai_tool_calls` | Customer-facing + admin-facing agent with full action audit |
| 10 | **Comms** | `message_templates`, `message_log` | WhatsApp/SMS templates and delivery audit |
| 11 | **Workforce** | `time_logs` | Clock-in/out, labour time per ticket |
| 12 | **Config** | `app_settings`, `service_zones` | GST number, tax rates, service areas (also drives SEO pages) |

---

## Route structure

```
src/app/
├── (public)/                      visitor panel
│   ├── page.tsx                   homepage
│   ├── services/[slug]/           per-service landing (screen, battery, hinge…)
│   ├── locations/[zone]/          per-area landing (dwarka-mor, janakpuri…)
│   ├── estimator/                 interactive cost calculator
│   ├── diagnose/                  AI diagnostic assistant
│   ├── track/[jobCard]/           public job status lookup
│   ├── catalog/                   refurbished stock
│   ├── book/                      doorstep booking
│   ├── business/amc/              corporate AMC
│   └── business/wholesale/        B2B parts enquiry
│
├── (auth)/login
│
├── admin/                         staff console
│   ├── dashboard/                 KPIs: TAT, FTFR, margin, utilisation
│   ├── tickets/                   Kanban + list, intake wizard
│   ├── customers/                 CRM, device history
│   ├── inventory/                 stock, serials, POs, low-stock
│   ├── invoices/                  billing + GST PDF
│   ├── rma/                       vendor returns
│   ├── amc/                       contracts
│   ├── leads/                     inbound pipeline
│   ├── conversations/             WhatsApp inbox + takeover
│   ├── agent/                     admin AI copilot
│   ├── team/                      staff, roles, attendance
│   └── settings/                  business config, tax, templates
│
└── api/
    ├── webhooks/whatsapp          Evolution API inbound
    ├── webhooks/n8n               automation callbacks
    └── agent/                     AI tool endpoints
```

---

## The AI layer (three distinct agents)

**1. Public diagnostic assistant** — `/diagnose`
Guides a visitor through symptoms, returns likely cause + price range from
`service_catalog`, converts to a booking. Read-only. No customer data access.

**2. WhatsApp service agent** — inbound via Evolution API → n8n
Answers status queries, prices, warranty, location. Reads `repair_jobs`,
`service_catalog`, `warranty_records`. Escalates to human on: explicit request,
frustration, discount request, low confidence, or out-of-scope. Honours the
`session_state` pause — **never replies when a human has taken over**.

**3. Admin copilot** — `/admin/agent`
Staff-facing. Natural-language questions over operational data
("which tickets breach TAT today?", "reorder list for this week"). Can *propose*
mutations but every write goes through the same server actions and RLS as the UI —
the agent gets no privileged path.

### Grounding contract
The agent may state: store location, hours, services, catalog prices, job status,
warranty terms, refurbished stock, booking info.
It must never invent: a price, a stock figure, a discount, a diagnosis, a
completion date, or a warranty term. Missing data → "let me have staff confirm
that" + escalate.

Every tool invocation is persisted to `ai_tool_calls` with arguments, result and
status, so any answer the agent gave can be reconstructed and audited.

---

## Delivery phases

Each phase is independently shippable and leaves the app working.

| Phase | Scope | Unblocks |
|-------|-------|----------|
| **0** | Schema (Parts A+B), brand/identity fix, local verification tooling | everything |
| **1** | Service catalog seed + public estimator + service/location pages | SEO traffic, lead capture |
| **2** | Counter intake wizard, ticket Kanban, status log | paperless shop floor |
| **3** | Inventory: serials, stock moves, low-stock, POs | stops shrinkage |
| **4** | Billing: deposits, payments, GST PDF (exists — needs wiring to tickets) | cash reconciliation |
| **5** | WhatsApp inbound/outbound + templates + human takeover | automated comms |
| **6** | AI: public diagnostic → WhatsApp agent → admin copilot | the owner's priority |
| **7** | RMA, AMC, attendance, analytics dashboard | margin visibility |

---

## Metrics the dashboard must compute

- **Mean TAT** — intake → QC pass. Target < 24h modular, < 48h chip-level.
- **First-Time Fix Rate** — no rework within 30 days. Target > 92%.
- **Gross margin per ticket** — (revenue − parts cost) / revenue. Target > 40%.
- **Technician utilisation** — billed labour hours / clocked hours.

All four are derivable from `repair_jobs`, `ticket_status_log`, `job_parts_allocated`
and `time_logs` — which is why the audit trail tables are not optional.
