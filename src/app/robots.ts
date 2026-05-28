import { MetadataRoute } from 'next';
import { getSiteUrl } from '../lib/site';

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ['/api/', '/_next/', '/static/', '/admin/', '/knowledge-admin'];
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'Sogou web spider',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: '360Spider',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'Bytespider',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'Doubaobot',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'DoubaoBot',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: privatePaths,
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
