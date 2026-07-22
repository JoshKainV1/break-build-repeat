---
title: "break.build.repeat"
description: "This site. Built with Astro, React, and Tailwind. Deployed on Cloudflare Pages."
tags: ["Astro", "React", "Tailwind", "Cloudflare"]
status: live
featured: true
href: "https://github.com/JoshKainV1/break-build-repeat"
lastUpdated: 2026-07-22
---

## The problem

Needed a portfolio that reflected how I actually work — not a polished brochure, but an honest record of things built and broken.

## The solution

Static site built with Astro for performance, React for interactive components, Tailwind for styling. Deployed to Cloudflare Pages for global CDN and zero cost.

## Stack

- **Astro** — static output, fast by default, supports React components where needed
- **React** — familiar, component-based, drops in where interactivity is needed
- **Tailwind CSS** — utility-first, fast to iterate without leaving the file
- **Cloudflare Pages** — free, global CDN, deploys on every git push
- **TypeScript** — catches mistakes before they hit the browser

## What I learned

- How Astro's file-based routing and static generation works
- How to connect a GitHub repo to Cloudflare Pages for CI/CD
- How to structure a component-based site from scratch

## What broke

A committed `package-lock.json` (generated on Windows) pinned platform-specific optional dependencies that don't exist on Cloudflare's Linux build image — the first deploy failed. Fixed by removing the lock file, gitignoring it, and letting Cloudflare's build resolve platform deps fresh instead.

## What's next

- Homelab/hardware photos and app screenshots on the familyHub project page
- Expandable career timeline on the About page
- Skill/tech radar interactive diagram
- More projects as they're built
