import { z } from "zod";

/** Shared pagination query params for list endpoints. */
export const PaginationQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/** Scope parameter for /api/youtube-channel-videos. */
export const ChannelScopeQuerySchema = z.object({
  scope: z.enum(["podcasts", "main-channel"]).default("podcasts"),
});
export type ChannelScopeQuery = z.infer<typeof ChannelScopeQuerySchema>;

/** Chat request body — messages are validated elsewhere by the AI SDK. */
export const ChatRequestSchema = z.object({
  messages: z.array(z.unknown()),
  model: z.string().optional(),
  transcript: z.string().nullable().optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/** Parse URL search params with a Zod schema, throwing a Response on failure. */
export function parseSearchParams<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): z.output<T> {
  const { searchParams } = new URL(req.url);
  const raw = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw Response.json(
      { error: "Invalid query parameters", issues: result.error.issues },
      { status: 400 }
    );
  }
  return result.data;
}

/** Parse a JSON body with a Zod schema, throwing a Response on failure. */
export async function parseJsonBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<z.output<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw Response.json(
      { error: "Invalid request body", issues: result.error.issues },
      { status: 400 }
    );
  }
  return result.data;
}
