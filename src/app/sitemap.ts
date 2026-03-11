import { MetadataRoute } from 'next';
import { getPayload } from 'payload';
import config from '../payload.config';

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.finverse.top';

  // 1. 静态路由
  const routes = [
    '',
    '/about',
    '/contact',
    '/services/container',
    '/services/warehouse',
    '/articles',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. 动态路由 (文章)
  let articleRoutes: any[] = [];
  try {
    const payload = await getPayload({ config });
    const articles = await payload.find({
      collection: 'articles',
      limit: 1000,
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    articleRoutes = articles.docs.map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error fetching articles for sitemap:', error);
  }

  return [...routes, ...articleRoutes];
}
