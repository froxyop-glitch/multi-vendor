import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://shopezy.com';

  let productEntries: any[] = [];
  let categoryEntries: any[] = [];

  try {
    const res = await fetch('http://localhost:5000/api/v1/seo/sitemap-data', { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      productEntries = (data.products || []).map((p: any) => ({
        url: `${baseUrl}/product/${p.slug}`,
        lastModified: new Date(p.updatedAt || new Date()),
        changeFrequency: 'daily',
        priority: 0.9,
      }));
      categoryEntries = (data.categories || []).map((c: any) => ({
        url: `${baseUrl}/products?category=${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch {}

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...categoryEntries,
    ...productEntries,
  ];
}
