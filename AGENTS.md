# break.build.repeat

Portfolio site for Josh Kain — Systems Engineer, tinkerer, homelab enthusiast.

## Development

```powershell
npm run dev       # start dev server at localhost:4321
npm run build     # production build
npm run preview   # preview production build
```

## Stack

- **Astro 7** — static site generator, file-based routing
- **React** — interactive components (Terminal, ProjectFilter)
- **Tailwind CSS v4** — utility-first styling, `@tailwindcss/typography` installed
- **TypeScript** — strict mode
- **Cloudflare Pages** — deployed at [break-build-repeat.uk](https://break-build-repeat.uk), auto-deploys on push to `master`

## Project structure

```
src/
  components/           # Astro + React components
    Terminal.tsx        # Interactive terminal on homepage
    ProjectFilter.tsx   # Live search + filter on projects page
    FadeIn.astro        # Scroll-triggered fade-in wrapper
    Nav.astro           # Fixed nav, goes frosted glass on scroll
    widgets/            # Custom elements usable inside blog markdown
      subnet-calc.ts    # <subnet-calc> interactive subnet calculator
  content/
    projects/           # One .md file per project
    blog/               # One .md file per blog post
  lib/
    blog.ts             # getPosts() (hides drafts in production) + formatDate()
  layouts/
    Layout.astro        # Shell for every page — nav, footer, keyboard shortcuts
  pages/
    index.astro         # Homepage — hero + terminal + featured projects
    projects.astro      # All projects with live filter/search
    about.astro         # Bio + experience
    contact.astro       # GitHub link + copy-to-clipboard email
    projects/
      [slug].astro      # Dynamic project detail page
    blog.astro          # All published posts, newest first
    blog/
      [slug].astro      # Dynamic blog post page
  styles/
    global.css          # Tailwind imports + typography plugin
```

## Adding a new project

Create `src/content/projects/my-project.md` — filename becomes the URL slug:

```markdown
---
title: "Project Title"
description: "One line description"
tags: ["tag1", "tag2"]
status: wip          # live | wip | broken
featured: false      # true = appears on homepage
href: "https://..."  # optional external link
lastUpdated: 2026-01-01  # required, YYYY-MM-DD unquoted
---

## The problem
## The solution
## Stack
## What I learned
## What broke
## What's next
```

## Adding a blog post

Create `src/content/blog/my-post.md` — filename becomes the URL slug:

```markdown
---
title: "Post Title"
description: "One line description"
tags: ["networking"]
pubDate: 2026-01-01  # required, YYYY-MM-DD unquoted
draft: true          # visible in `npm run dev`, excluded from the production build
---
```

Remove `draft` (or set it to `false`) to publish.

Published posts also appear on the homepage (latest three) and in the terminal's `ls blog`.

Widgets are custom elements, so they work in plain markdown. Embed the subnet calculator with:

```html
<subnet-calc ip="192.168.1.181" prefix="24"></subnet-calc>
```

New widgets go in `src/components/widgets/` and must be imported in the `<script>` of `src/pages/blog/[slug].astro`.

Never publish real public IPv4 addresses, real IPv6 addresses, or MAC addresses in a post. Private IPv4 ranges are fine; use `2001:db8::/32` for IPv6 examples.

## Adding terminal commands

Edit the `COMMANDS` object in `src/components/Terminal.tsx`. Each command returns an array of HTML strings.

## Visual conventions

- Colour palette: `zinc-950` bg, `zinc-100` primary text, `zinc-400/500` muted
- Card glow: `hover:shadow-[0_0_30px_-5px_rgba(161,161,170,0.15)] hover:-translate-y-0.5`
- Section headings: `font-mono text-sm text-zinc-500 uppercase tracking-widest`
- Terminal green: `text-green-400` for success/active states
- Fade-in: wrap sections in `<FadeIn delay={ms}>`

## Keyboard shortcuts

Press `g` then: `h` home · `p` projects · `b` blog · `a` about · `c` contact

## TODO

- [x] Add profile photo to About page
- [ ] Add homelab/hardware photos to familyHub project page
- [ ] Add screenshots of familyHub app running
- [x] Connect repo to Cloudflare Pages for deployment
- [ ] Add expandable career timeline to About page
- [ ] Add skill/tech radar interactive diagram
- [x] Add LinkedIn link to Contact page
- [ ] Add more projects as they're built
- [x] Custom domain setup on Cloudflare Pages

## Owner

Josh Kain · JoshKainV1 on GitHub · jkainV7@gmail.com
