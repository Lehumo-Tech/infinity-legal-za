import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/portal/', '/admin/', '/attorney/'],
      },
    ],
    sitemap: 'https://infinitylegal.co.za/sitemap.xml',
  }
}
