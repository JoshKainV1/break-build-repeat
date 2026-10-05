---
title: "Really understanding IPv4 and IPv6"
description: "I knew what a subnet was. I didn't know what it was for. An evening with ipconfig and some binary sorted that out."
tags: ["networking", "IPv4", "IPv6", "subnetting"]
pubDate: 2026-10-05
draft: true
---

I've typed `ipconfig` thousands of times. I look at the IP address, ignore the two lines underneath it, and get on with my day.

If you'd asked me last week what a subnet was, I'd have given you a reasonable answer. A range of addresses. A chunk of a network. What I couldn't have told you is what it's *for*. What does my PC do with that mask? I had the definition and none of the understanding, which is an uncomfortable thing to notice when networking is part of your job.

So I sat down with my own machine and worked through it from the top. This is what I found, along with the things I got wrong on the way.

## What my machine told me

```
Ethernet adapter Ethernet 3:

   IPv4 Address. . . . . . . . . . . : 192.168.1.181
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
```

`192.168.1.181` is my PC. `192.168.1.1` is my router, which Windows calls the default gateway. The mask is the line I'd been ignoring for years, and it turns out to be the interesting one.

## The mask answers one question

Every time my PC sends anything, it has to decide: is the destination on my network, or somewhere else? If it's a neighbour, it delivers directly. If it isn't, it gives the packet to the router and lets the router worry about it.

The mask is how it decides. Stack the two on top of each other:

```
Address  192 . 168 .  1  . 181
Mask     255 . 255 . 255 .  0
```

Where the mask says `255`, that number has to match for someone to be a neighbour. Where it says `0`, anything goes. So for me, anything starting `192.168.1.` is next door, and everything else goes to the router.

| Destination    | Starts `192.168.1.`? | My PC...                |
|----------------|----------------------|-------------------------|
| `192.168.1.44` | Yes                  | delivers it directly    |
| `192.168.2.44` | No                   | hands it to the gateway |
| `8.8.8.8`      | No                   | hands it to the gateway |

The bit that surprised me is that the last two rows are the same. My PC has no idea `8.8.8.8` is Google, out on the internet, while `192.168.2.44` is a private address. It does one comparison and that's the end of its involvement.

It also explains something about my own setup. My [homelab](/projects/family-hub) isn't on that `192.168.1.` network. It sits behind its own OPNsense firewall, which is plugged into my router for now while I test it, and it has its own subnets split across VLANs. The house and the homelab aren't neighbours, so nothing gets from one side to the other without going through that firewall. That makes it the one place I get to decide what's allowed across. The VLANs are up and running, though there's still a lot of work to do on them. At least now I understand why the design works.

## So what's a /24?

Each of those four numbers is 8 bits, which is why none of them goes above 255. Four numbers, 32 bits in total.

The mask is a single line drawn through those 32 bits. Everything left of the line is the network, and everything right of it is the individual device. A `255` means all 8 bits of that number are on the network side. I've got three of those, 3 × 8 is 24, and that's the whole story behind `/24`. It's the same mask as `255.255.255.0`, written in a way that's quicker to type. The slash style is called CIDR notation.

It counts locked *bits*, not locked numbers. That distinction didn't seem important until about ten minutes later.

The picture that made it click for me was a postal address. The network part is the street, the device part is the house number, and the mask tells you where the street name stops.

Have a play with it. Drag the slider and watch what happens to the line, the mask and the address count:

<subnet-calc ip="192.168.1.181" prefix="24"></subnet-calc>

## When the line lands in the middle of a number

My PC has a second network adapter that Hyper-V created, and it ruined my nice simple rule:

```
   IPv4 Address. . . . . . . . . . . : 172.24.160.1
   Subnet Mask . . . . . . . . . . . : 255.255.240.0
```

240. Not 255, not 0. You can't say "this number must match" or "this number is free" any more, and this is the point where I had to stop avoiding binary.

Each bit is a switch with a fixed value. Add up the ones that are on:

```
128  64  32  16   8   4   2   1
 1   1   1   1    0   0   0   0     = 240
```

128 + 64 + 32 + 16 is 240. The first four switches are on, so in that third number the first four bits belong to the network and the last four belong to the device. Two full numbers plus four bits: 8 + 8 + 4, which is `/20`.

