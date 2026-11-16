---
title: "Reading drive health before you trust a drive"
description: "I plugged a pile of old drives into a NAS build and checked each one with SMART. Here is how to read the output, and what I did when one turned out to be failing."
tags: ["linux", "storage", "homelab", "smart"]
pubDate: 2026-11-16
draft: false
---

I'm building a NAS, and I have a drawer of old drives from dead laptops that could be the boot drive. Until now my test for whether an old drive was fine was whether it showed up. That isn't much of a test, so before any of them goes near the build I checked each one properly.

Every drive keeps its own health report, called SMART, and `smartctl` will print it. This is how to read it, using the drives I actually checked, including one that turned out to be failing.

## Running the check

```bash
sudo pacman -S smartmontools
sudo smartctl -a /dev/sdX
```

Swap `sdX` for the drive. `lsblk -o NAME,SIZE,TRAN,MODEL` shows which letter is which. It needs root, which catches you out the first time.

If the drive is plugged in over a USB adapter, add `-d sat`:

```bash
sudo smartctl -d sat -a /dev/sdb
```

A self-test is worth running as well. The short one takes a couple of minutes:

```bash
sudo smartctl -t short /dev/sdX
sudo smartctl -l selftest /dev/sdX
```

## What matters on a hard drive

Ignore most of the table. These are the lines I look at:

- **Reallocated_Sector_Ct, Current_Pending_Sector, Offline_Uncorrectable.** All three should be 0. A rising number means the surface is failing.
- **Power_On_Hours.** How much use it has had. 8,760 hours is a year of running 24/7.
- **Load_Cycle_Count.** Laptop drives park their heads constantly and are rated for roughly 300,000 to 600,000 parks.
- **UDMA_CRC_Error_Count.** These point at the cable or connector, not the drive.
- **The overall result.** `PASSED` is the minimum, not a guarantee.

## Numbers that look scary but are not

My Seagate showed a raw read error rate of 2,579,954 and a seek error rate of 3,234,882. That looks like a drive on its last legs. It isn't. Seagate packs several values into those raw numbers. What counts is the normalised value next to the threshold, and here those were 64 against 6 and 65 against 45. Comfortably fine.

NVMe drives do something similar. Mine reported 11,708 error log entries, and every one was `Invalid Field in Command`. That is the drive refusing a query it doesn't support, usually from monitoring software. It is not a fault. The number that would have mattered is `Media and Data Integrity Errors`, and that was 0.

## NVMe drives

The useful lines are different:

- **Percentage Used** and **Available Spare**
- **Media and Data Integrity Errors**
- **Critical Warning**
- **Data Units Written**, compared with the drive's TBW rating

## The drives I checked

| Drive | Verdict |
|---|---|
| Seagate BarraCuda 3TB | Healthy: zero bad sectors, 10,558 hours, 33°C. But it is an SMR drive, so it does not belong in a ZFS pool |
| Toshiba 1TB laptop hard drive | Passed, but 489,478 load cycles is close to its limit. A spare, not a boot drive |
| Crucial P3 1TB NVMe | 7% used after 23.6TB written. Fine |
| 2016 SK hynix 128GB M.2 SATA | Failing. Details below |

The SMR point is worth knowing. SMR drives are fine for a desktop or backups, but they struggle with the heavy writes of a ZFS rebuild. SMART will not tell you that, but the model family line near the top of the output sometimes does.

The Toshiba is a good example of why the whole report matters. It passed, and every sector count was zero, yet the load cycle count says the heads are nearly worn out. I would still not trust it as a boot drive.

## When a drive is failing

The SK hynix was the system drive from an old laptop. I put it in a USB adapter, tried to mount it read-only, and the mount hung. `journalctl -k` showed why:

```
Medium Error: Unrecovered read error
critical medium error, dev sdb, sector 1085024
uas_eh_host_reset_handler start
```

The first two lines are the drive itself saying it cannot read some of its data. The third is the USB adapter resetting. A bad adapter gives resets and timeouts, not "medium error" with a sector number. Moving to another port and another USB mode did not change the errors, so it was the drive.

Here is what I'd do again:

**Stop retrying the mount.** Every retry stresses a drive that is already struggling. Copy it first with `ddrescue`, which reads what it can, skips what it can't, and keeps a map file so you can stop and resume:

```bash
sudo ddrescue -d -n /dev/sdb ~/image.img ~/image.map
```

The source drive is only ever read.

**Check the adapter.** My adapter used a JMicron JMS578 chip, which is known for dropping out in UAS mode. Forcing the plain USB storage driver stopped the resets:

```bash
echo "152d:0578:u" | sudo tee /sys/module/usb_storage/parameters/quirks
```

The first part is the adapter's USB ID from `lsusb`. Unplug and replug after setting it.

**Stop automounting.** `udiskie --automount` was quietly reading the drive's partitions as soon as I plugged it in. Stop it first, so nothing else touches the drive.

**Copy the important part first.** Copying a failing drive end to end is slow and may never finish. This one managed about 1MB/s at best. On an NTFS drive the file index (the MFT) is the part that matters, because it records where every file is. The boot sector tells you where it starts: the start cluster times sectors per cluster times bytes per sector. For mine that was 786432 x 8 x 512, which is 3 GiB into the partition. I copied just that region with `ddrescue -i` and `-s`.

I got about 20% of it back. Enough to read the file index directly and list 32,000 files by name, without ever mounting the filesystem, but not enough to get at the data itself. That was the point where I stopped.

The lesson is the boring one. A drive that is slow and throwing medium errors is already failing. If something on it matters, copy it as soon as you see the first error, not after a few rounds of retries.

## Two smaller gotchas

- **An M.2 SATA drive in an NVMe-only slot is silently invisible.** The drive shows up nowhere, with no error. The NVMe slot on the firewall box I'm building and the ones on my desktop board did not see it. If your M.2 drive has two notches in its edge connector, it is SATA, and you may need an adapter.
- **A drive does not need to be formatted to be detected.** I wondered if that was why it wasn't showing up. It wasn't. Detection happens before the system looks at any data.

## What I'd do differently

Run SMART on every drive before it goes anywhere near a build. It takes a minute per drive. The one that failed would have shown pending sectors and a poor self-test before I wasted an evening on it.
