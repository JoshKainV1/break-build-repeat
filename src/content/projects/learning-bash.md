---
title: "Learning Bash Properly"
description: "Closing the gap between copy-pasting shell one-liners and actually understanding Bash — scripting, pipes, quoting, and the text tools that make the terminal a superpower."
tags: ["Bash", "Linux", "shell", "scripting", "learning"]
status: wip
featured: false
lastUpdated: 2026-08-03
---

## The problem

As a systems engineer I live in the terminal, but a lot of my Bash has been cargo-culted — grab a one-liner from Stack Overflow, tweak it until it works, move on. It runs, but I couldn't always tell you *why*. I wanted to close that gap and treat the shell as a language I actually know rather than a slot machine I keep pulling until the output looks right.

## The plan

Work through [The Complete Bash Scripting Course](https://www.youtube.com/watch?v=Sx9zG7wa4FA) end to end, then cement it the only way that sticks: rewrite my own homelab glue scripts properly. The TrueNAS backup jobs, the container healthchecks, the ad-hoc one-liners — all rebuilt with real error handling instead of hope and a trailing `|| true`.

## What I expect to learn

- The mechanics I've always fudged: quoting, word splitting, globbing, and why `"$var"` and `$var` are not the same thing
- Pipes, redirection, and process substitution as a composable toolkit rather than magic incantations
- Writing robust scripts — `set -euo pipefail`, `trap` for cleanup, meaningful exit codes, argument parsing with `getopts`
- The classic text tools done properly — `grep`, `sed`, `awk`, `xargs`, `find` — instead of reaching for Python every time
- Functions, loops, and conditionals, and the judgement to know when a task has outgrown Bash and wants a real language

## What'll probably trip me up

- The quoting and word-splitting rules that bite everyone — spaces in filenames, empty variables expanding to nothing
- `set -e` not behaving the way you'd expect inside functions, subshells, and pipelines
- Portability: bashisms vs POSIX `sh`, and the differences across the shells scattered around the homelab (OPNsense, TrueNAS, Alpine containers)

## What's next

- Rewrite the familyHub and TrueNAS backup + healthcheck scripts with proper error handling and logging
- Build a small personal library of reusable shell functions
- Run ShellCheck over everything as a standing habit
