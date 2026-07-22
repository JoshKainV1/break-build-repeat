---
title: "familyHub"
description: "A self-hosted home platform — media server, family dashboard, and homelab infrastructure built from scratch."
tags: ["homelab", "self-hosted", "Docker", "C#", "React", "PostgreSQL", "OPNsense", "TrueNAS"]
status: wip
featured: true
lastUpdated: 2026-07-22
---

## The problem

I wanted full control over my family's data — media, photos, shared calendars, and home automation — without handing it to a third-party cloud. Everything should live on hardware I own, in my house, on a network I control.

## The solution

A full homelab stack built from scratch: a dedicated firewall appliance, a TrueNAS storage server, and an application host running Docker containers. The application itself is a C# ASP.NET Core backend, React frontend, and PostgreSQL database — all containerised and connected via an internal VLAN.

The app itself covers movie/TV streaming with seekable playback, real-time family chat over a SignalR hub, a shared to-do list, photo sharing, and an admin panel for user management — all behind JWT auth with no public sign-up; accounts are provisioned by script.

## Infrastructure

The network is segmented into four VLANs, managed by an OPNsense firewall on an N150 fanless appliance:

- **VLAN 10 (MGMT)** — firewall UI, switch UI, admin only
- **VLAN 20 (SERVERS)** — TrueNAS NAS, application host, all services
- **VLAN 30 (CAMERAS)** — future CCTV, fully isolated from everything else
- **VLAN 40 (GUEST/IoT)** — TVs, tablets, smart devices, limited access

Traffic between VLANs is controlled by explicit firewall rules. CAMERAS can't reach SERVERS. GUEST can reach Plex but nothing else. Nothing reaches MGMT except admin devices.

## Stack

- **OPNsense (N150 fanless)** — gateway, firewall, DHCP, DNS (Unbound), IDS/IPS (Suricata), WireGuard VPN
- **TrueNAS SCALE (Ryzen 5 5600G, 32GB RAM)** — striped ZFS pools over SAS via LSI HBA, with nightly replication to a backup pool instead of mirrored redundancy
- **GoLake 2.5GbE managed switch** — VLAN tagging and trunking
- **GMKtec K12 (Ryzen 7 H 255, 32GB RAM, Radeon 780M)** — Proxmox VE host running the app stack in a Docker VM alongside Home Assistant
- **C# ASP.NET Core 8** — REST API backend
- **React 19 + Vite** — frontend
- **PostgreSQL 16** — database
- **SignalR** — real-time chat, delivered per-user over WebSocket connection groups
- **JWT + PBKDF2-SHA256** — bearer-token auth; no public registration, accounts provisioned via script
- **nginx** — serves the built React app and reverse-proxies `/api/*` to the backend, so the browser only ever talks to one origin
- **Docker Compose** — orchestrates backend, frontend, database, and PgAdmin
- **Jellyfin** — GPU-accelerated media server using VA-API on the K12's integrated Radeon 780M (~3–4 simultaneous hardware transcodes)

## What I learned

- How to design a VLAN-segmented network with meaningful isolation, not just theoretical separation
- How ZFS mirror pools work, why SAS over an HBA outperforms SATA direct, and how to size datasets
- How to containerise a full-stack application and connect it to NFS-mounted NAS storage
- The difference between IDS (monitoring) and IPS (blocking) and why you start with one before the other
- How GPU passthrough to Docker works for hardware-accelerated transcoding
- Why firewall rules need to be explicit and default-deny — and what happens when they're not

## What broke

- PostgreSQL healthcheck timing caused the backend container to start before the database was ready — fixed with `depends_on: condition: service_healthy`
- VLAN trunk misconfiguration on the switch caused the entire network to drop — learned to always verify trunk ports before applying VLAN rules
- NFS mount permissions between TrueNAS datasets and Docker volumes required careful UID/GID alignment
- GPU transcoding required `nvidia-docker2` runtime configuration that isn't obvious from the standard Docker docs

## What's next

- TrueNAS build still in progress: PSU, 2.5GbE NIC, and boot drive still to source, plus intake-testing all six Exos drives (SMART, sector format, SED checks) before the striped tank/vault pools go live
- Phase 2: CCTV system on VLAN 30 using Frigate NVR and WD Purple drives
- WireGuard VPN for remote family access
- Prometheus + Grafana for monitoring across all nodes
- Offsite backup to cloud cold storage (B2 or S3)
- Potential 10GbE upgrade between NAS and app host
