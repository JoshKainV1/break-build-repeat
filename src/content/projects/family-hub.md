---
title: "familyHub"
description: "A self-hosted home platform — media server, family dashboard, and homelab infrastructure built from scratch."
tags: ["homelab", "self-hosted", "Docker", "C#", "React", "PostgreSQL", "OPNsense", "TrueNAS"]
status: wip
featured: true
---

## The problem

I wanted full control over my family's data — media, photos, shared calendars, and home automation — without handing it to a third-party cloud. Everything should live on hardware I own, in my house, on a network I control.

## The solution

A full homelab stack built from scratch: a dedicated firewall appliance, a TrueNAS storage server, and an application host running Docker containers. The application itself is a C# ASP.NET Core backend, React frontend, and PostgreSQL database — all containerised and connected via an internal VLAN.

## Infrastructure

The network is segmented into four VLANs, managed by an OPNsense firewall on an N100 fanless appliance:

- **VLAN 10 (MGMT)** — firewall UI, switch UI, admin only
- **VLAN 20 (SERVERS)** — TrueNAS NAS, application host, all services
- **VLAN 30 (CAMERAS)** — future CCTV, fully isolated from everything else
- **VLAN 40 (GUEST/IoT)** — TVs, tablets, smart devices, limited access

Traffic between VLANs is controlled by explicit firewall rules. CAMERAS can't reach SERVERS. GUEST can reach Plex but nothing else. Nothing reaches MGMT except admin devices.

## Stack

- **OPNsense (N100 fanless)** — gateway, firewall, DHCP, DNS (Unbound), IDS/IPS (Suricata), WireGuard VPN
- **TrueNAS SCALE (Ryzen 5 3600, 32GB RAM)** — ZFS mirror pool over SAS via LSI HBA, NFS shares for app data and media
- **GoLake 2.5GbE managed switch** — VLAN tagging and trunking
- **Acer i7 (32GB RAM, GTX 1050Ti)** — Docker host running the full application stack
- **C# ASP.NET Core 8** — REST API backend
- **React 19 + Vite** — frontend
- **PostgreSQL 16** — database
- **Docker Compose** — orchestrates backend, frontend, database, and PgAdmin
- **Jellyfin / Plex** — GPU-accelerated media server using NVIDIA NVENC (8–10 simultaneous 1080p streams)

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

- Phase 2: CCTV system on VLAN 30 using Frigate NVR and WD Purple drives
- WireGuard VPN for remote family access
- Prometheus + Grafana for monitoring across all nodes
- Offsite backup to cloud cold storage (B2 or S3)
- Potential 10GbE upgrade between NAS and app host