It leads to something that looks wrong at first. `172.24.170.5` is a neighbour of `172.24.160.1`. 160 is `1010 0000` and 170 is `1010 1010`. The first four bits match, and those are the only ones the mask cares about.

Try the Hyper-V preset in the calculator above and you'll see the line sitting in the middle of the third number.

## How many devices fit?

Only the free bits matter here, and every extra free bit doubles the count.

| CIDR | Free bits | Addresses |
|------|-----------|-----------|
| /24  | 8         | 256       |
| /23  | 9         | 512       |
| /22  | 10        | 1,024     |
| /21  | 11        | 2,048     |
| /20  | 12        | 4,096     |
| /16  | 16        | 65,536    |

You lose two from every network. The first address is the name of the network itself, and the last is the broadcast address, which means "everyone here". So my `/24` at home fits 254 devices. Azure keeps five per subnet for itself, so a `/24` there gets you 251.

Move the line left and you get fewer, bigger networks. Move it right and you get more, smaller ones. As far as I can tell, that trade-off is most of what subnet design is.

## The things I got wrong

All three of these were mine.

**Counting from zero.** I confidently said the highest number you can make with four bits was 16. It's 15. Sixteen is how many values there are, because zero counts as one of them. Then I decided three bits went from 0 to 8. They go from 0 to 7.

**Thinking a bigger slash means a bigger network.** I had it the wrong way round. A bigger number after the slash locks more bits, which leaves fewer free ones, so the network is smaller. A `/25` is half the size of a `/24`.

**Assuming `.0` and `.255` are always reserved.** I thought every address ending in those was off limits. That's a habit from `/24`, not the rule. The reserved addresses are the first and last of the whole network, wherever those fall. In my Hyper-V `/20`, `172.24.160.255` and `172.24.161.0` are perfectly ordinary addresses in the middle of the range.

## And then IPv6

The same `ipconfig` output had a few lines I've always scrolled straight past. I've swapped my real addresses for made-up ones, for reasons that'll be obvious in a minute:

```
   IPv6 Address. . . . . . . . . . . : 2001:db8:a1b2:c3d4:7c1e:52a9:f03b:6d84
   Temporary IPv6 Address. . . . . . : 2001:db8:a1b2:c3d4:e9f0:41c7:2b6a:95d3
   Default Gateway . . . . . . . . . : fe80::1a2b:3cff:fe4d:5e6f%12
```

I knew IPv6 was written in hex. What I hadn't appreciated was the scale: I'd assumed it was IPv4 with a couple more numbers bolted on the end. It's 128 bits instead of 32, which is why it needs hex in the first place. Nobody wants to read sixteen dotted decimals.

The idea underneath is the same one I'd spent the evening on. One line, network on the left, device on the right. It's nearly always a `/64`, so the line sits bang in the middle and you don't need any of the binary from earlier:

```
2001:db8:a1b2:c3d4 : 7c1e:52a9:f03b:6d84
     network      |       device
```

A few things do change.

There's no NAT. That's the trick my router uses on IPv4, swapping each device's private address for its own single public one on the way out. It exists because IPv4 only has about 4.3 billion addresses for the whole planet, so everything in my house has to share. A single IPv6 `/64` has around 18 quintillion. Every device gets a real, public address of its own.

That `fe80::` gateway address is link-local, meaning it only works on my own street. It's how my PC talks to the router without needing a public address to do it.

And the "temporary" address is a privacy thing. Without NAT, every site I visit sees my PC's own address. So Windows makes up a second one with a random device half, uses it for outgoing connections, and throws it away after a while. I guessed it was something to do with incognito mode, which was the right idea in the wrong place.

## Hang on, is that safe?

That was my first reaction. Every device in my house has a public address?

It turns out NAT was never the thing keeping me safe. It hid my devices by accident, as a side effect of sharing one address. The actual protection is the firewall. By default a home router drops any connection that starts from outside and only lets in replies to things you asked for, and Windows Firewall sits behind that as a second layer.

An address says where you are. A firewall decides who gets to knock. Azure works the same way: you can give a VM a public IP, and a Network Security Group decides what reaches it.

## What's next

I want to see what NAT does to a packet on its way out of my house. Then DHCP, because something handed my PC that mask and I'd like to know what. After that I'm going to carve up an Azure VNet and get the subnet sizes wrong on purpose.

Three short posts a week is the plan. If I can't explain it, I don't know it.
