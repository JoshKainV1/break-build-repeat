---
title: "AI Agent with LlamaIndex"
description: "Building a tool-calling AI agent that reasons in a loop — deciding when to search, query a database, or hit an API — using LlamaIndex's agent framework."
tags: ["LLM", "AI agents", "tool-calling", "LlamaIndex", "Python", "AI"]
status: wip
featured: false
lastUpdated: 2026-08-03
---

## The problem

An LLM on its own can only produce text. To do anything useful against live systems it needs tools — and, crucially, it needs to decide for itself which tool to reach for and when. I wanted to build a real tool-calling agent and understand the reason–act–observe loop that powers everything from coding assistants to autonomous workflows (it's the same loop the assistant I use every day runs on).

## The plan

Define a set of tools — a RAG query, a live metrics lookup, a calculator, maybe a scoped shell command — and wire them to a LlamaIndex agent that orchestrates multi-step tasks. The target: an agent that can answer something like *"is the media server healthy, and what's it been transcoding lately?"* by deciding on its own to hit both the vector store and live Prometheus metrics, then synthesising the two.

## Stack (planned)

- **LlamaIndex** — the agent framework (`FunctionAgent` / `ReActAgent`, tool definitions, workflows)
- **Python** — the tool implementations behind each capability
- **Ollama** (or an API model) — the LLM acting as the reasoning engine
- **The RAG-from-scratch index** — reused as one of the agent's tools (see [RAG From Scratch](/projects/rag-from-scratch))

## What I expect to learn

- How tool / function schemas are defined, and how the model chooses between them
- The ReAct pattern — reason, act, observe, repeat — and how agent memory is threaded through it
- Where agents actually fail: infinite loops, wrong-tool selection, hallucinated arguments
- How the whole tool-calling loop maps onto assistants like Claude Code that I use daily

## What'll probably break

- The agent looping forever, or calling the right tool with confidently wrong arguments
- Tool schemas the model consistently misreads or ignores
- Context bloat as tool results pile up across steps and crowd out the actual task

## What's next

- Start with a single-tool agent and get the loop solid before adding more
- Plug in the RAG index as the first real tool
- Add guardrails — a max-step limit, tool timeouts, and validation on tool arguments
