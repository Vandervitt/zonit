# Landing Page Schema Rules

- Product schema should express landing-page marketing logic first; editor, renderer, zod validation, and templates should adapt to the product model.
- Every landing page must have a `primaryConversion`.
- `primaryConversion` must point to a real lead path through `destination`: URL, phone, email, or form.
- `primaryConversion.channel` and `primaryConversion.destination.type` must describe the same lead path.
- Do not model primary conversion as a loose optional `url`.
- If any CTA or `primaryConversion.destination.type` is `form`, the page must include the matching single `leadForm`.
- A page should have at most one `leadForm`.
- Lead forms must collect at least one reachable contact field: `phone`, `email`, `whatsapp`, or `telegram`.
- `name` may be collected, but `name` alone is not a valid lead.
- Extra form fields should be lightweight qualification fields, such as service type, budget range, target country, appointment preference, or inquiry details.
- Attribution means identifying which CTA, form, or channel produced the lead.
- Analytics events for generated landing pages must stay lead-generation oriented, not purchase or checkout oriented.
- Do not require a fixed market or visitor region in the schema.
- `locale` may be optional and should fall back to English when runtime detection is unavailable.
- Generic contact URLs should be modeled as lead-oriented consultation links only, and must not point to purchase, checkout, cart, order, subscription, refund, or payment pages.
- The footer must include at least one compliance link or inline policy entry.
- Trust and compliance structures should support reviews, trust badges, authority story, FAQ, assurance, privacy policy, and disclaimers.
- Assurance content must avoid transaction semantics such as refund guarantees or payment protection unless product scope explicitly changes.
