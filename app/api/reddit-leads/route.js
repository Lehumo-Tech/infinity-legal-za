import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const SUBREDDITS = [
  'SouthAfrica',
]

const LEGAL_KEYWORDS = [
  'legal help', 'need lawyer', 'need attorney', 'legal advice',
  'CCMA', 'unfair dismissal', 'eviction', 'evict',
  'divorce', 'custody', 'maintenance',
  'arrested', 'criminal charge', 'bail',
  'landlord', 'tenant', 'lease',
  'labour dispute', 'retrenchment', 'UIF',
  'debt review', 'debt collector',
  'consumer complaint', 'refund',
  'contract dispute', 'sued', 'summons',
]

function parseRSSItems(xml) {
  const items = []
  // Match each <entry> block (Reddit RSS uses Atom format)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1]
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || ''
    const link = entry.match(/<link\s+href="([^"]+)"/)?.[1] || ''
    const author = entry.match(/<name>([\s\S]*?)<\/name>/)?.[1]?.trim() || 'anonymous'
    const updated = entry.match(/<updated>([\s\S]*?)<\/updated>/)?.[1]?.trim() || ''
    const content = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').trim() || ''
    const snippet = content.substring(0, 300) + (content.length > 300 ? '...' : '')

    if (title) {
      items.push({ title, link, author, updated, snippet })
    }
  }
  return items
}

function matchesLegalKeywords(item) {
  const text = `${item.title} ${item.snippet}`.toLowerCase()
  const matched = LEGAL_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()))
  return matched
}

function scoreRedditLead(item, matchedKeywords) {
  let score = 0
  if (matchedKeywords.includes('CCMA') || matchedKeywords.includes('unfair dismissal')) score += 3
  else if (matchedKeywords.includes('eviction') || matchedKeywords.includes('divorce') || matchedKeywords.includes('arrested')) score += 2
  else score += 1

  // Recency bonus
  if (item.updated) {
    const hours = (Date.now() - new Date(item.updated).getTime()) / (1000 * 60 * 60)
    if (hours < 6) score += 2
    else if (hours < 24) score += 1
    else if (hours < 72) score += 0.5
  }

  return Math.min(Math.round(score * 10) / 10, 5)
}

// GET /api/reddit-leads — Fetch and filter legal help posts from Reddit RSS
export async function GET() {
  try {
    const allPosts = []

    for (const sub of SUBREDDITS) {
      const feedUrl = `https://www.reddit.com/r/${sub}/search.rss?q=${encodeURIComponent('legal help OR lawyer OR CCMA OR eviction OR divorce OR unfair dismissal')}&restrict_sr=1&sort=new&limit=50`
      
      try {
        const res = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'InfinityLegal/1.0 (Legal Research Tool)',
          },
          next: { revalidate: 3600 }, // Cache 1 hour
        })
        
        if (!res.ok) {
          console.warn(`Reddit RSS fetch failed for r/${sub}: ${res.status}`)
          continue
        }
        
        const xml = await res.text()
        const items = parseRSSItems(xml)
        
        for (const item of items) {
          const matchedKeywords = matchesLegalKeywords(item)
          if (matchedKeywords.length > 0) {
            const score = scoreRedditLead(item, matchedKeywords)
            allPosts.push({
              ...item,
              subreddit: sub,
              matchedKeywords,
              score,
              priority: score >= 4 ? 'hot' : score >= 2.5 ? 'warm' : 'cool',
            })
          }
        }
      } catch (subError) {
        console.warn(`Error fetching r/${sub}:`, subError.message)
      }
    }

    // Sort by score descending
    allPosts.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      success: true,
      total: allPosts.length,
      subreddits: SUBREDDITS,
      lastFetched: new Date().toISOString(),
      disclaimer: 'These are public posts from Reddit. Only respond to public requests for help. Always link to the POPIA consent form. Do not send unsolicited DMs.',
      posts: allPosts,
    })
  } catch (error) {
    console.error('Reddit leads error:', error)
    return NextResponse.json({ error: 'Failed to fetch Reddit leads', details: error.message }, { status: 500 })
  }
}
