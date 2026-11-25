---
title: "familyHub"
description: "A self-hosted home platform — media server, family dashboard, and homelab infrastructure built from scratch."
tags: ["homelab", "self-hosted", "Docker", "C#", "React", "PostgreSQL", "OPNsense", "TrueNAS"]
status: wip
featured: true
lastUpdated: 2026-11-25
---

## The problem

I wanted full control over my family's data — media, photos, shared calendars, and home automation — without handing it to a third-party cloud. Everything should live on hardware I own, in my house, on a network I control.

## The solution

A full homelab stack built from scratch: a dedicated firewall appliance, a TrueNAS storage server, and an application host running Docker containers. The application itself is a C# ASP.NET Core backend, React frontend, and PostgreSQL database — all containerised and connected via an internal VLAN.

The app itself covers movie/TV streaming with seekable playback, real-time family chat over a SignalR hub, a shared to-do list, photo sharing, and an admin panel for user management — all behind JWT auth with no public sign-up; accounts are provisioned by script.

## Infrastructure

The network is segmented into seven VLANs, managed by an OPNsense firewall on a CWWK S5 (i5-1135G7, four Intel i226-V 2.5GbE ports):

- **VLAN 10 (MGMT)** — switch, access point and Proxmox admin pages
- **VLAN 20 (SERVERS)** — TrueNAS NAS, application host, my PC and every service
- **VLAN 30 (CAMERAS)** — future CCTV, no internet access
- **VLAN 40 (IOT)** — Home Assistant, TVs, smart devices
- **VLAN 50 (GUEST)** — visitors, internet only
- **VLAN 60 (TRUSTED)** — family phones and laptops
- **VLAN 70 (WORK)** — a work device, internet only, nothing else reachable

Traffic between VLANs is controlled by explicit, default-deny firewall rules. CAMERAS can't reach anything. GUEST and WORK get the internet and nothing else. Nothing reaches MGMT except my PC.

The PC and NAS share a VLAN on purpose. A managed layer 2 switch can't route between VLANs, so traffic between two VLANs would go up to the firewall and back at 2.5GbE. In one VLAN it stays on the switch at full speed.

OPNsense 26.7 is installed on the S5 and the design is written up, but nothing is plugged in yet. The house still runs on the Vodafone router until the cutover. I wrote more about the design in [Planning a VLAN network before I plug anything in](/blog/planning-vlans-opnsense-s5).

## Stack

- **OPNsense on a CWWK S5 (i5-1135G7, 16GB RAM, 256GB NVMe, ZFS)** — gateway, firewall, DHCP, DNS (Unbound), IDS (Suricata, alert-only), WireGuard VPN
- **TrueNAS SCALE (Ryzen 7 4750G, 32GB RAM)** — striped ZFS pools over SAS via an HBA, with nightly replication to a backup pool instead of mirrored redundancy
- **Netgear MS308E (8× 2.5GbE, 802.1Q)** — VLAN tagging and trunking, planned. It replaces the unmanaged GoLake switch
- **UniFi U7 Pro and a small PoE switch** — VLAN-aware Wi-Fi (TRUSTED, IOT and GUEST SSIDs) and power for the cameras, planned
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
- The difference between a layer 2 and a layer 3 switch, and why traffic between VLANs has to pass through the firewall
- How to health-check a used NVMe drive from the OPNsense shell with `nvmecontrol`

## What broke

- PostgreSQL healthcheck timing caused the backend container to start before the database was ready — fixed with `depends_on: condition: service_healthy`
- VLAN trunk misconfiguration on the switch caused the entire network to drop — learned to always verify trunk ports before applying VLAN rules
- NFS mount permissions between TrueNAS datasets and Docker volumes required careful UID/GID alignment
- GPU transcoding required `nvidia-docker2` runtime configuration that isn't obvious from the standard Docker docs
- The S5 dropped me into the UEFI shell on the first boot from the install stick, and `nvmecontrol` was "not recognised". That wording comes from the UEFI shell, not FreeBSD
- OPNsense's default LAN address, 192.168.1.1, is the same as my Vodafone router, so the LAN has to change before anything is plugged in

## What's next

- Assign the S5's ports, set up the rescue network, then build the VLANs, switch and firewall rules on the bench before the cutover
- Finish the TrueNAS box: flash the BIOS for the 4750G, fit the HBA and 2.5GbE NIC, and install TrueNAS on the boot SSD before the SAS drives go in
- Start linking services to the VLANs, beginning with the NAS
- Phase 2: CCTV system on VLAN 30 using Frigate NVR and WD Purple drives
- Phase 3: migrate the app stack from Docker Compose to a self-hosted 3-node k3s cluster on Proxmox — MetalLB for bare-metal load balancing, TrueNAS-backed persistent volumes, and Argo CD for GitOps deploys (see [Homelab Kubernetes](/projects/homelab-kubernetes))
- WireGuard VPN for remote family access
- Prometheus + Grafana for monitoring across all nodes
- Offsite backup to cloud cold storage (B2 or S3)
- Potential 10GbE upgrade between NAS and app host
