export const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

/**
 * Normalize user-entered domain input into a bare hostname.
 * Strips scheme, path, query, port, surrounding whitespace and a trailing dot.
 * Returns the lowercased hostname, or null when it is not a valid domain.
 */
export function normalizeDomain(input: string): string | null {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "") // scheme
    .replace(/[/?#].*$/, "") // path / query / fragment
    .replace(/:\d+$/, "") // port
    .replace(/\.$/, ""); // trailing dot

  return DOMAIN_RE.test(host) ? host : null;
}
