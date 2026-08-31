# 88West Admin

Next.js 16 admin panel for member verification and vendor management, backed by Supabase.

Three screens: **Login**, **Verify Member**, **Vendors**.

## Setup

```bash
npm install
cp .env.example .env.local     # fill in your Supabase project URL + anon key
npm run dev
```

The database schema is applied separately — ask the maintainer for the current
migrations and run them in the Supabase dashboard's **SQL Editor**.

Vendor logos need a public storage bucket named `vendor-logos`
(**Storage → New bucket**, Public enabled). Uploads fail until it exists.

Grant yourself admin access — authentication alone is not enough:

```sql
insert into public.admin_users (auth_user_id)
select id from auth.users where email = 'you@example.com';
```

## Architecture

### Layering

```
app/         routes only — thin entries that render a screen
features/    one folder per screen: components + hooks, self-contained
services/    all Supabase queries; the only layer that knows about DB rows
store/       Zustand slices (auth, members, vendors, ui)
lib/         Supabase clients, realtime, validation
hooks/       cross-feature hooks (storage, realtime, debounce, lifecycle)
components/  ui primitives + layout + error boundary, feature-agnostic
types/       DB row types, domain models, and the mappers between them
```

The rule that keeps this honest: **dependencies point downward only.** A
service never imports a component; a component never issues a query. Rows
(`snake_case`, `MemberRow`) stop at the service boundary and become domain
models (`camelCase`, `Member`) via mappers in `types/models.ts` — so a column
rename touches one function instead of every screen.

### Why Zustand over Context + useReducer

Context re-renders **every** consumer whenever the provider value changes.
This app has a realtime firehose: an approval on any row pushes a new state
object. Under Context, one INSERT would re-render every card in the queue, the
nav, and the vendor table.

Zustand selectors subscribe per-slice — `useMembersStore(selectIsLive)`
repaints one dot on reconnect and nothing else. Two more properties earn it
here: stores are readable outside React (`useMembersStore.getState()` in the
`AuthProvider` sign-out cleanup and the keyboard-shortcut handler), and
optimistic rollback is a plain function call rather than a dispatched action
round-trip.

Context is still used where it fits — `AuthProvider` owns the auth
*subscription lifecycle*; it just writes into the store rather than providing
a value.

### Data flow: mobile app → Supabase → verification queue

```
Mobile app                Supabase                    Admin panel
----------                --------                    -----------
auth.signUp()        ->   auth.users (hashed pw)
insert members row   ->   public.members
                          status = 'pending'
                               |
                               +- REST  --> fetchMembers()    initial load
                               +- WAL   --> postgres_changes  live INSERT
                                                  |
                                                  v
                                            useMemberQueue
                                                  |
                                            members.store  --> MemberCard
                                                  |
                        <-- UPDATE status -- reviewMember()  admin decides
```

The password is never stored in `public.members`. The mobile app calls
`auth.signUp()`, Supabase hashes the credential into `auth.users`, and the
`members` row carries only the reviewable profile plus workflow state. RLS
enforces the split: a mobile user can insert and read *their own* row; only a
row in `admin_users` unlocks the full queue and the ability to update status.

Concurrency is handled at the database, not in the UI: `reviewMember` updates
`where id = ? and status = 'pending'`, so if two admins click at once the
second matches zero rows and reports "already reviewed" instead of silently
overwriting the first decision.

### Realtime and cleanup

`subscribeToTable` returns **one idempotent teardown function** — there is no
channel object for callers to mislay and no way to unsubscribe twice. It uses
`removeChannel` rather than `channel.unsubscribe()`, because the latter leaves
the entry in the client registry and the socket open. A `disposed` flag guards
the window between teardown and socket close, when a payload can still arrive.

`useRealtimeTable` wraps it declaratively. Handlers are read through
`useLatestRef`, so inline arrow functions do not resubscribe every render; the
effect depends only on what actually defines the subscription.

Other cleanup in the same spirit:

