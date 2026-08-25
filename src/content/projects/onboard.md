---
title: "Onboard"
description: "Multi-tenant SaaS for employee onboarding — per-team templates, per-hire editable cases, and a role-scoped permission layer built strictly test-first."
tags: ["C#", ".NET", "React", "PostgreSQL"]
status: wip
featured: true
lastUpdated: 2026-08-25
---

## The problem

Onboarding a new hire usually means a checklist living in a spreadsheet that gets copy-pasted per person, drifts from the original immediately, and gives no answer to "who's allowed to change this?" HR wants oversight across the company, managers only care about their team, mentors only care about their mentee — and a spreadsheet gives everyone everything or nothing.

## The solution

A multi-tenant API where each company defines per-team onboarding templates, and every new hire gets their own *onboarding case* — a mutable copy of the template that keeps a traceability link back to its source. Managers, HR, and mentors work through the case together, each seeing only what their role allows.

All permission rules live in a single pure service — plain objects in, bool out, no database access — with every check enforcing company (tenant) isolation before any role logic runs. The whole permission matrix was built test-first: 27 tests written against interface stubs, red before green, before a single controller existed. `RoleAuthMiddleware` parses the JWT once per request and attaches user, company, and role to the request context for everything downstream.

On top of that now sits real auth. `POST /api/signup` bootstraps a company and its first HR Admin together — solving the multi-tenant chicken-and-egg where the first admin can't be created by an admin. `POST /api/auth/login` exchanges credentials for a signed JWT (HS256), with every failure mode returning an identical result so the endpoint leaks nothing about which accounts exist. The protected endpoints — `POST /api/users` (HR-Admin-only user creation), `GET /api/users` (a tenant-scoped list filtered by what your role is allowed to see), and `POST /api/cases` (case provisioning) — sit behind `[Authorize]`, and the acting user is loaded fresh from the database on every request rather than trusted from the token, so a demoted user loses access immediately. Status codes carry intent: `403` for authenticated-but-not-allowed, `404` to disguise cross-tenant resources rather than confirm they exist. The codebase is organised into feature-folder vertical slices (Auth, Signup, Users, Onboarding, Permissions) rather than by technical layer.

A React frontend now sits on top of the API: login, logout, session persistence, and screens to create and list users — built test-first with Vitest and React Testing Library, the same discipline as the backend. The onboarding-case UI is the next slice.

## Stack

- **ASP.NET Core Web API (.NET 10, C#)** — the backend, structured as a monorepo alongside the frontend
- **PostgreSQL via EF Core / Npgsql** — Docker locally, Supabase in production; every tenant-scoped row carries a `CompanyId`
- **Vite + React** — the frontend: login, logout, session persistence, and user create/list screens, talking to the API over HTTP only
- **BCrypt.Net-Next** — password hashing, salted and deliberately slow
- **JWT (HS256)** — stateless bearer auth; tokens carry `sub`, `company_id`, and `role`, validated by the JWT bearer middleware with no server-side session
- **xUnit + Moq** — backend tests; the permission layer needs no mocks because it's pure
- **WebApplicationFactory** — functional tests boot the whole app in-memory and fire real HTTP through the full pipeline (routing, DI, middleware, JWT validation), swapping Postgres for in-memory SQLite; the suite is up to 66 tests
- **Vitest + React Testing Library** — frontend tests, written test-first alongside the UI rather than after it

## What I learned

- Keeping the permission service pure (no DB access) makes TDD nearly frictionless — the 27 permission tests run without a single mock of anything stateful
- Writing permission rules test-first surfaces edge cases early: mentor access ended up requiring *both* the mentor pairing and shared team membership, guarding against stale pairing data
- In multi-tenant systems, checking tenant isolation first in every rule — before any role logic — is the habit that prevents the worst class of bug
- Designing the domain model (template vs. case vs. task) before writing any endpoints made the permission matrix much easier to reason about
- Guard ordering matters as much as the guards themselves: the teamless-hire check has to run *before* the team-mismatch check, or a hire with no team ends up misclassified as "wrong team" with a misleading error
- Returning failures as data (a `ProvisioningResult` with `Success`/`Failure` factories) instead of throwing suits an API boundary better — bad IDs are an expected condition, not an exceptional one
- Testing against SQLite in-memory mode instead of EF Core's InMemory provider actually enforces foreign keys, unique indexes, and delete-behavior rules the fake provider would silently let through
- Returning an identical result for every login failure — wrong email, wrong password, no password set — keeps the endpoint from leaking which accounts exist
- Loading the acting user fresh from the database on each request, instead of trusting the token's claims, means a permission change takes effect immediately instead of lingering until the token expires
- Read-side authorization is its own design problem: `GET /api/users` filters the list through a `CanViewUser` rule rather than returning everything, so what you *can't see* is guarded as carefully as what you can't edit
- Scalar (`/scalar/v1`) turned out to be the fastest way to actually exercise the API by hand — issue a login, paste the JWT, and hit protected endpoints without writing a client or reaching for Postman

## What broke

Integration tests booted the whole app but every authenticated request came back `401` — the JWT bearer middleware wasn't using the signing key the tests were issuing tokens with. Overriding it through configuration silently didn't take under minimal hosting; the fix was to post-configure `JwtBearerOptions` directly to force a known key. A reminder that config-based overrides which work in normal hosting can quietly do nothing inside `WebApplicationFactory`.

Earlier, I'd registered `IOnboardingProvisioningService` in DI — but every provisioning test constructs the service directly, so the whole suite stayed green while the real app 500'd on the first call. Only showed up by hitting the API through Scalar. One-line fix (`builder.Services.AddScoped<IOnboardingProvisioningService, OnboardingProvisioningService>()`), but a reminder that tests bypassing the container can't catch container wiring bugs.

## What's next

- Frontend: the onboarding-case UI — building on the login and user-management screens already shipped, currently blocked on a template-listing endpoint
- Tenant-scoped search across users, teams, and templates — starting with `ILIKE`, then `pg_trgm` + a GIN index for fast, fuzzy name/email matching
- EF global query filters on `CompanyId` as a DB-level tenant-isolation safety net
- Invite / set-password flow — users created via `POST /api/users` currently have no password and can't log in yet
