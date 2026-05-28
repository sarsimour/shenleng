import { MetadataRoute } from 'next';
import { getPayload } from 'payload';
import config from '../payload.config';
import { getSiteUrl, publicSiteRoutes } from '../lib/site';

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  // 1. 静态路由
  const routes = publicSiteRoutes.map((route) => ({
    url: `${baseUrl}${route.path === "/" ? "" : route.path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route.path === '/' ? 1 : route.path.startsWith('/services/') ? 0.85 : 0.8,
  }));

  // 2. 动态路由 (文章)
  let articleRoutes: MetadataRoute.Sitemap = [];
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
