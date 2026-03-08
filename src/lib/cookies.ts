/**
 * Parse a Cookie header string into an array of { name, value }.
 * Used by API routes and auth handlers that create Supabase server client with request cookies.
 */
export function parseCookieHeader(header: string | null): { name: string; value: string }[] {
  if (!header || typeof header !== "string") return [];
  return header.split(";").map((part) => {
    const [name, ...rest] = part.trim().split("=");
    const value = rest.join("=").trim();
    return { name: name?.trim() ?? "", value: value ?? "" };
  }).filter((c) => c.name.length > 0);
}
