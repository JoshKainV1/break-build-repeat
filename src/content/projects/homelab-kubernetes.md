---
title: "Homelab Kubernetes"
description: "Migrating the familyHub stack from Docker Compose to a self-hosted 3-node k3s cluster on Proxmox — a hands-on way to actually learn Kubernetes."
tags: ["homelab", "Kubernetes", "k3s", "Proxmox", "GitOps", "self-hosted"]
status: wip
featured: false
lastUpdated: 2026-08-25
---

## The problem

familyHub currently runs as a single `docker-compose.yml` on one Proxmox VM. That's fine — until you want to learn Kubernetes, which is fast becoming table stakes for anything infrastructure-shaped. Reading about pods and services never sticks; running a real cluster does. The homelab is the ideal place to learn it badly first, because I already know the app that'll run on it and I own every layer beneath it.

## The plan

Stand up a real (not single-node) Kubernetes cluster on the existing K12 Proxmox host and migrate the familyHub stack onto it, piece by piece. k3s to start — a lightweight, fully conformant distribution — across three Proxmox VMs: one control-plane node and two workers. Small enough to fit in the K12's 32GB, real enough to teach scheduling, node draining, and pod rescheduling on failure.

The migration itself is the syllabus. Each Compose service becomes one or more Kubernetes objects, and every translation forces a concept:

- backend / frontend → Deployments + Services, fronted by a Traefik Ingress (replacing the hand-rolled nginx reverse proxy)
- PostgreSQL → a StatefulSet with a PersistentVolumeClaim
- `depends_on: service_healthy` → readiness and liveness probes
- the TrueNAS NFS mount → a PersistentVolume via an NFS/CSI provisioner
- `.env` secrets → Secret objects, then Sealed Secrets committed to git
- Jellyfin's Radeon 780M transcoding → a device plugin exposing `/dev/dri` to the pod

## Stack (planned)

- **k3s** — lightweight conformant Kubernetes; single binary, bundles Traefik and a service load balancer to get going fast
- **Proxmox VE** — three VMs on the existing K12 host form the cluster nodes
- **MetalLB** — hands out real IPs from a pool on the Servers VLAN so `LoadBalancer` services work on bare metal with no cloud LB
- **TrueNAS SCALE** — backs persistent volumes over NFS (simple) or iSCSI via democratic-csi (proper dynamic provisioning)
- **cert-manager** — automatic TLS for ingress
- **Argo CD** — GitOps: cluster state lives in a git repo, a `git push` deploys
- **kube-prometheus-stack** — Prometheus + Grafana, finally giving familyHub the monitoring it's been missing

## Roadmap

1. Fundamentals on a laptop first — `kind`/`minikube`, learn `kubectl` and the core objects before touching the lab
2. Single-node k3s VM — deploy one trivial workload, reach it through Traefik
3. Migrate the familyHub Compose stack onto that single node
4. Rebuild as a 3-node cluster; add MetalLB, TrueNAS-backed storage, cert-manager
5. GitOps with Argo CD; observability with kube-prometheus-stack
6. HA control plane and backups (Velero) — and maybe a Talos rebuild once k3s clicks

## What I expect to learn

- The real difference between a Deployment, a StatefulSet, and a DaemonSet — by being forced to pick one per service
- How storage actually attaches to pods, and why StatefulSets and PVCs exist instead of just bind-mounting a volume
- Bare-metal networking without a cloud provider: MetalLB address pools, Ingress vs Service, and where they sit against my existing VLANs
- GitOps as a discipline — the cluster's desired state living in version control rather than in my shell history

## What'll probably break

Going in eyes-open about the classic homelab-k8s traps:

- MetalLB's address pool overlapping the DHCP range on the Servers VLAN — intermittent, maddening IP conflicts
- PVCs stuck `Terminating`, plus NFS UID/GID mismatches between TrueNAS and the pods (the exact fight I already had with Docker volumes on familyHub)
- CoreDNS misbehaving and quietly making every in-cluster service unreachable by name
- Pods getting OOMKilled because I forgot to set resource requests and limits

## What's next

- Get to phase 2 (single-node k3s) and document the first real migration
- Decide NFS vs iSCSI for persistent storage after benchmarking both against the ZFS pool
- Possibly sit the CKA as a forcing function once the cluster is stable
