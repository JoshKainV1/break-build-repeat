import { useEffect, useMemo, useRef, useState } from 'react';
import { TECH, RINGS, RING_ORDER, TOPO, EDGES, type Ring, type Tech } from '../lib/radar';

type Sort = 'ring' | 'stack' | 'az';
type View = 'rack' | 'topo';

const UNIT_H = 44;
const GAP = 4;
const EXTRA_H = 116;

const NODE_W = 116;
const NODE_H = 36;
const TOPO_TOP = 30;
const TOPO_ROW = 84;
const TOPO_ROWS = 7;
const TOPO_MIN_W = 760;
const TOPO_H = TOPO_TOP * 2 + (TOPO_ROWS - 1) * TOPO_ROW;

const STACK_ORDER = ['Languages', 'Frontend', 'Infrastructure', 'AI'];

const LED: Record<Ring, { color: string; glow: string; anim: string }> = {
  adopt: { color: 'bg-green-400', glow: 'shadow-[0_0_8px_1px_rgba(74,222,128,0.7)]', anim: 'rack-breathe 3s ease-in-out infinite' },
  trial: { color: 'bg-amber-400', glow: 'shadow-[0_0_8px_1px_rgba(251,191,36,0.6)]', anim: '' },
  assess: { color: 'bg-sky-400', glow: 'shadow-[0_0_8px_1px_rgba(56,189,248,0.6)]', anim: 'rack-blink 1.4s steps(1) infinite' },
  hold: { color: 'bg-zinc-600', glow: '', anim: '' },
};

const sorters: Record<Sort, (a: Tech, b: Tech) => number> = {
  ring: (a, b) => RING_ORDER.indexOf(a.ring) - RING_ORDER.indexOf(b.ring) || a.name.localeCompare(b.name),
  stack: (a, b) => STACK_ORDER.indexOf(a.stack) - STACK_ORDER.indexOf(b.stack) || RING_ORDER.indexOf(a.ring) - RING_ORDER.indexOf(b.ring),
  az: (a, b) => a.name.localeCompare(b.name),
};

const SORT_LABEL: Record<Sort, string> = { ring: 'by ring', stack: 'by stack', az: 'a–z' };
const VIEW_LABEL: Record<View, string> = { rack: 'rack', topo: 'topology' };

const neighbours = new Map<string, Set<string>>();
for (const [a, b] of EDGES) {
  if (!neighbours.has(a)) neighbours.set(a, new Set());
  if (!neighbours.has(b)) neighbours.set(b, new Set());
  neighbours.get(a)!.add(b);
  neighbours.get(b)!.add(a);
}

const topoY = (r: number) => TOPO_TOP + r * TOPO_ROW;

