const toInt = (ip: string): number | null => {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || Number(part) > 255) return null;
    n = n * 256 + Number(part);
  }
  return n;
};

const toIp = (n: number) => [24, 16, 8, 0].map(shift => (n >>> shift) & 255).join('.');

const maskFor = (prefix: number) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);

const presets = [
  { label: 'Home /24', ip: '192.168.1.181', prefix: 24 },
  { label: 'Hyper-V /20', ip: '172.24.160.1', prefix: 20 },
  { label: 'Azure VNet /16', ip: '10.0.0.4', prefix: 16 },
];

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 font-mono text-sm text-zinc-100 focus:outline-none focus:border-zinc-500';
const labelClass = 'block font-mono text-xs text-zinc-500 uppercase tracking-widest mb-2';

class SubnetCalc extends HTMLElement {
  connectedCallback() {
    const ip = this.getAttribute('ip') ?? presets[0].ip;
    const prefix = this.getAttribute('prefix') ?? String(presets[0].prefix);

    this.innerHTML = `
      <div class="not-prose my-10 rounded-lg overflow-hidden border border-zinc-800">
        <div class="bg-zinc-900 px-4 py-2 flex items-center gap-2 border-b border-zinc-800">
          <span class="w-3 h-3 rounded-full bg-red-500/70"></span>
          <span class="w-3 h-3 rounded-full bg-yellow-500/70"></span>
          <span class="w-3 h-3 rounded-full bg-green-500/70"></span>
          <span class="font-mono text-xs text-zinc-500 ml-2">subnet-calc</span>
        </div>
        <div class="bg-zinc-950 p-5 space-y-6">
          <div class="flex flex-wrap gap-2">
            ${presets
              .map(
                p =>
                  `<button type="button" data-ip="${p.ip}" data-prefix="${p.prefix}" class="font-mono text-xs text-zinc-400 border border-zinc-800 rounded px-2.5 py-1 hover:border-zinc-500 hover:text-zinc-100 transition-colors cursor-pointer">${p.label}</button>`,
              )
              .join('')}
          </div>

          <div class="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <div>
              <label class="${labelClass}" for="sc-ip">Address</label>
              <input id="sc-ip" data-el="ip" class="${inputClass}" value="${ip}" inputmode="decimal" autocomplete="off" spellcheck="false" />
            </div>
            <div>
              <label class="${labelClass}" for="sc-prefix">Locked bits <span data-el="prefix-out" class="text-green-400 normal-case"></span></label>
              <input id="sc-prefix" data-el="prefix" type="range" min="1" max="32" step="1" value="${prefix}" class="w-full accent-green-400 mt-2" />
            </div>
          </div>
          <p data-el="error" class="font-mono text-xs text-red-400 hidden">That's not a valid IPv4 address. Four numbers, 0 to 255, separated by dots.</p>

          <div data-el="body" class="space-y-6">
            <div>
              <div data-el="bits" class="grid grid-cols-2 sm:grid-cols-4 gap-3"></div>
              <div class="flex gap-4 font-mono text-xs text-zinc-500 mt-3">
                <span><span class="inline-block w-2.5 h-2.5 rounded-sm bg-green-400 mr-1.5"></span>network (locked)</span>
                <span><span class="inline-block w-2.5 h-2.5 rounded-sm bg-zinc-700 mr-1.5"></span>device (free)</span>
              </div>
            </div>

            <dl data-el="stats" class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 font-mono text-sm"></dl>

            <div class="border-t border-zinc-800 pt-5">
              <label class="${labelClass}" for="sc-other">Is this address a neighbour?</label>
              <input id="sc-other" data-el="other" class="${inputClass} sm:max-w-xs" value="192.168.2.44" inputmode="decimal" autocomplete="off" spellcheck="false" />
              <p data-el="verdict" class="font-mono text-sm mt-3"></p>
            </div>
          </div>
        </div>
      </div>`;

    this.addEventListener('input', () => this.update());
    this.addEventListener('click', e => {
      const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-ip]');
      if (!button) return;
      this.el<HTMLInputElement>('ip').value = button.dataset.ip!;
      this.el<HTMLInputElement>('prefix').value = button.dataset.prefix!;
      this.update();
    });
    this.update();
  }

  el<T extends HTMLElement>(name: string) {
    return this.querySelector<T>(`[data-el="${name}"]`)!;
  }

  update() {
    const ip = toInt(this.el<HTMLInputElement>('ip').value);
    const prefix = Number(this.el<HTMLInputElement>('prefix').value);
    this.el('prefix-out').textContent = `/${prefix}`;
    this.el('error').classList.toggle('hidden', ip !== null);
    this.el('body').classList.toggle('hidden', ip === null);
    if (ip === null) return;

    const mask = maskFor(prefix);
    const network = (ip & mask) >>> 0;
    const broadcast = (network | ~mask) >>> 0;
    const total = 2 ** (32 - prefix);
    const usable = prefix >= 31 ? total : total - 2;
    const first = prefix >= 31 ? network : network + 1;
    const last = prefix >= 31 ? broadcast : broadcast - 1;

    this.el('bits').innerHTML = [0, 1, 2, 3]
      .map(octet => {
        const value = (ip >>> (24 - octet * 8)) & 255;
        const cells = Array.from({ length: 8 }, (_, i) => {
          const locked = octet * 8 + i < prefix;
          const bit = (value >> (7 - i)) & 1;
          return `<span class="flex-1 h-7 flex items-center justify-center rounded-sm text-xs ${locked ? 'bg-green-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}">${bit}</span>`;
        }).join('');
        return `<div class="font-mono"><div class="flex gap-0.5">${cells}</div><div class="text-xs text-zinc-500 text-center mt-1">${value}</div></div>`;
      })
      .join('');

    const rows: [string, string][] = [
      ['Mask', toIp(mask)],
      ['Network', `${toIp(network)}/${prefix}`],
      ['First usable', toIp(first)],
      ['Last usable', toIp(last)],
      ['Broadcast', prefix >= 31 ? 'none' : toIp(broadcast)],
      ['Total addresses', total.toLocaleString('en-GB')],
      ['Usable', usable.toLocaleString('en-GB')],
      ['Usable in Azure', prefix <= 29 ? (total - 5).toLocaleString('en-GB') : 'too small'],
    ];
    this.el('stats').innerHTML = rows
      .map(
        ([term, value]) =>
          `<div class="flex justify-between gap-4 border-b border-zinc-900 py-1"><dt class="text-zinc-500">${term}</dt><dd class="text-zinc-100">${value}</dd></div>`,
      )
      .join('');

    const other = toInt(this.el<HTMLInputElement>('other').value);
    const verdict = this.el('verdict');
    if (other === null) {
      verdict.className = 'font-mono text-sm mt-3 text-zinc-500';
      verdict.textContent = 'Type an IPv4 address to check.';
    } else if ((other & mask) >>> 0 === network) {
      verdict.className = 'font-mono text-sm mt-3 text-green-400';
      verdict.textContent = '✓ Neighbour. Delivered directly.';
    } else {
      verdict.className = 'font-mono text-sm mt-3 text-yellow-300';
      verdict.textContent = '→ Not a neighbour. Handed to the default gateway.';
    }
  }
}

if (!customElements.get('subnet-calc')) customElements.define('subnet-calc', SubnetCalc);
