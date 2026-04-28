# CLAUDE.md

This file is automatically loaded by Claude Code in every session for this repo. It describes the coding standards that MUST be followed when writing, reviewing, or refactoring code in this Next.js project.

The full ruleset also lives as a project-local skill at `.claude/skills/nextjs-production/SKILL.md` — treat this file as the authoritative always-on version.

---

## Who You Are

You are an expert in TypeScript, Next.js 14+ App Router, React, Tailwind CSS, and scalable frontend architecture. Write clean, maintainable, production-ready code.

## Core Principles

- Readable, scalable, easy to delete
- Simple over clever
- DRY — extract shared logic into utils, hooks, or components
- Design for 10x growth

---

## React Components

- **Hard limit: 100 lines per component.** If you're about to exceed this, split first, then continue.
- One job per component (single responsibility).
- Split large components into focused sub-components; the parent reads like an outline.
- Extract repeated JSX into its own reusable component immediately.
- If a section has its own state or logic, it gets its own component.
- No business logic in JSX — extract to a function or hook.
- Props are always explicitly typed with TypeScript interfaces.

---

## Next.js App Router

**Default to Server Components.** Only add `"use client"` to small leaf components that need hooks, event handlers, or browser APIs. Never add it to pages, layouts, or feature wrappers.

### Correct — thin client leaf

```tsx
// components/ui/LikeButton/index.tsx
"use client";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
}

export function LikeButton({ postId, initialCount }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Wrong — `"use client"` on a page

```tsx
// app/dashboard/page.tsx
"use client"; // never do this
export default function DashboardPage() { ... }
```

### Other App Router rules

- Pages and layouts are thin shells — they only import and compose components.
- Fetch data in Server Components and pass down as props.
- Use `loading.tsx` and `error.tsx` for every route segment.
- Use `next/image` for all images — never raw `<img>`.
- Use `next/link` for all internal navigation — never raw `<a>`.
- Use the Next.js Metadata API for SEO — never hardcode `<meta>` tags in JSX.
- Next.js requires default exports for `page.tsx`, `layout.tsx`, `loading.tsx`, and `error.tsx`. Use named exports everywhere else.

---

## Folder Structure

```
src/
  app/                   -> routes only (page.tsx, layout.tsx, loading.tsx, error.tsx)
  components/
    ui/                  -> reusable primitives (Button, Input, Card, Badge, Modal)
    features/            -> feature-specific components (UserHeader, StatsGrid, InvoiceRow)
    layouts/             -> page layout wrappers
  hooks/                 -> custom hooks only (useAuth, useDebounce, useLocalStorage)
  lib/                   -> utilities, helpers, constants, config
  services/              -> API calls and data fetching functions
  types/                 -> shared TypeScript types and interfaces
```

- Each component gets its own folder: `components/features/UserHeader/index.tsx`
- Co-locate sub-components inside the parent's folder.

---

## TypeScript

- Always TypeScript — **never `any`**.
- If a third-party library forces an escape hatch, use `unknown` and narrow it explicitly — never cast directly to your target type.
- Define interfaces for all props, API responses, and data models.
- Use `type` for unions and primitives, `interface` for objects and props.
- Export shared types from `src/types`.
- Use Zod for runtime validation at every external boundary (API responses, route handler inputs, form submissions).

### Correct — `unknown` + narrowing

```ts
function handleApiError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}
```

### Correct — Zod at the API boundary

```ts
// services/user.ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
});

export type User = z.infer<typeof UserSchema>;

export async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  const data = await res.json();
  return UserSchema.parse(data);
}
```

---

## State Management

- Prefer Server Components and props over client state.
- `useState` only for simple local UI state.
- `useReducer` for complex local state with multiple values.
- Never store server data in `useState` — use React Query or SWR.
- Keep global state minimal; state lives as close to usage as possible.

---

## Data Fetching

Fetch in Server Components by default. Use React Query or SWR only for client-side data that needs caching, polling, or optimistic updates.

### Correct — Server Component fetch

```tsx
// app/dashboard/page.tsx
import { fetchUser } from "@/services/user";
import { UserHeader } from "@/components/features/UserHeader";

export default async function DashboardPage() {
  const user = await fetchUser();
  return <UserHeader user={user} />;
}
```

### Wrong — `useEffect` for data fetching

```tsx
"use client";
useEffect(() => {
  fetch("/api/user").then(...); // never do this
}, []);
```

- Always handle loading, error, and empty states explicitly.
- Use Next.js route handlers (`app/api`) for backend endpoints — keep them thin; put logic in `services/`.

---

## Styling

- Tailwind utility classes only.
- Never write custom CSS unless absolutely necessary.
- Never use inline styles.
- Use `cva()` from `class-variance-authority` for components with multiple visual variants.
- Keep `className` readable — break long ones across multiple lines.

### Correct — `cva()` for variants

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const button = cva("rounded-md font-medium transition-colors", {
  variants: {
    intent: {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      ghost:   "bg-transparent text-blue-600 hover:bg-blue-50",
    },
    size: {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
    },
  },
  defaultVariants: { intent: "primary", size: "md" },
});

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({ intent, size, className, ...props }: ButtonProps) {
  return <button className={button({ intent, size, className })} {...props} />;
}
```

---

## Testing

- Vitest + React Testing Library.
- Co-locate tests: `UserHeader/index.test.tsx`.
- MSW for API mocks — never mock `fetch` directly.
- Test behavior, not implementation.
- Coverage priority: services → hooks → critical UI flows.

### Correct — behavior-level test

```tsx
import { render, screen } from "@testing-library/react";
import { UserHeader } from ".";

it("displays the user's name and role", () => {
  render(<UserHeader user={{ name: "Ada", role: "admin" }} />);
  expect(screen.getByText("Ada")).toBeInTheDocument();
  expect(screen.getByText("admin")).toBeInTheDocument();
});
```

---

## Code Quality

- Named exports for components, hooks, and utilities.
- Default exports only where Next.js requires them (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
- One component / hook / utility per file.
- Delete dead code — never comment it out.
- No `console.log` in committed code.
- Handle all errors explicitly — never swallow silently.
- Self-documenting code — if you need a comment to explain it, simplify it.

---

## Performance

- Lazy-load heavy components with `next/dynamic`.
- `useMemo` for expensive computations.
- `useCallback` for stable callbacks passed to child components.
- Never block the main thread — move heavy work to the server or a worker.
- Use Suspense boundaries to avoid loading waterfalls.

---

## Security

- Never expose API keys or secrets in Client Components.
- Validate and sanitize all user input server-side (Zod in route handlers).
- Environment variables for all sensitive config — never hardcode.
- Next.js middleware for auth guards — never rely on client-side route protection alone.

---

## Before You Generate Any Code — Ask Yourself

1. Should this be a Server or Client Component?
2. Is this component doing more than one thing?
3. Will this scale to 10x the data or users?
4. Is this logic reusable — should it be a hook, service, or utility?
5. Am I over 100 lines? If yes, split before continuing and refactor the surrounding code to reflect the new structure.
