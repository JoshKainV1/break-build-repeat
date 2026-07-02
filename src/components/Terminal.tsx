import { useState, useRef, useEffect } from 'react';

const projects = [
  { name: 'family-hub', status: 'wip', tags: ['homelab', 'Docker', 'C#', 'React'] },
  { name: 'break-build-repeat', status: 'live', tags: ['Astro', 'React', 'Tailwind'] },
];

const COMMANDS: Record<string, () => string[]> = {
  help: () => [
    '  Available commands:',
    '  <span class="text-green-400">ls projects</span>       list all projects',
    '  <span class="text-green-400">cat about.md</span>      who is josh kain',
    '  <span class="text-green-400">cat skills.md</span>     tech stack',
    '  <span class="text-green-400">homelab</span>           lab status',
    '  <span class="text-green-400">./contact.sh</span>      get in touch',
    '  <span class="text-green-400">whoami</span>            current user',
    '  <span class="text-green-400">clear</span>             clear terminal',
  ],
  whoami: () => ['josh-kain — systems engineer, tinkerer, professional breaker of things'],
  'ls projects': () => [
    'total ' + projects.length,
    ...projects.map(p =>
      `<span class="${p.status === 'live' ? 'text-green-400' : 'text-yellow-400'}">${p.name}/</span>  [${p.status}]  ${p.tags.join(', ')}`
    ),
  ],
  'cat about.md': () => [
    '# Josh Kain',
    '',
    'Systems Engineer @ Clio — Manchester, UK',
    'Previously: Software Developer @ ShareDo (4.5 yrs), Brainboxes',
    '',
    '<span class="text-zinc-500">"Move fast where you can.</span>',
    '<span class="text-zinc-500"> Never rush the infrastructure."</span>',
    '',
    'Homelabber. Tinkerer. Occasional arsonist (of code).',
  ],
  'cat skills.md': () => [
    '## Languages',
    '  JavaScript  Python  C#  SQL  HTML  CSS',
    '',
    '## Frontend',
    '  React  Astro  Tailwind  KnockoutJS',
    '',
    '## Infrastructure',
    '  Docker  Azure DevOps  OPNsense  TrueNAS  ZFS',
    '',
    '## Currently learning',
    '  IaC  WireGuard  Proxmox  Kubernetes',
  ],
  homelab: () => [
    '# Homelab — build in progress',
    '',
    '  UNIT        ROLE                     STATUS',
    '  proxmox     hypervisor               <span class="text-yellow-400">building</span>',
    '  opnsense    router / firewall        <span class="text-yellow-400">planned</span>',
    '  truenas     storage (ZFS)            <span class="text-yellow-400">planned</span>',
    '  family-hub  self-hosted services     <span class="text-yellow-400">wip</span>',
    '',
    '<span class="text-zinc-500">Nothing is on fire yet. Give it time.</span>',
  ],
  './contact.sh': () => [
    'Opening contact channels...',
    '',
    '  <span class="text-green-400">GitHub</span>   → <a href="https://github.com/JoshKainV1" target="_blank" class="underline text-zinc-300 hover:text-white">github.com/JoshKainV1</a>',
    '  <span class="text-green-400">Email</span>    → <a href="mailto:jkainV7@gmail.com" class="underline text-zinc-300 hover:text-white">jkainV7@gmail.com</a>',
  ],
};

const BOOT_LINES = [
  'break.build.repeat v1.0.0',
  'Type <span class="text-green-400">help</span> to see available commands.',
  '',
];

type Line = { html: string; isCommand?: boolean };

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>(BOOT_LINES.map(html => ({ html })));
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const run = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    const newLines: Line[] = [
      { html: `<span class="text-zinc-500">$</span> ${cmd}`, isCommand: true },
    ];

    if (trimmed === 'clear') {
      setLines(BOOT_LINES.map(html => ({ html })));
      return;
    }

    const output = COMMANDS[trimmed];
    if (output) {
      newLines.push(...output().map(html => ({ html })));
    } else if (trimmed === '') {
      // do nothing
    } else {
      newLines.push({ html: `<span class="text-red-400">command not found: ${cmd}</span>  (try <span class="text-green-400">help</span>)` });
    }

    setLines(prev => [...prev, ...newLines]);
    setHistory(prev => [cmd, ...prev]);
    setHistoryIndex(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      setInput(history[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(historyIndex - 1, -1);
      setHistoryIndex(next);
      setInput(next === -1 ? '' : history[next]);
    }
  };

  return (
    <div
      className="rounded-lg border border-zinc-800 overflow-hidden font-mono text-sm cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div className="bg-zinc-900 px-4 py-2.5 flex items-center gap-2 border-b border-zinc-800">
        <span className="w-3 h-3 rounded-full bg-red-500/70"></span>
        <span className="w-3 h-3 rounded-full bg-yellow-500/70"></span>
        <span className="w-3 h-3 rounded-full bg-green-500/70"></span>
        <span className="text-zinc-500 text-xs ml-2">josh@break-build-repeat ~ </span>
      </div>

      {/* Output */}
      <div className="bg-zinc-950 p-5 min-h-52 max-h-80 overflow-y-auto space-y-1">
        {lines.map((line, i) => (
          <p
            key={i}
            className="text-zinc-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: line.html || '&nbsp;' }}
          />
        ))}

        {/* Input line */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-zinc-500">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent text-zinc-100 outline-none caret-green-400"
            spellCheck={false}
            autoComplete="off"
            autoFocus
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
