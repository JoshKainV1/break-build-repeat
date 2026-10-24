export type Ring = 'adopt' | 'trial' | 'assess' | 'hold';
export type Stack = 'Languages' | 'Frontend' | 'Infrastructure' | 'AI';

export interface Tech {
  name: string;
  ring: Ring;
  stack: Stack;
  note: string;
  projects?: string[]; // slugs in src/content/projects
}

export const RINGS: Record<Ring, { label: string; blurb: string }> = {
  adopt: { label: 'Adopt', blurb: 'Daily drivers. I reach for these by default.' },
  trial: { label: 'Trial', blurb: 'In real use, still forming opinions.' },
  assess: { label: 'Assess', blurb: 'On the bench. Learning it properly.' },
  hold: { label: 'Hold', blurb: 'Know it well, would not start new work with it.' },
};

export const RING_ORDER: Ring[] = ['adopt', 'trial', 'assess', 'hold'];

export const TECH: Tech[] = [
  { name: 'C#', ring: 'adopt', stack: 'Languages', note: 'Years of production use at ShareDo and Clio.', projects: ['family-hub', 'onboard'] },
  { name: 'JavaScript', ring: 'adopt', stack: 'Languages', note: 'Front end, scripts and the odd automation.', projects: ['zendesk-azure-devops-cab-linear-bridge'] },
  { name: 'SQL', ring: 'adopt', stack: 'Languages', note: 'Still the most useful language I know.' },
  { name: 'Python', ring: 'trial', stack: 'Languages', note: 'Mostly the AI side projects.', projects: ['rag-from-scratch', 'llamaindex-agent'] },
  { name: 'Bash', ring: 'trial', stack: 'Languages', note: 'Learning it properly instead of copy-pasting it.', projects: ['learning-bash'] },

  { name: 'React', ring: 'adopt', stack: 'Frontend', note: 'Interactive parts of this site and familyHub.', projects: ['family-hub', 'break-build-repeat'] },
  { name: 'Astro', ring: 'trial', stack: 'Frontend', note: 'Runs this site. Good fit for content.', projects: ['break-build-repeat'] },
  { name: 'Tailwind', ring: 'trial', stack: 'Frontend', note: 'Fast to work with, v4 is a nice step up.', projects: ['break-build-repeat'] },
  { name: 'KnockoutJS', ring: 'hold', stack: 'Frontend', note: 'Four years in it. Not starting anything new with it.' },

  { name: 'Docker', ring: 'adopt', stack: 'Infrastructure', note: 'Everything self-hosted runs in a container.', projects: ['family-hub'] },
  { name: 'Azure DevOps', ring: 'adopt', stack: 'Infrastructure', note: 'Pipelines and boards, day job.', projects: ['zendesk-azure-devops-cab-linear-bridge'] },
  { name: 'PostgreSQL', ring: 'trial', stack: 'Infrastructure', note: 'Behind familyHub and the pgvector experiments.', projects: ['family-hub', 'rag-from-scratch'] },
  { name: 'OPNsense', ring: 'trial', stack: 'Infrastructure', note: 'Network edge for the homelab.', projects: ['family-hub'] },
  { name: 'TrueNAS', ring: 'trial', stack: 'Infrastructure', note: 'Storage, with ZFS underneath.', projects: ['family-hub'] },
  { name: 'Proxmox', ring: 'assess', stack: 'Infrastructure', note: 'Virtualisation layer for the lab.', projects: ['homelab-kubernetes'] },
  { name: 'Kubernetes', ring: 'assess', stack: 'Infrastructure', note: 'k3s on the bench, managed with GitOps.', projects: ['homelab-kubernetes'] },
  { name: 'WireGuard', ring: 'assess', stack: 'Infrastructure', note: 'Next up for remote access to the lab.' },
  { name: 'IaC', ring: 'assess', stack: 'Infrastructure', note: 'Making the lab reproducible rather than hand-built.', projects: ['homelab-kubernetes'] },

  { name: 'RAG', ring: 'assess', stack: 'AI', note: 'Built from scratch with embeddings and pgvector.', projects: ['rag-from-scratch'] },
  { name: 'LLM agents', ring: 'assess', stack: 'AI', note: 'Tool-calling with LlamaIndex.', projects: ['llamaindex-agent'] },
  { name: 'LoRA / QLoRA', ring: 'assess', stack: 'AI', note: 'Fine-tuning experiments.', projects: ['lora-qlora-fine-tuning'] },
];

// Topology view: x is the node centre as a % of width, r is the row index.
export const TOPO: Record<string, { x: number; r: number }> = {
  'Azure DevOps': { x: 15, r: 0 },
  IaC: { x: 40, r: 0 },
  WireGuard: { x: 85, r: 0 },
  Bash: { x: 15, r: 1 },
  OPNsense: { x: 85, r: 1 },
  Proxmox: { x: 35, r: 2 },
  TrueNAS: { x: 75, r: 2 },
  Kubernetes: { x: 13, r: 3 },
  Docker: { x: 38, r: 3 },
  PostgreSQL: { x: 62, r: 3 },
  SQL: { x: 87, r: 3 },
  'C#': { x: 14, r: 4 },
  Python: { x: 40, r: 4 },
  JavaScript: { x: 66, r: 4 },
  RAG: { x: 9, r: 5 },
  'LLM agents': { x: 26, r: 5 },
  'LoRA / QLoRA': { x: 43, r: 5 },
  React: { x: 64, r: 5 },
  KnockoutJS: { x: 84, r: 5 },
  Astro: { x: 56, r: 6 },
  Tailwind: { x: 76, r: 6 },
};

export const EDGES: [string, string][] = [
  ['Azure DevOps', 'IaC'],
  ['Bash', 'IaC'],
  ['IaC', 'Proxmox'],
  ['IaC', 'Kubernetes'],
  ['OPNsense', 'WireGuard'],
  ['OPNsense', 'Proxmox'],
  ['OPNsense', 'TrueNAS'],
  ['Proxmox', 'TrueNAS'],
  ['Proxmox', 'Kubernetes'],
  ['Proxmox', 'Docker'],
  ['Kubernetes', 'Docker'],
  ['TrueNAS', 'PostgreSQL'],
  ['Docker', 'PostgreSQL'],
  ['PostgreSQL', 'SQL'],
  ['Docker', 'C#'],
  ['Docker', 'Python'],
  ['Docker', 'JavaScript'],
  ['Python', 'RAG'],
  ['Python', 'LLM agents'],
  ['Python', 'LoRA / QLoRA'],
  ['JavaScript', 'React'],
  ['JavaScript', 'KnockoutJS'],
  ['React', 'Astro'],
  ['React', 'Tailwind'],
];
