---
title: "Fine-Tuning with LoRA & QLoRA"
description: "Fine-tuning an open-source LLM on a single GPU using parameter-efficient methods — LoRA adapters and 4-bit QLoRA — to learn how model customisation actually works."
tags: ["LLM", "fine-tuning", "LoRA", "QLoRA", "PyTorch", "AI"]
status: wip
featured: false
href: "https://github.com/JoshKainV1/lora-qlora-fine-tuning"
lastUpdated: 2026-08-25
---

## The problem

RAG changes what a model *sees*; fine-tuning changes what it *is*. I wanted to understand the other half of customising an LLM — teaching a model a consistent format, tone, or domain — without needing a datacentre of GPUs to do it. LoRA and QLoRA are exactly what make that reachable on hardware a mortal can afford, and I wanted to actually run one rather than just read the papers.

## The plan

Take an open base model (Llama 3 / Mistral / Qwen), assemble a small instruction dataset, and fine-tune it two ways for comparison: **LoRA** (train small adapter matrices on the full-precision model) and **QLoRA** (the same adapters, but on a base model quantised to 4-bit). Then evaluate both against the untouched base model and serve the resulting adapter.

## Stack (planned)

- **Hugging Face Transformers + PEFT** — base models and LoRA adapters
- **bitsandbytes** — 4-bit (NF4) quantisation, the core of QLoRA
- **TRL (`SFTTrainer`)** — the supervised fine-tuning loop
- **Datasets** — formatting instruction pairs against the model's chat template

## What I expect to learn

- Why LoRA works at all — the low-rank hypothesis, and which layers are worth adapting
- What QLoRA adds on top: 4-bit NormalFloat, double quantisation, paged optimizers
- Dataset formatting and chat templates, and how alarmingly fast you overfit a small set
- Evaluating a fine-tune honestly, instead of trusting vibes and cherry-picked outputs

## What'll probably break — and the hard part up front

This is the project that fights my hardware. bitsandbytes and QLoRA are CUDA-first, so the homelab's Radeon 780M iGPU won't cut it — this one needs an NVIDIA GPU (24GB-class) or rented cloud time, and that's a decision to make *before* starting, not halfway through.

- VRAM math: getting a 7B model plus adapters plus optimizer state to actually fit in memory
- Overfitting a tiny dataset and producing a confidently *worse* model than the base
- ROCm vs CUDA dead-ends if I try to force it onto the wrong GPU

## What's next

- Decide on hardware — a local NVIDIA card vs hourly cloud (a single A100)
- Curate a first instruction dataset that's actually worth training on
- Merge the adapter and serve it via Ollama alongside the RAG stack
