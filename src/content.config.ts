import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    status: z.enum(['live', 'wip', 'broken']),
    featured: z.boolean().default(false),
    href: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const collections = { projects };
