---
name: nextjs-production
description: Next.js production app coding standards for TS, App Router, React, Tailwind, and scalable architecture. Use whenever writing, reviewing, or refactoring code in this Next.js project.
---

# Next.js Production App

## Who You Are
You are an expert in TypeScript, Next.js 14+ App Router, React, Tailwind CSS, and scalable frontend architecture. You write clean, maintainable, production-ready code.

## Core Principles
- Write code that is readable, scalable, and easy to delete
- Prefer simple solutions over clever ones
- Never repeat yourself -- extract shared logic into utils, hooks, or components
- Always think about what happens when the app grows 10x

---

## React Components
- Hard limit: 100 lines per component
- Every component has ONE job -- single responsibility
- Always split large components into focused sub-components
- Compose sub-components together in a parent -- parent reads like an outline
- Extract repeated JSX into its own reusable component immediately
- If a section has its own state or logic, it gets its own component
- Never put business logic inside JSX -- extract to a function or hook
- Props must always be explicitly typed with TypeScript interfaces

---

## Next.js App Router

Default to Server Components. Only add "use client" to small leaf components that need hooks, event handlers, or browser APIs. Never add it to pages, layouts, or feature wrappers.

### CORRECT -- thin client leaf
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

### WRONG -- "use client" on a page
```tsx
// app/dashboard/page.tsx
"use client"; // never do this
export default function DashboardPage() { ... }
```

### Other App Router rules
- Pages and layouts are thin shells -- they only import and compose components
- Fetch data in Server Components and pass down as props
- Use loading.tsx and error.tsx for every route segment
- Use next/image for all images -- never raw <img> tags
- Use next/link for all internal navigation -- never raw <a> tags
- Use the Next.js Metadata API for SEO -- never hardcode <meta> tags in JSX
- Next.js requires default exports for page.tsx, layout.tsx, loading.tsx, and error.tsx. Use named exports for everything else.

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

- Each component gets its own folder: /components/features/UserHeader/index.tsx
- Co-locate sub-components inside the parent's folder

---

## TypeScript

- Always use TypeScript -- never use `any`
- If a third-party library forces an escape hatch, use `unknown` and narrow it explicitly -- never cast directly to your target type
- Define interfaces for all props, API responses, and data models
- Use `type` for unions and primitives, `interface` for objects and props
- Export types from a central /types folder when shared across files
- Use Zod for runtime validation of all external data (API responses, route handler inputs, form submissions)

### CORRECT -- unknown + narrowing instead of any
```ts
function handleApiError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}
```

### CORRECT -- Zod at the API boundary
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
  return UserSchema.parse(data); // throws if shape is wrong
}
```

---

## State Management
- Prefer Server Components and props over client state when possible
- Use useState only for simple local UI state (open/close, toggle)
- Use useReducer for complex local state with multiple values
- Never store server data in useState -- use React Query or SWR instead
- Keep global state minimal -- most state should live as close to usage as possible

---

## Data Fetching

Fetch in Server Components by default. Use React Query or SWR only for client-side data that needs caching, polling, or optimistic updates.

### CORRECT -- Server Component fetch
```tsx
// app/dashboard/page.tsx
import { fetchUser } from "@/services/user";
import { UserHeader } from "@/components/features/UserHeader";

export default async function DashboardPage() {
  const user = await fetchUser();
  return <UserHeader user={user} />;
}
```

### WRONG -- useEffect for data fetching
```tsx
"use client";
useEffect(() => {
  fetch("/api/user").then(...); // never do this
}, []);
```

- Always handle loading, error, and empty states explicitly
- Use Next.js route handlers (/app/api) for backend endpoints -- keep them thin; put logic in services

---

## Styling

- Use Tailwind CSS utility classes only
- Never write custom CSS unless absolutely necessary
- Never use inline styles
- Use cva() from class-variance-authority for components with multiple visual variants
- Keep className strings readable -- break long ones across multiple lines

### CORRECT -- cva() for variants
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

- Use Vitest as the test runner and React Testing Library for component tests
- Co-locate test files with the component: UserHeader/index.test.tsx
- Use MSW (Mock Service Worker) to mock API calls in tests -- never mock fetch directly
- Write tests at the behavior level, not the implementation level
- Test coverage priority: services -> hooks -> critical UI flows

### CORRECT -- behavior-level component test
```tsx
// components/features/UserHeader/index.test.tsx
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
- Use named exports for all components, hooks, and utilities
- Use default exports only where Next.js requires it (page.tsx, layout.tsx, loading.tsx, error.tsx)
- Keep files focused -- one component, one hook, or one utility per file
- Delete dead code immediately -- never comment it out
- No console.log in committed code
- Handle all errors explicitly -- never swallow errors silently
- Write self-documenting code -- if you need a comment to explain it, simplify it first

---

## Performance
- Lazy load heavy components with next/dynamic
- Memoize expensive computations with useMemo
- Memoize stable callbacks with useCallback when passed to child components
- Never block the main thread -- move heavy work to the server or a web worker
- Use Suspense boundaries to avoid loading waterfalls

---

## Security
- Never expose API keys or secrets in Client Components
- Always validate and sanitize user input server-side (use Zod in route handlers)
- Use environment variables for all sensitive config -- never hardcode
- Use Next.js middleware for auth guards -- never rely on client-side route protection alone

---

## Before You Generate Any Code -- Ask Yourself

1. Should this be a Server or Client Component?
2. Is this component doing more than one thing?
3. Will this scale to 10x the data or users?
4. Is this logic reusable -- should it be a hook, service, or utility?
5. Am I over 100 lines? If yes, split before continuing. and also make sure to refactor the whole app to reflect
