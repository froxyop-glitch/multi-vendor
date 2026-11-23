import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/seller/', '/checkout/', '/orders/'],
      },
    ],
    sitemap: 'https://shopezy.com/sitemap.xml',
  };
}
