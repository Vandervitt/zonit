<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Agent Guide

This project builds overseas lead-generation landing pages.

Read these constraint files before making related changes:

- Product scope and positioning: `docs/constraints/product-positioning.md`
- Landing page schema rules: `docs/constraints/landing-page-schema.md`
- Lead capture channels (form-as-primary conversion, anchor CTA, template authoring): `docs/lead-capture-channels.md`
- Generated-page platform compliance (policy subpages, account-level company profiles, consent bar, non-blocking hints): `docs/landing-page-compliance.md`
- Coding style: `docs/constraints/coding-style.md`
- Frontend styling rules: `docs/constraints/frontend-style.md`
- Testing and validation: `docs/constraints/testing-and-validation.md`
- Local review workflow: `docs/constraints/local-review-workflow.md`
- Commit rules: `docs/constraints/commit-guidelines.md`
- Development database migrations: `docs/dev-database-migration-workflow.md`
- Custom domain publishing (architecture, tenancy rewrite, DNS records, gotchas): `docs/custom-domain-publishing.md`
- Billing currency (USD pricing, live FX display, Dodo Adaptive Currency, provider parity): `docs/billing-currency.md`

Hard rules:

- Platform billing is allowed for Urgizat's own SaaS customers, but generated landing pages must stay non-transactional.
- Do not introduce payment, checkout, cart, order, subscription, refund, cash-on-delivery, or ecommerce transaction concepts into generated landing pages.
- This project uses `proxy.ts` as middleware.
- Tailwind only: no custom CSS and no inline styles.
- Commit messages must use Chinese Conventional Commits.
- Functions run in `sin1` (`vercel.json` `regions`) and the production Neon database is in `aws-ap-southeast-1`; they must stay co-located. Each authenticated request makes 5+ sequential DB round trips (proxy `auth()` + route `auth()` + queries), so moving only one side multiplies cross-region latency.

# IMPORTANT
"IMPORTANT: After finishing the code and passing local tests, you MUST execute git commit with a JSON summary in the message. Do not wait for user input to exit."
