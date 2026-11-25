---
title: "Planning a VLAN network before I plug anything in"
description: "OPNsense is installed on my new firewall box, and nothing is connected to it yet. Here's what I checked first, and what I learnt about VLANs while designing the network."
tags: ["networking", "homelab", "opnsense", "vlan"]
pubDate: 2026-11-25
draft: false
---

I won a CWWK S5 on eBay, an i5 mini PC with four 2.5GbE ports, and OPNsense is now installed on it. Nothing is plugged into it yet.

That's deliberate. The house still runs on the Vodafone router, and I'd rather get the design right on the bench than fix it live with everyone's Wi-Fi going down. So this is a post about the checks I did first and the design I ended up with, written before the build rather than after.

## Checking the drive

The S5 didn't see my spare SK hynix M.2 drive. That drive is SATA, and the slot looks NVMe only. I bought a used 256GB NVMe instead.

A used drive deserves a health check, and `smartctl` isn't on the OPNsense installer. FreeBSD has its own tool, so I booted the install stick, logged in as `root`, picked the shell and ran:

```bash
nvmecontrol devlist
nvmecontrol identify nvme0
nvmecontrol logpage -p 2 nvme0
```

The last one is the health page. I read it the same way as in my [drive health post](/blog/reading-drive-health-smart): no critical warnings, 100% spare, 0% used and 0 media errors. About 1.9TB written, which matched what the listing said, and just over 20,000 power-on hours. The size from `identify` was exactly what a real 256GB drive reports.

One number I didn't like: 58°C at idle. It never hit its warning threshold, but the S5 runs warm, so I'm getting a thermal pad rather than ignore it.

Getting there took a detour. The first time I booted the stick I ended up in the UEFI shell, and `nvmecontrol` said it wasn't a recognised command. That wording is the UEFI shell's, not FreeBSD's. I wasn't in OPNsense at all.

## The first thing the installer does

Once installed, the console showed the LAN on `192.168.1.1`. That's OPNsense's default, and it's also the address of my Vodafone router. Plug the two together and I'd have two devices claiming to be the gateway.

So the first job is to change the LAN before anything goes near the real network. I picked `192.168.99.1/24` for a rescue network on one port: a place to plug in a laptop and reach the firewall even if I break a VLAN. Private ranges are free, but they shouldn't clash with anything you already use.

## Why traffic between VLANs goes through the firewall

I'd planned to put my PC and my NAS in separate VLANs. Then I asked what that does to a file copy.

A managed switch is a layer 2 device. It moves traffic between ports inside one VLAN, using MAC addresses. Two VLANs are two different networks, and getting from one to the other needs a router, which is a layer 3 job. My switch can't do that, so a copy from my PC to the NAS would go up to the firewall and come straight back down, capped at 2.5GbE and sharing the cable with everything else.

That's also the point of VLANs. The firewall can only apply rules to traffic it sees.

There are switches that route between VLANs themselves. I found one with eight 2.5GbE ports for about £180, but routing on the switch means those VLANs bypass the firewall's rules, so I'd rather not.

My answer was to put the PC, the NAS and the VMs on the same VLAN. They already trust each other, since my PC has write access to the NAS shares. Copies between them stay inside the switch at full speed. The VLANs that matter for security are the ones that hold things I trust less.

## The design

| VLAN | Name | Subnet | What lives there |
|---|---|---|---|
| 10 | MGMT | 192.168.10.0/24 | Switch, access point, Proxmox host |
| 20 | SERVERS | 192.168.20.0/24 | NAS, my PC, app host, cameras' recorder |
| 30 | CAMERAS | 192.168.30.0/24 | Cameras, no internet |
| 40 | IOT | 192.168.40.0/24 | Home Assistant, TVs, smart devices |
| 50 | GUEST | 192.168.50.0/24 | Visitors, internet only |
| 60 | TRUSTED | 192.168.60.0/24 | Phones and laptops on Wi-Fi |
| 70 | WORK | 192.168.70.0/24 | A work device, internet only |

Every VLAN gets the firewall as `.1`, and the default is to block anything between VLANs that I haven't allowed by name.

The WORK VLAN is the strictest. Its rules are short, and OPNsense reads them top to bottom with the first match winning:

1. Allow DNS to the firewall.
2. Block everything else to the firewall itself, so no admin page or SSH.
3. Block all private addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), which covers every other VLAN, the old router and the rescue network.
4. Allow everything else, which now means the internet and nothing else.

Rule 3 does the work. By the time traffic reaches the "allow" at the end, anything inside my house has already been dropped.

## What's next

- Assign the ports, set up the rescue network and reach the GUI from a laptop.
- Build the VLANs on the bench, then the switch, then the rules.
- Move the house over in one go, with a two-minute rollback: the ONT cable back into the old router.

Nothing here is built yet. I'll write up how it went, including whatever I got wrong.
