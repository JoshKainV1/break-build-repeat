import { useState, useMemo } from 'react';

type Status = 'live' | 'wip' | 'broken';

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: Status;
}

interface Props {
  projects: Project[];
}

const statusStyles: Record<Status, string> = {
  live: 'bg-green-900 text-green-300',
  wip: 'bg-yellow-900 text-yellow-300',
  broken: 'bg-red-900 text-red-300',
};

const statusLabel: Record<Status, string> = {
  live: 'Live',
  wip: 'In progress',
  broken: 'Gloriously broken',
};

export default function ProjectFilter({ projects }: Props) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<Status | null>(null);

  const allTags = useMemo(() =>
    [...new Set(projects.flatMap(p => p.tags))].sort(),
    [projects]
  );

  const filtered = useMemo(() =>
    projects.filter(p => {
      const matchesSearch = search === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchesTag = !activeTag || p.tags.includes(activeTag);
      const matchesStatus = !activeStatus || p.status === activeStatus;
      return matchesSearch && matchesTag && matchesStatus;
    }),
    [projects, search, activeTag, activeStatus]
  );

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">$</span>
        <input
          type="text"
          placeholder="search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className={`text-xs font-mono px-3 py-1 rounded transition-all ${
              activeTag === tag
                ? 'bg-zinc-100 text-zinc-950'
                : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
            }`}
          >
            {tag}
          </button>
        ))}
        {(['live', 'wip', 'broken'] as Status[]).map(s => (
          <button
            key={s}
            onClick={() => setActiveStatus(activeStatus === s ? null : s)}
            className={`text-xs font-mono px-3 py-1 rounded transition-all ${
              activeStatus === s
                ? statusStyles[s]
                : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
            }`}
          >
            {statusLabel[s]}
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="text-xs font-mono text-zinc-600 mb-6">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <p className="font-mono text-sm text-zinc-500 py-8 text-center">no projects match — try breaking fewer things</p>
        ) : (
          filtered.map(project => (
            <a
              key={project.id}
              href={`/projects/${project.id}`}
              className="group block border border-zinc-800 rounded-lg p-6 transition-all duration-300 hover:border-zinc-500 hover:shadow-[0_0_30px_-5px_rgba(161,161,170,0.15)] hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-zinc-100 group-hover:text-white transition-colors">{project.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded font-mono shrink-0 ml-3 ${statusStyles[project.status]}`}>
                  {statusLabel[project.status]}
                </span>
              </div>
              <p className="text-zinc-400 text-sm mb-4">{project.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors ml-4 shrink-0">Read more →</span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
