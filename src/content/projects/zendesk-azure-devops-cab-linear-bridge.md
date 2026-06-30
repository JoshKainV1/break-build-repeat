---
title: "Zendesk Azure DevOps CAB Linear Bridge"
description: "Azure Function that fans a Zendesk support ticket out into an Azure DevOps CAB work item and a Linear issue, then writes both links back as an internal note."
tags: ["JavaScript", "Azure", "automation"]
status: wip
featured: false
href: "https://github.com/JoshKainV1/-Zendesk-Azure-DevOps-CAB-Linear-bridge"
---

## The problem

Change management at work meant manually copying Zendesk ticket details into Azure DevOps for the CAB board, then again into Linear so the engineering team had visibility. Three systems, one person copy-pasting, and a non-zero chance something got missed or mis-titled at 4pm on a Friday.

## The solution

An Azure Function (Node.js v4 model) that sits behind a Zendesk webhook trigger. When a ticket tagged `needs_cab` is created, the function fans out in parallel: creates a CAB work item in Azure DevOps, opens a linked issue in Linear via GraphQL, then writes both URLs back onto the original Zendesk ticket as an internal note. One webhook fires — all three systems are updated.

Field mapping lives entirely in `templates.js`. When the CAB form fields change or the Linear ticket format shifts, that's the only file that needs touching.

## Stack

- **Azure Functions v4 (Node.js)** — consumption-plan hosting, scales to zero when idle, HTTP trigger for the webhook
- **Azure DevOps REST API** — work item creation via PATCH with JSON patch operations
- **Linear GraphQL API** — issue creation; GraphQL made the field mapping cleaner than REST would have
- **HMAC signature verification** — incoming Zendesk webhooks are validated before any processing happens
- **Application Insights** — wired up via `host.json` for per-invocation logs and failure alerting

## What I learned

- The Azure Functions v4 programming model (registered functions vs. the old `function.json` file-per-function approach) is much cleaner for a single-purpose function like this
- Linear's GraphQL API is genuinely pleasant to work with compared to most ticket-system APIs
- HMAC verification on webhooks is easy to skip "just for now" and then forget — building it in from the start was worth it
- Azure Key Vault references in app settings (`@Microsoft.KeyVault(...)`) keep secrets out of the portal UI entirely

## What broke

The Azure DevOps work item PATCH format is not obvious — it expects a JSON Patch array (`op: add`, `path: /fields/System.Title`) rather than a plain object. The first version sent a normal JSON body and got a 400 back with an unhelpful error message. Reading the ADO REST docs more carefully (and looking at what the portal actually sends) fixed it.

## What's next

- Move secrets to Azure Key Vault references instead of plain app settings
- Add a retry with exponential backoff if Linear or ADO is momentarily unavailable
- Webhook payload validation could be stricter — currently only checks the signature, not the shape
