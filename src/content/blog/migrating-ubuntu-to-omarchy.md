---
title: "Moving from Ubuntu to Omarchy"
description: "No real reason to leave Ubuntu except curiosity. I put Omarchy on a spare SATA SSD and forced myself to get better at Linux."
tags: ["linux", "omarchy", "hyprland", "migration"]
pubDate: 2026-10-08
---

Ubuntu was working fine. Nothing was broken, nothing was annoying me, and I had no good reason to change it.

I did it anyway, out of curiosity. I'd been hearing about Omarchy, an opinionated Arch-based setup built around the Hyprland tiling window manager, and I wanted to see what it felt like. This is what the first stretch of using it has been like, written while I'm still fumbling for the right keys.

## Why a second drive

I didn't want to wipe a working machine on a whim, so I put a spare SATA SSD in the PC and installed Omarchy on that. Ubuntu stayed untouched on its own drive.

That turned out to be the right call. If I got stuck, or hated it, I could pick the other drive in the boot menu and be back where I started. It took the pressure off. I was trying something out, not betting my main machine on it.

## Moving everything over

This was the part I expected to be painful, and it wasn't. Getting my stuff from one install to the other was easy, much easier than I'd braced for.

I moved everything. I had a drive big enough to hold all my data, so there was no deciding what to keep and what to leave behind.

Having both systems on separate drives in the same machine helped a lot. Nothing felt like it was gone.

## The experience

I like it. I'm still figuring out the keybindings, and my hands keep reaching for the Ubuntu way of doing things, but the overall experience has won me over.

A tiling window manager changes how you think about windows. Instead of dragging things around and stacking them, you tell the system what you want open and it arranges them. It's built around the keyboard, which is exactly why my muscle memory is currently useless.

The thing I notice most is the speed. Ubuntu was never slow, but Omarchy is so quick that it makes Ubuntu feel slower in hindsight.

## The real reason

If I'm honest, curiosity was the starting point, but the reason I'm sticking with it is that it forces me to get better at Linux.

Ubuntu is forgiving. Most things just work, and when they don't, there's a button or a Software Center entry that sorts it out. That's a good thing, but it also means I've been able to use Linux for years without properly understanding it. Omarchy puts me closer to the machine. Config lives in files I have to read, and when something isn't right I have to work out why.

I work with systems for a living and run a homelab, so that discomfort is the point.

## What broke

Sound. I had no working audio for ages. It turned out to be three separate problems stacked on top of each other, so fixing any one of them still left me with silence.

**1. The wrong default output.** PipeWire had its default set to "USB Audio S/PDIF Output", a digital output with nothing connected to it. Everything I played went there, silently.

**2. Muted below PipeWire.** The sound card's PCM 0 and PCM 1 playback outputs were switched off in the ALSA hardware mixer. That layer sits underneath PipeWire, so the normal volume and mute controls never show it. I turned them back on at 69%.

**3. A plug that wasn't properly in.** The card reported both the speaker and headphone jacks as "not available". I tried different jacks, direct ALSA test tones and the monitor's audio, and heard nothing from any of it. The cause was that the plug wasn't pushed in firmly after I'd briefly unplugged it. Once I seated it properly, the card detected the headphones on the Headphone output. My earlier test beeps had been going to the Speaker output, which is why I never heard them.

The lesson is that audio on Linux is a stack, and each layer can fail independently: the physical jack, the hardware mixer, then PipeWire's choice of output. A fault in a lower layer won't show up in the layers above it. Next time I'll work from the bottom up and check each layer before assuming the problem is in the one I'm looking at.

It cost me a lot of time, but I understand how the pieces fit together far better than I did.

Sound was the big one, but it wasn't the only thing.

**Per-app settings and tiny fonts.** Almost everything is customisable on a per-app basis, which is great until you're the one who has to do it. Text was small at first, and what looked fine in one app was too small in the next. Some apps didn't load the way I wanted, and fixing each one meant its own bit of fiddling. The flexibility is real, and so is the effort of getting it all how I like it.

**Keybindings.** Beyond my hands reaching for the Ubuntu shortcuts, I ran into bindings that didn't do what I expected. In a setup built around the keyboard, a wrong binding stops you in your tracks.

**Dual screens.** I use two monitors, and they needed different display settings. Each one is configured separately, so the fix for one screen doesn't carry over to the other.

The apps I fiddled with most were Visual Studio Code, Blender and my media app.

I'll add to this section as I find more.

### What other people ran into

Experiences vary a lot. One [blogger](https://ochagavia.nl/blog/from-wsl-to-bare-metal-linux/) found hardware support on a ThinkPad stellar, with a working system minutes after the installer. Others hit trouble. None of the following happened to me, but they're worth knowing about before you try this yourself:

- **NVIDIA on first boot.** A [GitHub issue](https://github.com/basecamp/omarchy/issues/4) describes Hyprland stuck in a loop after install on an RTX 4060 Ti, fixed by installing the NVIDIA drivers from a TTY.
- **Arch underneath.** Omarchy is Arch with opinionated defaults, so you get the rolling release and its sharp edges too. The same blogger thinks Ubuntu Desktop or Fedora KDE would take less tinkering.
- **Gaming.** Compatibility depends on the game, anti-cheat and launcher, so keep a fallback if that matters to you.

These are individual reports, not proper testing, so treat them as anecdote. The sensible advice is what I did by accident: try it on a spare drive first, and check audio and displays before you commit.

## Where I am now

For now I'm booting Omarchy. Ubuntu is still on its own drive if I need it.

I'm not done learning it, and I'll keep updating this post as I experiment. But so far I'm enjoying it, and it's a good reminder that the best way to learn something is to make yourself live in it.
