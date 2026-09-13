# Paye Admin

Admin panel for the Paye platform. Built with **Next.js 16 (App Router)** + **Base UI shadcn** + **TanStack Query**, backed by the Express/Prisma API running on `http://localhost:5000`.

Runs on **port 3005**.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local if your backend URL differs from http://localhost:5000

# 3. Start dev server (port 3005)
npm run dev
```

Open [http://localhost:3005](http://localhost:3005). You will be redirected to `/login`.

### Login

Login is **phone + OTP**, and only users with an existing `Admin` record can sign in.

1. Enter an admin phone number → backend generates an OTP.
2. Retrieve the OTP from the database (Prisma Studio or a query on the `Otp` table).
3. Enter it in the OTP step → you land on the dashboard.

There is **no** email/password fallback, and no public signup. Admins must be created from within the panel (`/admins` → **Add admin**) or seeded directly in the database.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, Turbopack) |
| UI primitives | **Base UI** via shadcn (`style: base-nova`) |
| Styling | Tailwind CSS v4 |
| Icons | lucide-react |
| Data fetching | TanStack Query v5 |
| Forms | react-hook-form + zod |
| Toasts | sonner |
| Auth transport | httpOnly cookie (`paye_admin_token`) |
| Backend | Express + Prisma API at `BACKEND_URL` |

> **Important**: this project uses **Base UI**, not Radix. That means:
> - `<Button asChild>` doesn't exist. Use `render={<Link …/>}` instead.
> - `<DropdownMenuLabel>` must live inside a `<DropdownMenuGroup>`.
> - `Select.onValueChange` receives `string | null`. Coerce before comparing.
> - Portal content (`DialogContent`, `DropdownMenuContent`, etc.) is Base UI-shaped — check the generated `src/components/ui/*.tsx` files before copying code from Radix examples.

---

## Environment variables

`.env.local`:

```env
# Express backend
BACKEND_URL=http://localhost:5000

# URL of the user-facing Paye app, used to build impersonation links
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

Both are read **server-side**. The admin panel never exposes the backend URL or tokens to the browser.

---

## Authentication model

```
Browser ──► Next.js (3005)
   │
   │  httpOnly cookie: paye_admin_token
   ▼
Route Handlers under /api/auth/*
   │
   │  Authorization: Bearer <token>
   ▼
Express backend (5000)
```

- The admin JWT is issued by the backend, stored in an **httpOnly cookie** by our route handlers (`src/lib/auth.ts`), and never touches browser JS.
- Every server-side API call goes through `serverFetch` in `src/lib/api.ts`, which reads the cookie and attaches the `Authorization` header.
- The `/api/admin/*` routes are **proxies**. The browser calls them; they forward to the backend with the token.

### Route protection

1. **Edge middleware** (`src/middleware.ts`) — blocks unauthenticated access to everything except `/login` and `/api/auth/*`.
2. **Layout guard** (`src/app/(dashboard)/layout.tsx`) — server-side check via `getAdminToken()`, redirects to `/login` if missing.
3. **Backend 401/403** — final authority; the UI shows the message as a toast.

---

## Project structure

```
paye-admin/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                 # minimal wrapper for auth pages
│   │   │   └── login/page.tsx             # phone → OTP two-step login
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                 # sidebar + impersonation banner + main
│   │   │   ├── page.tsx                   # dashboard stats (Stage 2)
│   │   │   ├── users/
│   │   │   │   ├── page.tsx               # user list + actions
│   │   │   │   └── [id]/page.tsx          # user detail
│   │   │   ├── listings/
│   │   │   │   ├── page.tsx               # listing list + actions
│   │   │   │   └── [id]/page.tsx          # listing detail
│   │   │   ├── requests/
│   │   │   │   ├── page.tsx               # request list + approve/reject/pending
│   │   │   │   └── [id]/page.tsx          # request detail
│   │   │   ├── admins/page.tsx            # admin list + promote + remove
│   │   │   └── audit-logs/page.tsx        # audit log list + filters + detail
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts         # POST → forwards to backend /login
│   │   │   │   ├── verify/route.ts        # POST → sets paye_admin_token cookie
│   │   │   │   ├── logout/route.ts        # POST → clears cookies
│   │   │   │   └── me/route.ts            # GET  → current admin profile
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── dashboard/route.ts
│   │   │       ├── users/route.ts
│   │   │       ├── users/[id]/route.ts
│   │   │       ├── users/[id]/{block,unblock,verify,unverify}/route.ts
│   │   │       ├── listings/route.ts
│   │   │       ├── listings/[id]/route.ts
│   │   │       ├── listings/[id]/{close,reactivate}/route.ts
│   │   │       ├── requests/route.ts
│   │   │       ├── requests/[id]/route.ts
│   │   │       ├── requests/[id]/{approve,reject,pending}/route.ts
│   │   │       ├── admins/route.ts         # GET list, POST create
│   │   │       ├── admins/[id]/route.ts    # GET detail, DELETE
│   │   │       ├── audit-logs/route.ts
│   │   │       ├── audit-logs/[id]/route.ts
│   │   │       └── impersonation/
│   │   │           ├── [userId]/route.ts
│   │   │           ├── stop/route.ts
│   │   │           └── state/route.ts
│   │   │
│   │   ├── layout.tsx                     # root layout
│   │   ├── providers.tsx                  # QueryClientProvider + Toaster
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── PhoneForm.tsx
│   │   │   │   └── OtpForm.tsx
│   │   │   │
│   │   │   ├── dashboard/                 # shared toolkit
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── DataTable.tsx          # generic table (loading/empty/error)
│   │   │   │   ├── Pagination.tsx         # skip/take-based (adapt for page/limit)
│   │   │   │   ├── SearchInput.tsx        # debounced
│   │   │   │   ├── StatusBadge.tsx        # success/warning/danger/info/muted
│   │   │   │   └── ConfirmDialog.tsx      # optional type-to-confirm
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── UserFilters.tsx
│   │   │   │   ├── UserActionsMenu.tsx
│   │   │   │   ├── UserProfileCard.tsx
│   │   │   │   ├── UserDetailTabs.tsx
│   │   │   │   ├── UserListingsTab.tsx
│   │   │   │   └── UserRequestsTab.tsx
│   │   │   │
│   │   │   ├── listings/
│   │   │   │   ├── ListingFilters.tsx
│   │   │   │   ├── ListingActionsMenu.tsx
│   │   │   │   ├── ListingProfileCard.tsx
│   │   │   │   └── ListingDetailTabs.tsx
│   │   │   │
│   │   │   ├── requests/
│   │   │   │   ├── RequestFilters.tsx
│   │   │   │   ├── RequestActionsMenu.tsx
│   │   │   │   └── RequestDetailView.tsx
│   │   │   │
│   │   │   ├── admins/
│   │   │   │   ├── AdminActionsMenu.tsx
│   │   │   │   ├── AdminDetailDialog.tsx
│   │   │   │   └── AdminPromoteDialog.tsx
│   │   │   │
│   │   │   ├── audit-logs/
│   │   │   │   ├── AuditLogFilters.tsx
│   │   │   │   └── AuditLogDetailDialog.tsx
│   │   │   │
│   │   │   └── impersonation/
│   │   │       ├── ImpersonationBanner.tsx
│   │   │       └── ImpersonateButton.tsx
│   │   │
│   │   └── ui/                            # shadcn (Base UI) — do not hand-edit unless necessary
│   │
│   ├── lib/
│   │   ├── hooks/
│   │   │   ├── use-admin-users.ts
│   │   │   ├── use-admin-listings.ts
│   │   │   ├── use-admin-requests.ts
│   │   │   ├── use-admin-management.ts   # admins (list/detail/create/delete)
│   │   │   ├── use-admin-audit-logs.ts
│   │   │   ├── use-admin-me.ts
│   │   │   ├── use-dashboard-stats.ts
│   │   │   ├── use-debounced-value.ts
│   │   │   └── use-impersonation.ts
│   │   │
│   │   ├── constants/
│   │   │   └── audit.ts                  # AUDIT_ACTIONS, AUDIT_TARGET_TYPES, actionVariant()
│   │   │
│   │   ├── types/
│   │   │   └── admin.ts                  # every backend response type
│   │   │
│   │   ├── api.ts                        # server-side fetch wrapper (serverFetch)
│   │   ├── auth.ts                       # httpOnly cookie helpers
│   │   ├── auth-constants.ts             # cookie names (edge-safe)
│   │   ├── query-client.ts
│   │   └── utils.ts
│   │
│   └── middleware.ts                     # route protection at the edge
│
├── .env.example
├── .env.local                            # not committed
├── components.json                       # shadcn config (base-nova)
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

---

## Patterns to reuse when adding a new page

Every admin resource follows the same shape. If you need to add a new one (say "reports"), copy this checklist:

### 1. Types — `src/lib/types/admin.ts`

Add the response shapes matching the backend controller. Mirror exactly what `res.json(...)` sends — including top-level vs `data` nesting.

### 2. Proxy routes — `src/app/api/admin/<resource>/…`

Thin wrappers around `serverFetch`. No business logic. Handle list and each mutation as a separate file so path params map cleanly.

### 3. Hooks — `src/lib/hooks/use-admin-<resource>.ts`

- One `useQuery` for the list, keyed on `["admin", "<resource>", params]`.
- Use `placeholderData: keepPreviousData` for tables that paginate.
- One `useMutation` per action. Each invalidates:
  - its own list key,
  - `["admin", "dashboard"]` (stats),
  - any related resource lists (e.g. request actions invalidate listings).
- Wrap `onError` with `toast.error(e.message)`.

### 4. Page — `src/app/(dashboard)/<resource>/page.tsx`

- `"use client"` — pages that use React Query must be client components.
- Local state for filters + pagination + open dialogs.
- Build columns for the shared `<DataTable>`.
- Wrap mutations behind `<ConfirmDialog>` for anything destructive.
- **Type-to-confirm** on any delete: pass `confirmText={entity.phone}` or similar.

### 5. Actions menu — `<Resource>ActionsMenu.tsx`

Base UI rules apply:
- Items must be inside `<DropdownMenuGroup>`.
- Label must be inside the same group.
- Use `variant="destructive"` for delete items.
- Disable items that are invalid for the row (self, admin, blocked, etc.).

---

## Adding shared UI

Before adding a shadcn component, check `src/components/ui/` — many are already there. If not:

```bash
npx shadcn@latest add <component>
```

It will install **Base UI**-based components because `components.json` has `"style": "base-nova"`. Do **not** copy Radix-based examples from the shadcn docs — some APIs differ:

| Feature | Radix | Base UI (this project) |
|---|---|---|
| Merge with child | `<Button asChild>` | `<Button render={<Link/>}>` |
| Label placement | anywhere in menu | must be inside `<DropdownMenuGroup>` |
| Select change | `onValueChange: (v: string) => void` | `onValueChange: (v: string \| null) => void` |
| Popover portal | `<DropdownMenuPortal>` | `<Menu.Portal>` (already wrapped in our components) |

---

## Impersonation

Admins can start an impersonation session from any user row (`⋮ → Impersonate`) or from the user detail card.

Flow:

1. `POST /api/admin/impersonation/:userId` → backend issues a `type: "IMPERSONATION"` JWT valid 30 min.
2. Our route handler stores it in the `paye_impersonation_token` **httpOnly** cookie.
3. A yellow banner appears at the top of every dashboard page with:
   - the impersonated user's phone,
   - a live countdown,
   - a **Copy link** button (`http://<frontend>/impersonate?userId=…`),
   - an **Exit** button.
4. Clicking **Exit** clears the cookie and hides the banner.

**Note**: the admin panel does not currently consume the impersonation token on its own API calls — `serverFetch` uses `useImpersonation: false` by default, so all admin endpoints continue to act as the admin. The token exists only to be handed off to the user-facing app.

### What the user app needs to implement

For the loop to fully close, `paye-frontend` needs:

1. A route `/impersonate` that reads the handoff (token or code), verifies it against the backend, and stores a session.
2. A backend endpoint (in `paye-backend`) that exchanges the impersonation token for a normal user session token — e.g. `POST /api/auth/impersonation/verify`.
3. A guard ensuring `IMPERSONATION`-type tokens can only access user endpoints, never admin endpoints.

The backend already has `impersonation.middleware.ts` and `admin.middleware.ts` handling the type distinction; only the exchange endpoint and frontend route remain.

---

## Backend contract reference

All endpoints below are proxied via `/api/admin/*`. Query params and request bodies pass through unchanged.

| Resource | List | Detail | Actions |
|---|---|---|---|
| **Users** | `GET /api/admin/users` — `search`, `isVerified`, `isBlocked`, `skip`, `take` | `GET /users/:id` | `PATCH /:id/block`, `/unblock`, `/verify`, `/unverify`; `DELETE /:id`; `PUT /:id` |
| **Listings** | `GET /api/admin/listings` — `search`, `sport`, `exerciseType`, `location`, `isActive`, `page`, `limit` | `GET /listings/:id` | `PATCH /:id/close`, `/reactivate`; `DELETE /:id`; `PUT /:id` |
| **Requests** | `GET /api/admin/requests` — `search`, `status`, `profileId`, `skip`, `take` | `GET /requests/:id` | `PATCH /:id/approve`, `/reject`, `/pending`; `DELETE /:id` |
| **Admins** | `GET /api/admin/admins` | `GET /admins/:id` (userId) | `POST /admins` — `{ userId }`; `DELETE /admins/:id` |
| **Audit logs** | `GET /api/admin/audit-logs` — `page`, `limit`, `action`, `adminId`, `targetType`, `targetId`, `from`, `to` | `GET /audit-logs/:id` | — (immutable) |
| **Impersonation** | — | — | `POST /api/admin/impersonation/:userId` |

---

## Conventions

- **Naming**: pages and files use kebab-case (`audit-logs/page.tsx`), components use PascalCase (`AuditLogDetailDialog.tsx`), hooks are `use-kebab-case.ts`.
- **Types**: every backend response has a named type in `src/lib/types/admin.ts`. Never use `any` in new page code.
- **Toast wording**: match the backend's `message` field verbatim where possible — it's already user-friendly in most cases.
- **Destructive actions**: always behind a `ConfirmDialog`. Deletes require **typing** a unique identifier (phone, ID, or title) to confirm.
- **Error surfaces**:
  - Backend 4xx with a `message` → toast.
  - Backend 5xx or network → toast + inline banner if the whole page failed to load.
- **Status colors**: use `StatusBadge` with the shared `success | warning | danger | info | muted` variants. Don't invent new colors per page.

---

## Common tasks

### Add a new action to a resource

1. Backend already has it? Skip to step 3.
2. Otherwise add it to the backend controller + route and rebuild the backend.
3. Add a proxy route: `src/app/api/admin/<resource>/[id]/<action>/route.ts`.
4. Add a hook in `src/lib/hooks/use-admin-<resource>.ts`:
   ```ts
   export function use<Action><Resource>() {
     const invalidate = useInvalidate();
     return useMutation({
       mutationFn: (id) => resourceAction(id, "<action>"),
       onSuccess: () => { toast.success("<message>"); invalidate(); },
       onError: (e: Error) => toast.error(e.message),
     });
   }
   ```
5. Wire it into the actions menu behind a `ConfirmDialog` if destructive.

### Add a filter to a table

1. Add the field to the corresponding `*Filters` type.
2. Update `<SearchInput>` or the `Select`/`Input` in `<Resource>Filters.tsx`.
3. Include it in the query params builder in the list hook.
4. Reset `page`/`skip` to 0 when the filter changes.

### Add a column to a table

Edit the `columns: Column<T>[]` array in the page. Cells return `ReactNode`, `className` and `headerClassName` are supported. Keep column count low — the panel targets laptop viewports.

---

## Known gaps / TODO

- **Impersonation handoff to the user app** — see [Impersonation](#impersonation) above. Backend exchange endpoint + frontend `/impersonate` route still needed.
- **Listing edit form** — `PUT /api/admin/listings/:id` exists on the backend but no UI yet. The listing detail page is read-only for now.
- **User edit form** — `PUT /api/admin/users/:id` similarly has no UI.
- **Mobile layout** — sidebar is currently hidden below `md`. A `Sheet`-based mobile drawer is planned but not shipped.
- **Audit log export** — no CSV/JSON download yet; the backend returns paginated JSON only.
- **Rate limiting** — the backend has no rate limiting on admin endpoints. A `express-rate-limit` middleware is planned.
- **CSRF / security hardening** — planned as the final backend step before public deployment.

---

## Scripts

```bash
npm run dev      # next dev -p 3005
npm run build    # production build
npm run start    # serve the production build on 3005
npm run lint     # eslint
```

Type-check without emitting:

```bash
npx tsc --noEmit
```

---

## Deployment notes

- `NEXT_PUBLIC_FRONTEND_URL` and `BACKEND_URL` must be set in the deployment environment.
- The admin panel must be served over **HTTPS** in production — the `secure: true` cookie flag is enabled automatically when `NODE_ENV=production`.
- The backend must be reachable from the admin panel's server (not from the browser). If they're deployed on separate hosts, use an internal URL for `BACKEND_URL`.
- The backend must accept the admin panel's `Origin` for CORS or be on the same site. Currently the panel never talks to the backend from the browser, so CORS is only relevant if you later switch to browser-side calls.

---

## Credits

- Framework: [Next.js](https://nextjs.org)
- UI primitives: [Base UI](https://base-ui.com) via [shadcn](https://ui.shadcn.com)
- Icons: [lucide](https://lucide.dev)
- Data layer: [TanStack Query](https://tanstack.com/query)
- Toasts: [sonner](https://sonner.emilkowal.ski)
- Backend: Express + Prisma (separate repo — `paye-backend`)