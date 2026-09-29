# Sign-up and sign-in go through the better-auth client, not a server action

Every other form in the store follows one pattern: a server action validates with Zod and returns an `ActionResult`. Sign-up and sign-in break it on purpose. Their forms are Client Components that call `authClient` (`createAuthClient`), which sends a plain HTTP request to `/api/auth/*`.

The reason is the rate limit. better-auth enforces it in its HTTP router, so calling `auth.api.signInEmail()` from a server action runs the endpoint directly and skips the limit. A sign-in form with no limit on attempts leaves brute force open, and closing that is the point of the auth feature.

We considered three other ways to keep server actions:

- **Server action calling `auth.api.*` with nothing else.** No rate limit at all. Rejected.
- **Server action calling `auth.api.*`, plus our own `rateLimit.customStorage`.** Since we'd write `consume(key, rule)` ourselves, the action could call it too, giving one limiter for both paths. Rejected because we'd own an atomic counter under concurrency. better-auth's own JSDoc says they dropped their `get`/`set` storage interface because it "cannot enforce a distributed limit under concurrent requests". A broken rate limiter fails silently: no error, no failing test, it just stops counting. Consistency across two screens isn't worth that risk.
- **Server action that builds a `Request` and calls `auth.handler()`.** The limit applies, but we'd be reimplementing `fetch`: forwarding headers, client IP and `Origin`, and rewriting `Set-Cookie` by hand. Every one of those is a chance to get security-relevant plumbing wrong.

Costs we accept: the two forms ship more JavaScript, and validation moves out of the action. It now runs in three layers: the Zod form schema in the browser for feedback, better-auth's own checks on the server, and a `hooks.before` in `src/server/auth.ts` for the rules the library doesn't cover, like `name`. The hook runs inside the router, after the rate limit, so a hand-crafted `curl` hits the same server-side rules as the form.

Sign-out is the exception and stays a server action (`auth.api.signOut` with the `nextCookies()` plugin). It doesn't need a rate limit, and a plain `<form>` works without JavaScript and invalidates the router cache with `redirect()`.

Everything we write ourselves (Cart, Checkout, Admin) keeps the server action pattern. The auth forms still produce an `ActionResult`, so error UI looks the same across the store even though the transport underneath differs.
