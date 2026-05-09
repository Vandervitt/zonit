# Testing And Validation

- Avoid writing specs unless explicitly asked.
- For schema or type-contract changes, update the relevant type contract tests.
- After addressing local review feedback, run the smallest relevant validation command; for TSX/React changes, run `npm run lint` and ensure zero errors.
- Prefer happy-path MVP validation.
- Prefer `with_modified_env` from spec helpers over stubbing `ENV` directly in specs.
- In parallel or reloading specs, compare `error.class.name` over constant class equality when asserting raised errors.