| Resource | Owner | Released by |
|---|---|---|
| Realtime channel | `useRealtimeTable` | effect cleanup → `removeChannel` |
| Auth listener | `AuthProvider` | `subscription.unsubscribe()` |
| In-flight fetches | `useMemberQueue`, `useVendors` | `AbortController.abort()` |
| Toast timers | `ToastViewport` | `clearTimeout` for every visible toast |
| `storage` listener | `useLocalStorage` | `removeEventListener` + `mounted` flag |
| `keydown` listener | `useVendorShortcuts` | `removeEventListener` on unmount |
| Debounce timer | `useDebouncedValue` | `clearTimeout` on change *and* unmount |
| `<dialog>` top-layer | `Modal` | `close()` if unmounted while open |

Timers deliberately live in components, not stores: a Zustand store outlives
the React tree and has no unmount hook to clean up from.

### Local storage

`useLocalStorage` returns `initialValue` on the first client render — matching
what the server rendered — and adopts the stored value in an effect. Reading
storage during render would produce different markup on the client and trip
hydration. `isHydrated` is surfaced so forms can gate on it rather than
flickering.

It syncs across tabs via the `storage` event and survives quota errors and
private-mode denials without taking the app down.

Two things persist, each for a reason:

- **Vendor drafts**, keyed per vendor — closing the modal by accident does not
  discard typing. Cleared on a confirmed save and on an explicit close, so a
  stale draft cannot resurrect over newer server data.
- **Queue filter** — the screen reopens where you left it.

Notably absent:

- **The session.** Supabase already owns it in cookies and rotates it; copying
  it into localStorage would create a second source of truth that goes stale.
- **Login credentials.** Neither the email nor the password is stored. An admin
  console runs on shared terminals often enough that leaving an address behind
  for the next person is worse than the small convenience of prefilling it.

### Vendor logos

Logos live in the public `vendor-logos` bucket; `vendors.logo_path` stores the
object path, never a full URL — so moving buckets or putting a CDN in front is
a config change rather than a data migration.

The upload is **deferred to save**. Picking a file only previews it from a
local `blob:` URL; the bytes are sent when the form is submitted. Uploading on
selection would leave an orphan in the bucket every time an admin cancels or
re-picks. The order matters too: the upload runs *before* the row write, so a
storage failure aborts without creating a vendor pointing at a logo that never
landed, and if the row write then fails the just-uploaded object is removed.
Replacing a logo deletes the previous object once the row points elsewhere.

### Performance

`memo` is applied to `MemberCard` and `VendorRow` specifically because those
lists repaint on every realtime event — and the parents pass `useCallback`
handlers so the comparison actually holds. `useMemo` guards the derived
filtered lists. Elsewhere it is omitted deliberately: memoising a component
that renders once costs more than it saves.

Search filters an already-loaded list in memory (debounced 250ms) — for a
vendor directory this size, a round-trip per keystroke would be slower and
noisier than filtering client-side.

`AppShell` is a Server Component; only `AppNav`, which needs the pathname and
session, is a client island inside it.

### Auth

Defence in depth, three layers:

1. **`proxy.ts`** refreshes the session cookie and redirects signed-out
   visitors before any page renders — no flash of dashboard.
2. **`(dashboard)/layout.tsx`** re-checks `is_admin()` server-side, so a mobile
   member with a valid session cannot render the UI even for a frame.
3. **RLS** is the real boundary. Even with a forged client, Postgres refuses.

`getUser()` is used rather than `getSession()` everywhere on the server: it
validates the token against the auth server instead of trusting a cookie.

The `?next=` redirect param is validated to be a same-origin path — an
unchecked value would be an open redirect.

### Scaling to a fourth screen

Add `features/<name>/{components,hooks}`, a `services/<name>.service.ts`, a
store slice, and a route that renders the screen. Nothing existing changes.
The primitives, error boundary, storage hook, and realtime hook are already
feature-agnostic — the vendor screen reuses every one of them without
modification.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npx eslint src     # lint
```

Verified: `tsc` clean, `eslint` clean, production build succeeds, all routes
serve and gate correctly.
