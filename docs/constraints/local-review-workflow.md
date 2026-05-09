# Local Review Workflow

Local review is a quality gate for a logical change set. Run it at most once for
the same change set.

Valid trigger modes:

- Pre-commit review: run after code changes and before creating a commit.
- Post-commit review: run after a commit exists, against a specific commit or
  commit range.

Default to pre-commit review when the agent created the changes in the current
working tree. Use post-commit review only when a commit already exists, the user
explicitly asks to review a commit or commit range, or pre-commit review did not
run.

Do not run local review twice for the same logical change set.

- If pre-commit local review has passed, do not run post-commit local review for
  the commit created from that same diff.
- If post-commit local review has passed, do not run it again unless new commits
  or new uncommitted changes exist.
- If changes are made after a local review, treat the updated diff as a new
  change set and review that updated change set once.

Review scope must be explicit:

- Pre-commit review scope is the current uncommitted diff.
- Post-commit review scope is the reviewed commit hash or commit range.

For every local review:

- Verify each finding against the current codebase before editing.
- Identify the exact file and failing behavior.
- Make the smallest behavior-preserving fix.
- Run the smallest relevant validation command before reporting completion.
- For React or TSX changes, `npm run lint` must finish with zero errors.
- Existing warnings may remain only when they are unrelated and explicitly
  reported.
- Final response must include the reviewed scope, changed files, validation
  command, and remaining unrelated warnings or risks.

When fixing review findings:

- In pre-commit mode, fix findings before creating the commit.
- In post-commit mode, add fixes as a follow-up commit unless the user explicitly
  asks to amend.
- JSX text nodes must not introduce raw unescaped quote characters, apostrophes,
  `<`, `>`, or similar characters that violate ESLint rules. Use HTML entities
  or string expressions.
