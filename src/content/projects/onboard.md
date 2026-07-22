---
title: "Onboard"
description: "Multi-tenant SaaS for employee onboarding — per-team templates, per-hire editable cases, and a role-scoped permission layer built strictly test-first."
tags: ["C#", ".NET", "React", "PostgreSQL"]
status: wip
featured: false
href: "https://github.com/JoshKainV1/Onboard"
lastUpdated: 2026-07-22
---

## The problem

Onboarding a new hire usually means a checklist living in a spreadsheet that gets copy-pasted per person, drifts from the original immediately, and gives no answer to "who's allowed to change this?" HR wants oversight across the company, managers only care about their team, mentors only care about their mentee — and a spreadsheet gives everyone everything or nothing.

## The solution

A multi-tenant API where each company defines per-team onboarding templates, and every new hire gets their own *onboarding case* — a mutable copy of the template that keeps a traceability link back to its source. Managers, HR, and mentors work through the case together, each seeing only what their role allows.

All permission rules live in a single pure service — plain objects in, bool out, no database access — with every check enforcing company (tenant) isolation before any role logic runs. The whole permission matrix was built test-first: 27 tests written against interface stubs, red before green, before a single controller existed. A middleware parses the JWT once per request and attaches user, company, and role to the request context for everything downstream.

## Stack

- **ASP.NET Core Web API (.NET 10, C#)** — the backend, structured as a monorepo alongside the frontend
- **PostgreSQL via EF Core / Npgsql** — Docker locally, Supabase in production; every tenant-scoped row carries a `CompanyId`
- **Vite + React** — frontend, talks to the API over HTTP only
- **xUnit + Moq** — backend tests; the permission layer needs no mocks because it's pure
- **Vitest + React Testing Library** — frontend test tooling, wired up before the UI exists

## What I learned

- Keeping the permission service pure (no DB access) makes TDD nearly frictionless — the 27 permission tests run without a single mock of anything stateful
- Writing permission rules test-first surfaces edge cases early: mentor access ended up requiring *both* the mentor pairing and shared team membership, guarding against stale pairing data
- In multi-tenant systems, checking tenant isolation first in every rule — before any role logic — is the habit that prevents the worst class of bug
- Designing the domain model (template vs. case vs. task) before writing any endpoints made the permission matrix much easier to reason about

## What's next

- Provisioning service: copy a template into a new hire's case
- First EF migration + local Postgres via Docker
- EF global query filters on `CompanyId` as a DB-level tenant-isolation safety net
- Login endpoint issuing JWTs, then controllers and the actual API surface
- Frontend UI — deliberately last, after the domain and permissions are solid
