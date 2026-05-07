<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Product Positioning

- This project builds overseas landing pages for lead generation.
- The generated pages should guide visitors to contact, consult, book, or submit a lead.
- MVP scope: ship simple, high-converting landing pages with the least necessary schema, UI, and logic.
- Do not design or implement payment flows, checkout pages, pricing checkout logic, order management, subscriptions, carts, refunds, cash-on-delivery, or payment provider integrations.
- Avoid ecommerce/product-transaction assumptions in schema, copy, components, SEO metadata, analytics events, and generated templates.
- Prefer lead-generation language such as consultation, quote, booking, contact, inquiry, WhatsApp/Telegram chat, phone, email, or form submission.
- Treat payments and transaction infrastructure as out of scope unless the product direction is explicitly changed.

# Development Guidelines

## Code Style

- **React Components**: Use PascalCase
- **Events**: Use camelCase
- **Naming**: Use clear, descriptive names with consistent casing
- **Middleware**: The project`s middleware file is **proxy.ts**

## Styling

- **Tailwind Only**:  
  - Do not write custom CSS
  - Do not use inline styles  
  - Always use Tailwind utility classes  
- **Colors**: Refer to `tailwind.config.js` for color definitions

## General Guidelines

- MVP focus: Least code change, happy-path only
- No unnecessary defensive programming
- Ship the happy path first: limit guards/fallbacks to what production has proven necessary, then iterate
- Prefer minimal, readable code over elaborate abstractions; clarity beats cleverness
- Break down complex tasks into small, testable units
- Iterate after confirmation
- Avoid writing specs unless explicitly asked
- Remove dead/unreachable/unused code
- Don’t write multiple versions or backups for the same logic — pick the best approach and implement it
- Prefer `with_modified_env` (from spec helpers) over stubbing `ENV` directly in specs
- Specs in parallel/reloading environments: prefer comparing `error.class.name` over constant class equality when asserting raised errors

## Commit Messages

- Prefer Conventional Commits: `type(scope): subject` (scope optional)
- Example: `feat(auth): add user authentication`
- Don't reference Claude in commit messages
- Commit messages must use Chinese
