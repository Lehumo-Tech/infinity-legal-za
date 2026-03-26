export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://infinitylegal.org'
  const now = new Date().toISOString()

  // Public pages
  const publicPages = [
    { url: '/', changeFrequency: 'weekly', priority: 1.0 },
    { url: '/intake', changeFrequency: 'monthly', priority: 0.9 },
    { url: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/book-consultation', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/contact', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/apply', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/help', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/login', changeFrequency: 'yearly', priority: 0.4 },
    { url: '/signup', changeFrequency: 'yearly', priority: 0.4 },
    // Legal pages
    { url: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { url: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { url: '/cookie-policy', changeFrequency: 'yearly', priority: 0.2 },
    { url: '/disclaimer', changeFrequency: 'yearly', priority: 0.2 },
    { url: '/compliance', changeFrequency: 'yearly', priority: 0.3 },
    // Attorney pages
    { url: '/attorney/login', changeFrequency: 'yearly', priority: 0.4 },
    { url: '/attorney/signup', changeFrequency: 'yearly', priority: 0.4 },
    { url: '/attorney/code-of-conduct', changeFrequency: 'yearly', priority: 0.3 },
  ]

  return publicPages.map(page => ({
    url: `${baseUrl}${page.url}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}
