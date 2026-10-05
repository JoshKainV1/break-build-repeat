import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/blog';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  const site = context.site!.href.replace(/\/$/, '');

  return rss({
    title: 'break.build.repeat',
    description: 'Notes from learning networking, Azure, Bash and system design by doing.',
    site,
    items: posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: post.data.tags,
      link: `/blog/${post.id}/`,
      content: post.rendered?.html.replaceAll('href="/', `href="${site}/`),
    })),
  });
}
