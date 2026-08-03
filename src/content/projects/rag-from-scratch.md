---
title: "RAG From Scratch"
description: "Building a retrieval-augmented generation pipeline by hand — chunking, embeddings, vector search, and grounded answers with citations — no black-box framework."
tags: ["LLM", "RAG", "Python", "embeddings", "pgvector", "AI"]
status: wip
featured: false
lastUpdated: 2026-08-03
---

## The problem

An LLM is frozen at its training cutoff and has never seen my private data — homelab notes, internal docs, the familyHub codebase. I wanted a system that answers questions grounded in my *own* documents instead of guessing, and I wanted to build the pipeline from the primitives up so I actually understand where retrieval-augmented generation succeeds and where it quietly fails.

## The plan

A self-hosted RAG pipeline, no turnkey framework hiding the moving parts. Ingest documents, chunk them, embed each chunk into a vector, and store them. At query time: embed the question, run a similarity search for the closest chunks, feed those into a local LLM as grounded context, and return an answer with citations back to the source chunk.

Kept deliberately self-hostable so it can run entirely on my own hardware — no data leaving the house, no per-token bill.

## Stack (planned)

- **Python** — the pipeline glue
- **sentence-transformers** — local embedding model, no API calls
- **pgvector on PostgreSQL** — the vector store, reusing the same Postgres that already backs familyHub
- **Ollama** — a local LLM (Llama 3 / Mistral) so the whole system is private and self-hosted
- **FastAPI** — a small query endpoint over the top

## What I expect to learn

- Chunking strategies (fixed-size vs semantic) and how badly poor chunking degrades every answer downstream
- How embeddings and vector similarity (cosine / dot-product) actually work under the hood
- Keyword (BM25) vs semantic vs hybrid search, and when reranking the results earns its keep
- Why "retrieval-augmented" still hallucinates, and how to actually measure retrieval quality

## What'll probably break

- Chunk boundaries slicing straight through the one sentence that held the answer
- An embedding/query model mismatch quietly tanking relevance with no error to point at
- pgvector index tuning (ivfflat vs hnsw) and the recall-versus-speed tradeoff

## What's next

- Index the homelab docs and my own notes as the first real corpus
- Add hybrid search plus a reranker and measure the actual lift
- Expose it as a tool for the LlamaIndex agent (see [AI Agent with LlamaIndex](/projects/llamaindex-agent))
