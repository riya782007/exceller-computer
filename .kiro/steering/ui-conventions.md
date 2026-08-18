# UI Conventions — Exceller Computer Platform

## Component Library

- Use shadcn/ui as the base component library
- Components installed into `src/components/ui/`
- Customize via Tailwind, not by forking component internals
- Use Radix UI primitives (via shadcn) for accessibility

## Layout Structure

### Public Website
- Responsive mobile-first design
- Navigation: Logo | Services | Estimator | Catalog | Contact | WhatsApp CTA
- Footer: Address, phone, hours, social links, copyright
- WhatsApp floating button on all pages

### Admin ERP
- Sidebar navigation (collapsible on mobile)
- Modules: Dashboard, Jobs, Inventory, Customers, Technicians, Invoices, WhatsApp, Settings
- Top bar: User menu, notifications, search
- Breadcrumbs for navigation context

## Design Tokens

- Primary color: Blue (brand)
- Accent: Green (WhatsApp/success)
- Warning: Amber
- Error: Red
- Background: White/Slate-50
- Dark mode: Support via Tailwind dark: prefix (implement after MVP)

## Responsive Breakpoints

Follow Tailwind defaults:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

## Form Patterns

- Use React Hook Form + Zod resolver
- Show validation errors inline below fields
- Disable submit button during async operations
- Show loading spinners for async actions
- Toast notifications for success/error feedback

## Table Patterns

- Use tanstack/react-table for complex data tables
- Server-side pagination for large datasets
- Column sorting where useful
- Search/filter controls above table
- Action buttons (edit, delete, view) in last column

## Loading States

- Use Suspense + loading.tsx for route-level loading
- Skeleton components for card/list loading
- Spinner for button actions
- Never show blank screens during data fetch

## Error States

- User-friendly error messages (no technical details)
- Retry buttons where appropriate
- Fallback UI via error.tsx boundaries
- 404 pages with navigation back

## Accessibility

- All interactive elements keyboard accessible
- Proper ARIA labels on icons and buttons
- Color contrast meets WCAG AA
- Focus indicators visible
- Screen reader friendly navigation
