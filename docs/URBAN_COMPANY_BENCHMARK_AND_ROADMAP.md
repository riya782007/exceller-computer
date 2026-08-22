# Exeller service-experience benchmark and roadmap

## Product position

Exeller should borrow the **clarity, convenience, trust and accountability** of a modern service platform—not copy a general marketplace. Urban Company positions its service model around convenience, reliability and care, and publicly stresses qualification of service partners and transparent, contextual pricing. [Urban Company investor relations](https://investorrelations.urbancompany.com/) · [Urban Company pricing explainer](https://www.urbancompany.com/articles/understanding-ac-service-charges-in-india) · [Urban Company impact](https://www.urbancompany.com/impact)

For computer repair, Exeller can deliver a more valuable promise than a broad marketplace: **one accountable local technical team, a diagnosis-first approval path, exact device knowledge, visible job progress and an AI concierge that does not make false commitments.** Content was rephrased for compliance with licensing restrictions.

## Benchmark: lessons to adopt, and Exeller’s advantage

| Service-platform pattern | What customers expect | Exeller current foundation | Gap / differentiation |
| --- | --- | --- | --- |
| Guided discovery | Customers choose a category, understand the next step and are not forced to call before they know what will happen. | Service catalog, estimator, contact routes and public AI concierge. | Make the entry experience feel like a guided service desk rather than a brochure. **Phase 1: implemented in this release (pending merge/deployment).** |
| Upfront context | Ranges, inclusions, timing and policies are visible before booking. | Price bands, turnaround and warranty terms are already in the reviewed catalog. | Present these benefits earlier and keep the exact-quote boundary explicit. **Phase 1: implemented in this release (pending merge/deployment).** |
| Trust at every step | Customers see why a provider is safe, what happens next and where human accountability sits. | Approval-first messaging, WhatsApp, private operational workspace and invoices. | Turn those claims into an understandable journey and customer promise. **Phase 1: implemented in this release (pending merge/deployment).** |
| Frictionless handoff | A visitor can self-serve, talk to a human or make a structured request without starting over. | Estimator captures a lead and WhatsApp uses structured prefill; Exeller Assist offers safe multilingual help. | Surface the right handoff by intent and ensure the sales desk sees it. **Phase 1: implemented in this release (pending merge/deployment).** |
| Service operations console | Teams can see demand, respond quickly and consistently manage service quality. | Leads, jobs, invoices, inventory, WhatsApp controls, Owner Copilot and Visitor Agent Studio. | Replace isolated module navigation with a decision-oriented front desk dashboard. **Phase 1: implemented in this release (pending merge/deployment).** |
| Marketplace-scale fulfilment | Dispatch, live professional assignment, slot availability, cancellation and post-service ratings. | Not yet applicable to a single workshop until operations and field capacity are verified. | Build only when actual technicians, service areas and SLA ownership are in place. **Phases 2–4.** |

## Differentiated value proposition

> **The clarity of a service app, with the accountability of a specialist repair workshop.**

1. **Diagnosis before commitment:** Exeller never masks uncertainty with a fake fixed price.
2. **Device-specific expertise:** recommendations use brand, model and fault context—not a generic home-services category.
3. **Human + AI concierge:** English, Hindi and Hinglish visitors get fast guidance, then move to a verified human/WhatsApp/estimator path.
4. **Approval-first repair:** no work starts before the customer knows the confirmed plan.
5. **One operational record:** leads, intake, technician work, parts and invoicing become traceable in the same console.

## Phased delivery plan

### Phase 1 — Guided service desk and conversion control (**implemented in this release**)

**Customer experience**
- Premium, interactive “choose your outcome” service journey on the homepage: repair, performance upgrade, buying guidance and business IT.
- Visible customer promise and transparent repair lifecycle.
- Exeller Assist is promoted as a first-class route, not a hidden widget; it opens directly from the journey.
- Customer-safe guided paths to estimator, relevant service pages, WhatsApp and phone.

**Operations**
- Dashboard becomes a front-desk command surface: lead funnel, repair workload and direct links to the Visitor Agent Studio / Owner Copilot / WhatsApp queue.
- A documented competitive benchmark keeps future scope based on real service-business value.

**Measurement plan (Phase 1.1 instrumentation)**
- Instrument estimator starts, agent opens and WhatsApp handoffs only after the owner selects a consent-aware analytics provider and retention policy.
- Record new-lead response time and lead-to-job conversion from operational timestamps once customer/lead-to-job linking is confirmed.

### Phase 2 — Bookable repair intake and service updates

**Build only after owner confirms** pickup areas, appointment windows, doorstep capability, diagnostic fee rules and response SLA.
- A structured repair-request flow that creates a lead with consent and a requested mode (walk-in, pickup/drop or on-site where supported).
- Explicit time-window request—not a promised booking until staff accepts it.
- A customer-facing, privacy-preserving job-status lookup using signed links or verified OTP—not raw job-card numbers.
- Staff assignment, customer approval requests and change-log notifications.

**Success metrics**
- Completed intake rate, accepted-window rate, time-to-first-reply, quote-approval rate and no-show rate.

### Phase 3 — Trust, aftercare and repeat revenue

- Verified post-service review request after delivery.
- Digital warranty / service-summary card linked to the actual job and invoice.
- Data-safe maintenance reminders, upgrade eligibility and business/AMC follow-up with consent.
- Service quality dashboard: turnaround distribution, repeat faults, warranty claims and customer satisfaction.

**Success metrics**
- Review completion, repeat-customer rate, upgrade/AMC conversion and warranty-resolution time.

### Phase 4 — Controlled field-service scale

- Service-area rules, technician skills, capacity, job-routing recommendations and staff mobile workflow.
- Live visit tracking only when a customer explicitly books and consents; never broad employee or visitor tracking.
- Service-level reporting and exception management.

**Success metrics**
- On-time arrival, first-visit resolution, utilization, cancellation rate and contribution margin per service mode.

## Guardrails

- The AI does not diagnose conclusively, set final prices, report stock, promise a time slot, take payment or access private customer data.
- Public recommendations and payment links remain owner-approved in Visitor Agent Studio.
- Customer/job images remain private; only deliberately published marketing assets may be public.
- Never copy Urban Company branding, content, app flows or claims. Use the underlying service-design principles for Exeller’s own specialist workshop experience.