export default function TechRack() {
  const [view, setView] = useState<View>('rack');
  const [sort, setSort] = useState<Sort>('ring');
  const [open, setOpen] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [powered, setPowered] = useState(0);
  const [width, setWidth] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const ordered = useMemo(() => [...TECH].sort(sorters[sort]), [sort]);
  const topo = view === 'topo';

  // Boot sequence: units power on one after another.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPowered(TECH.length);
      return;
    }
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setPowered(n);
      if (n >= TECH.length) clearInterval(id);
    }, 70);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    const pos = new Map<string, { x: number; y: number; w: number | string; h: number; rank: number }>();
    if (topo) {
      ordered.forEach((t, rank) => {
        const p = TOPO[t.name];
        const cx = (p.x / 100) * Math.max(width, TOPO_MIN_W);
        pos.set(t.name, { x: cx - NODE_W / 2, y: topoY(p.r) - NODE_H / 2, w: NODE_W, h: NODE_H, rank });
      });
      return { pos, total: TOPO_H };
    }
    let y = 0;
    ordered.forEach((t, rank) => {
      const h = UNIT_H + (open === t.name ? EXTRA_H : 0);
      pos.set(t.name, { x: 0, y, w: '100%', h, rank });
      y += h + GAP;
    });
    return { pos, total: y - GAP };
  }, [ordered, open, topo, width]);

  const counts = useMemo(
    () => RING_ORDER.map(r => ({ ring: r, n: TECH.filter(t => t.ring === r).length })),
    [],
  );

  const focus = hover ?? open;
  const focusSet = focus ? new Set([focus, ...(neighbours.get(focus) ?? [])]) : null;
  const selected = open ? TECH.find(t => t.name === open) : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex flex-wrap gap-3 font-mono text-xs">
          <div className="flex gap-1" role="group" aria-label="View">
            {(Object.keys(VIEW_LABEL) as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`px-3 py-1.5 rounded border transition-colors ${
                  view === v
                    ? 'border-green-400/60 text-green-400 bg-zinc-900'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                }`}
              >
                {VIEW_LABEL[v]}
              </button>
            ))}
          </div>
          <div
            className={`flex gap-1 transition-opacity duration-300 ${topo ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            role="group"
            aria-label="Sort rack"
          >
            {(Object.keys(SORT_LABEL) as Sort[]).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={sort === s}
                tabIndex={topo ? -1 : 0}
                className={`px-3 py-1.5 rounded border transition-colors ${
                  sort === s
                    ? 'border-zinc-500 text-zinc-100 bg-zinc-900'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                }`}
              >
                {SORT_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-zinc-500">
          {counts.map(({ ring, n }) => (
            <span key={ring} className="flex items-center gap-2" title={RINGS[ring].blurb}>
              <span className={`w-2 h-2 rounded-full ${LED[ring].color} ${LED[ring].glow}`} />
              {RINGS[ring].label} <span className="text-zinc-600">{n}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-4 sm:px-5 overflow-hidden">
        {/* scan line */}
        <div
          aria-hidden="true"
          className="rack-anim pointer-events-none absolute inset-x-0 top-0 h-full z-10"
          style={{ animation: 'rack-scan 7s linear infinite' }}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-green-400/40 to-transparent" />
          <div className="h-8 bg-gradient-to-b from-green-400/[0.04] to-transparent" />
        </div>

        <div className={topo ? 'overflow-x-auto' : ''}>
          <div
            ref={stageRef}
            className="relative rack-anim transition-[height] duration-500"
            style={{ height: layout.total, minWidth: topo ? TOPO_MIN_W : undefined }}
          >
            {/* links */}
            <svg
              aria-hidden="true"
              className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700 ${topo ? 'opacity-100 delay-300' : 'opacity-0'}`}
            >
              {EDGES.map(([a, b]) => {
                const pa = TOPO[a];
                const pb = TOPO[b];
                const lit = focus !== null && (a === focus || b === focus);
                return (
                  <line
                    key={`${a}-${b}`}
                    x1={`${pa.x}%`}
                    y1={topoY(pa.r)}
                    x2={`${pb.x}%`}
                    y2={topoY(pb.r)}
                    className="rack-anim"
                    stroke={lit ? '#4ade80' : '#3f3f46'}
                    strokeOpacity={focus && !lit ? 0.3 : 1}
                    strokeWidth={lit ? 1.5 : 1}
                    strokeDasharray="4 6"
                    style={{ animation: 'rack-flow 1.2s linear infinite', transition: 'stroke 200ms, stroke-opacity 200ms' }}
                  />
                );
              })}
            </svg>

            {ordered.map(t => {
              const p = layout.pos.get(t.name)!;
              const on = p.rank < powered || powered >= TECH.length;
              const isOpen = open === t.name;
              const led = LED[t.ring];
              const dim = topo && focusSet !== null && !focusSet.has(t.name);
              return (
                <div
                  key={t.name}
                  className="rack-anim absolute left-0 top-0"
                  style={{
                    transform: `translate(${p.x}px, ${p.y}px)`,
                    width: p.w,
                    height: p.h,
                    transition: `transform 700ms cubic-bezier(0.22, 1, 0.36, 1) ${p.rank * 12}ms, width 500ms ease, height 350ms ease`,
                  }}
                  onMouseEnter={() => setHover(t.name)}
                  onMouseLeave={() => setHover(null)}
                >
                  <div
                    className={`h-full overflow-hidden rounded border transition-all duration-300 ${
                      isOpen ? 'border-zinc-600 bg-zinc-900' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                    } ${on ? (dim ? 'opacity-30' : 'opacity-100') : 'opacity-30'}`}
                  >
                    <button
                      onClick={() => setOpen(isOpen ? null : t.name)}
                      onFocus={() => setHover(t.name)}
                      onBlur={() => setHover(null)}
                      aria-expanded={isOpen}
                      className={`w-full flex items-center gap-3 text-left ${topo ? 'px-2.5' : 'px-3'}`}
                      style={{ height: topo ? NODE_H : UNIT_H }}
                    >
                      {!topo && (
                        <span className="font-mono text-[10px] text-zinc-700 w-7 shrink-0 tabular-nums">
                          U{String(p.rank + 1).padStart(2, '0')}
                        </span>
                      )}
                      <span
                        className={`rack-anim w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-500 ${
                          on ? `${led.color} ${led.glow}` : 'bg-zinc-800'
                        }`}
                        style={{ animation: on ? led.anim : 'none', animationDelay: `${(p.rank % 5) * 0.3}s` }}
                      />
                      <span className={`font-mono text-zinc-100 truncate ${topo ? 'text-xs' : 'text-sm'}`}>{t.name}</span>
                      {!topo && (
                        <>
                          <span className="ml-auto hidden sm:block font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                            {t.stack}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 w-14 text-right shrink-0">
                            {RINGS[t.ring].label}
                          </span>
                          <span className="hidden sm:flex gap-1 shrink-0" aria-hidden="true">
                            {[0, 1].map(i => (
                              <span
                                key={i}
                                className="rack-anim w-1 h-1 rounded-full bg-zinc-600"
                                style={{
                                  animation: on && t.ring !== 'hold' ? `rack-blink ${0.9 + ((p.rank * 7 + i * 3) % 10) / 10}s steps(1) infinite` : 'none',
                                  animationDelay: `${((p.rank * 3 + i) % 7) / 10}s`,
                                }}
                              />
                            ))}
                          </span>
                        </>
                      )}
                    </button>

                    {!topo && <Detail tech={t} className="px-3 pb-3 pl-[3.9rem]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {topo && (
        <div className="mt-4 rounded-lg border border-zinc-800 px-4 py-3 min-h-[8.5rem]">
          {selected ? (
            <>
              <p className="font-mono text-sm text-zinc-100 mb-1">{selected.name}</p>
              <Detail tech={selected} />
            </>
          ) : (
            <p className="font-mono text-xs text-zinc-600">Hover a node to trace its links, click to pin it.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ tech, className = '' }: { tech: Tech; className?: string }) {
  return (
    <div className={`text-sm ${className}`}>
      <p className="text-zinc-400 leading-relaxed">{tech.note}</p>
      <p className="font-mono text-[11px] text-zinc-600 mt-1">
        {RINGS[tech.ring].label} · {RINGS[tech.ring].blurb}
      </p>
      {tech.projects && tech.projects.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 font-mono text-xs">
          {tech.projects.map(slug => (
            <a key={slug} href={`/projects/${slug}`} className="text-green-400 hover:underline">
              ./{slug}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
